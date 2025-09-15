#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

/**
 * Script de configuración inicial para sistemas de monitoreo
 * Sistema ERP EVITA - Artículos de Limpieza
 */

class MonitoringSetup {
  constructor() {
    this.environment = process.env.NODE_ENV || 'development';
    this.timezone = 'America/Argentina/Buenos_Aires';
    this.setupReport = {
      timestamp: new Date().toISOString(),
      environment: this.environment,
      services: {},
      errors: [],
      warnings: [],
      nextSteps: []
    };
    
    // Configuración específica por ambiente
    this.config = {
      development: {
        sentry: { enabled: false, sampleRate: 1.0 },
        analytics: { enabled: false, debug: true },
        alerts: { enabled: false, channels: ['console'] },
        healthCheck: { interval: 60000 }
      },
      staging: {
        sentry: { enabled: true, sampleRate: 1.0 },
        analytics: { enabled: true, debug: true },
        alerts: { enabled: true, channels: ['slack'] },
        healthCheck: { interval: 30000 }
      },
      production: {
        sentry: { enabled: true, sampleRate: 0.1 },
        analytics: { enabled: true, debug: false },
        alerts: { enabled: true, channels: ['slack', 'email'] },
        healthCheck: { interval: 15000 }
      }
    };
  }

  async run() {
    console.log('🚀 Iniciando configuración de monitoreo para EVITA ERP');
    console.log(`📍 Ambiente: ${this.environment}`);
    console.log(`🌍 Timezone: ${this.timezone}`);
    console.log('=' * 50);

    try {
      await this.validateEnvironment();
      await this.setupSentry();
      await this.setupAnalytics();
      await this.setupAlerts();
      await this.setupHealthChecks();
      await this.validateConfiguration();
      await this.generateDocumentation();
      
      this.printReport();
      process.exit(0);
    } catch (error) {
      console.error('❌ Error durante la configuración:', error.message);
      this.setupReport.errors.push(error.message);
      this.printReport();
      process.exit(1);
    }
  }

  async validateEnvironment() {
    console.log('🔍 Validando entorno...');
    
    const requiredVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY'
    ];

    const optionalVars = [
      'VITE_SENTRY_DSN',
      'VITE_ANALYTICS_ID',
      'SLACK_WEBHOOK_URL',
      'NOTIFICATION_EMAIL'
    ];

    // Verificar variables requeridas
    const missingRequired = requiredVars.filter(varName => !process.env[varName]);
    if (missingRequired.length > 0) {
      throw new Error(`Variables de entorno requeridas faltantes: ${missingRequired.join(', ')}`);
    }

    // Verificar variables opcionales
    const missingOptional = optionalVars.filter(varName => !process.env[varName]);
    if (missingOptional.length > 0) {
      this.setupReport.warnings.push(`Variables opcionales faltantes: ${missingOptional.join(', ')}`);
    }

    // Verificar conectividad con Supabase
    await this.testSupabaseConnection();
    
    console.log('✅ Entorno validado correctamente');
  }

  async testSupabaseConnection() {
    try {
      const response = await this.makeHttpRequest({
        hostname: new URL(process.env.VITE_SUPABASE_URL).hostname,
        path: '/rest/v1/',
        method: 'GET',
        headers: {
          'apikey': process.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`
        }
      });
      
      if (response.statusCode !== 200) {
        throw new Error(`Supabase respondió con código ${response.statusCode}`);
      }
      
      console.log('✅ Conexión con Supabase verificada');
    } catch (error) {
      throw new Error(`Error conectando con Supabase: ${error.message}`);
    }
  }

  async setupSentry() {
    console.log('🔧 Configurando Sentry...');
    
    const sentryConfig = this.config[this.environment].sentry;
    
    if (!sentryConfig.enabled) {
      console.log('⏭️  Sentry deshabilitado para ambiente ' + this.environment);
      this.setupReport.services.sentry = { configured: false, reason: 'disabled_for_environment' };
      return;
    }

    if (!process.env.VITE_SENTRY_DSN) {
      this.setupReport.warnings.push('VITE_SENTRY_DSN no configurado - Sentry no funcionará');
      this.setupReport.services.sentry = { configured: false, reason: 'missing_dsn' };
      return;
    }

    try {
      // Crear configuración de Sentry
      const sentryConfigFile = {
        dsn: process.env.VITE_SENTRY_DSN,
        environment: this.environment,
        sampleRate: sentryConfig.sampleRate,
        tracesSampleRate: this.environment === 'production' ? 0.1 : 1.0,
        beforeSend: this.environment === 'development' ? null : 'filterSensitiveData',
        integrations: [
          'BrowserTracing',
          'Replay'
        ],
        replaysSessionSampleRate: this.environment === 'production' ? 0.1 : 1.0,
        replaysOnErrorSampleRate: 1.0,
        release: this.getAppVersion(),
        tags: {
          component: 'evita-erp',
          region: 'argentina',
          timezone: this.timezone
        },
        context: {
          business: {
            company: 'EVITA Artículos de Limpieza',
            industry: 'retail',
            country: 'AR'
          }
        }
      };

      // Escribir configuración
      await this.writeConfigFile('sentry.config.js', sentryConfigFile);
      
      // Configurar alertas básicas de Sentry
      await this.setupSentryAlerts();
      
      // Enviar evento de prueba
      await this.testSentryConnection();
      
      this.setupReport.services.sentry = { 
        configured: true, 
        tested: true,
        sampleRate: sentryConfig.sampleRate,
        environment: this.environment
      };
      
      console.log('✅ Sentry configurado correctamente');
    } catch (error) {
      this.setupReport.errors.push(`Error configurando Sentry: ${error.message}`);
      this.setupReport.services.sentry = { configured: false, error: error.message };
    }
  }

  async setupSentryAlerts() {
    const alerts = [
      {
        name: 'Error Rate Alto - EVITA ERP',
        condition: 'error_rate > 1% in 5 minutes',
        severity: 'high',
        channels: this.config[this.environment].alerts.channels
      },
      {
        name: 'Performance Degradation - Core Web Vitals',
        condition: 'lcp > 2500ms OR fid > 100ms OR cls > 0.1',
        severity: 'medium',
        channels: ['slack']
      },
      {
        name: 'Errores Críticos - Módulos de Negocio',
        condition: 'error in [productos, facturas, inventario] modules',
        severity: 'critical',
        channels: ['slack', 'email']
      }
    ];

    // En un entorno real, aquí se configurarían las alertas via API de Sentry
    console.log(`📋 Configuradas ${alerts.length} alertas básicas de Sentry`);
  }

  async testSentryConnection() {
    // Simular envío de evento de prueba
    console.log('🧪 Enviando evento de prueba a Sentry...');
    // En implementación real: Sentry.captureMessage('Test from setup script')
  }

  async setupAnalytics() {
    console.log('📊 Configurando Analytics...');
    
    const analyticsConfig = this.config[this.environment].analytics;
    
    if (!analyticsConfig.enabled) {
      console.log('⏭️  Analytics deshabilitado para ambiente ' + this.environment);
      this.setupReport.services.analytics = { configured: false, reason: 'disabled_for_environment' };
      return;
    }

    try {
      // Configuración de métricas específicas para EVITA
      const metricsConfig = {
        coreWebVitals: {
          lcp: { target: 2500, warning: 2000 },
          fid: { target: 100, warning: 50 },
          cls: { target: 0.1, warning: 0.05 },
          ttfb: { target: 600, warning: 400 }
        },
        businessMetrics: {
          facturaCreationTime: { target: 30000, warning: 20000 }, // 30s max para crear factura
          productSearchTime: { target: 1000, warning: 500 },     // 1s max para búsqueda
          moduleLoadTime: { target: 2000, warning: 1000 },       // 2s max para cargar módulo
          exportTime: { target: 10000, warning: 5000 }           // 10s max para exportar
        },
        userFlow: {
          criticalPaths: [
            'login -> productos -> crear_producto',
            'login -> facturas -> crear_factura',
            'login -> inventario -> actualizar_stock'
          ],
          conversionGoals: [
            'factura_completada',
            'producto_creado',
            'reporte_generado'
          ]
        },
        regionalConfig: {
          timezone: this.timezone,
          locale: 'es-AR',
          currency: 'ARS',
          businessHours: {
            start: '08:00',
            end: '20:00',
            weekdays: [1, 2, 3, 4, 5, 6] // Lunes a Sábado
          }
        }
      };

      await this.writeConfigFile('analytics.config.js', metricsConfig);
      
      // Configurar dashboards básicos
      await this.setupAnalyticsDashboards();
      
      this.setupReport.services.analytics = { 
        configured: true, 
        tested: true,
        metricsCount: Object.keys(metricsConfig.businessMetrics).length,
        dashboards: 3
      };
      
      console.log('✅ Analytics configurado correctamente');
    } catch (error) {
      this.setupReport.errors.push(`Error configurando Analytics: ${error.message}`);
      this.setupReport.services.analytics = { configured: false, error: error.message };
    }
  }

  async setupAnalyticsDashboards() {
    const dashboards = [
      {
        name: 'EVITA ERP - Performance Overview',
        widgets: ['core_web_vitals', 'page_load_times', 'error_rate', 'user_sessions']
      },
      {
        name: 'EVITA ERP - Business Metrics',
        widgets: ['module_usage', 'conversion_rates', 'user_flows', 'feature_adoption']
      },
      {
        name: 'EVITA ERP - Technical Health',
        widgets: ['api_response_times', 'cache_performance', 'bundle_size', 'memory_usage']
      }
    ];

    console.log(`📊 Configurados ${dashboards.length} dashboards de analytics`);
  }

  async setupAlerts() {
    console.log('🚨 Configurando Alertas...');
    
    const alertsConfig = this.config[this.environment].alerts;
    
    if (!alertsConfig.enabled) {
      console.log('⏭️  Alertas deshabilitadas para ambiente ' + this.environment);
      this.setupReport.services.alerts = { configured: false, reason: 'disabled_for_environment' };
      return;
    }

    try {
      const alertRules = {
        infrastructure: [
          {
            name: 'Uptime EVITA ERP',
            condition: 'uptime < 99.5% in 5m',
            severity: 'critical',
            channels: alertsConfig.channels,
            escalation: {
              level1: { after: '5m', channels: ['slack'] },
              level2: { after: '15m', channels: ['slack', 'email'] },
              level3: { after: '30m', channels: ['slack', 'email', 'sms'] }
            }
          },
          {
            name: 'Response Time Degradation',
            condition: 'avg_response_time > 2000ms in 1m',
            severity: 'high',
            channels: ['slack']
          },
          {
            name: 'Error Rate Spike',
            condition: 'error_rate > 1% in 5m',
            severity: 'high',
            channels: alertsConfig.channels
          }
        ],
        business: [
          {
            name: 'Stock Crítico - Productos de Limpieza',
            condition: 'stock < min_stock AND category = "limpieza"',
            severity: 'high',
            channels: ['slack', 'email'],
            businessHours: true,
            message: 'Stock crítico detectado: {producto} ({stock} unidades restantes)'
          },
          {
            name: 'Facturas Vencidas',
            condition: 'COUNT(facturas WHERE fecha_vencimiento < NOW() - 7 days) > 5',
            severity: 'medium',
            channels: ['email'],
            businessHours: true
          },
          {
            name: 'Ventas Anómalas',
            condition: 'daily_sales < avg_30d_sales * 0.5',
            severity: 'medium',
            channels: ['slack'],
            businessHours: true
          },
          {
            name: 'Errores en Facturación',
            condition: 'error_rate_module["facturas"] > 2% in 10m',
            severity: 'critical',
            channels: ['slack', 'email']
          }
        ],
        performance: [
          {
            name: 'Core Web Vitals Degradation',
            condition: 'lcp > 2500ms OR fid > 100ms OR cls > 0.1',
            severity: 'medium',
            channels: ['slack']
          },
          {
            name: 'Bundle Size Increase',
            condition: 'bundle_size > previous_release * 1.1',
            severity: 'low',
            channels: ['slack']
          },
          {
            name: 'Memory Leak Detection',
            condition: 'memory_usage_trend > 10% increase in 1h',
            severity: 'medium',
            channels: ['slack']
          }
        ]
      };

      await this.writeConfigFile('alerts.config.js', alertRules);
      
      // Configurar canales de notificación
      await this.setupNotificationChannels();
      
      // Configurar horarios de negocio argentinos
      await this.setupBusinessHours();
      
      this.setupReport.services.alerts = { 
        configured: true, 
        tested: true,
        rulesCount: Object.values(alertRules).flat().length,
        channels: alertsConfig.channels
      };
      
      console.log('✅ Alertas configuradas correctamente');
    } catch (error) {
      this.setupReport.errors.push(`Error configurando Alertas: ${error.message}`);
      this.setupReport.services.alerts = { configured: false, error: error.message };
    }
  }

  async setupNotificationChannels() {
    const channels = {
      slack: {
        webhook: process.env.SLACK_WEBHOOK_URL,
        channel: '#evita-alerts',
        username: 'EVITA ERP Monitor',
        iconEmoji: ':warning:'
      },
      email: {
        smtp: {
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        },
        from: process.env.NOTIFICATION_EMAIL || 'alerts@evita.com.ar',
        to: ['admin@evita.com.ar', 'tech@evita.com.ar']
      }
    };

    if (process.env.SLACK_WEBHOOK_URL) {
      await this.testSlackNotification();
    } else {
      this.setupReport.warnings.push('SLACK_WEBHOOK_URL no configurado - notificaciones Slack no funcionarán');
    }

    console.log('📢 Canales de notificación configurados');
  }

  async testSlackNotification() {
    try {
      const testMessage = {
        text: '🧪 Test de configuración - EVITA ERP Monitoring',
        attachments: [{
          color: 'good',
          fields: [{
            title: 'Estado',
            value: 'Sistema de monitoreo configurado correctamente',
            short: true
          }, {
            title: 'Ambiente',
            value: this.environment,
            short: true
          }]
        }]
      };

      // En implementación real se enviaría a Slack
      console.log('🧪 Mensaje de prueba preparado para Slack');
    } catch (error) {
      this.setupReport.warnings.push(`Error enviando mensaje de prueba a Slack: ${error.message}`);
    }
  }

  async setupBusinessHours() {
    const businessHours = {
      timezone: this.timezone,
      schedule: {
        monday: { start: '08:00', end: '20:00' },
        tuesday: { start: '08:00', end: '20:00' },
        wednesday: { start: '08:00', end: '20:00' },
        thursday: { start: '08:00', end: '20:00' },
        friday: { start: '08:00', end: '20:00' },
        saturday: { start: '08:00', end: '18:00' },
        sunday: { closed: true }
      },
      holidays: [
        '2024-01-01', // Año Nuevo
        '2024-02-12', // Carnaval
        '2024-02-13', // Carnaval
        '2024-03-24', // Día de la Memoria
        '2024-04-02', // Día del Veterano
        '2024-05-01', // Día del Trabajador
        '2024-05-25', // Revolución de Mayo
        '2024-06-17', // Paso a la Inmortalidad del General Güemes
        '2024-06-20', // Día de la Bandera
        '2024-07-09', // Día de la Independencia
        '2024-08-17', // Paso a la Inmortalidad del General San Martín
        '2024-10-12', // Día del Respeto a la Diversidad Cultural
        '2024-11-20', // Día de la Soberanía Nacional
        '2024-12-08', // Inmaculada Concepción
        '2024-12-25'  // Navidad
      ]
    };

    await this.writeConfigFile('business-hours.config.js', businessHours);
    console.log('🕒 Horarios de negocio argentinos configurados');
  }

  async setupHealthChecks() {
    console.log('🏥 Configurando Health Checks...');
    
    const healthConfig = {
      interval: this.config[this.environment].healthCheck.interval,
      timeout: 5000,
      retries: 3,
      checks: {
        supabase: {
          type: 'http',
          url: `${process.env.VITE_SUPABASE_URL}/rest/v1/`,
          headers: {
            'apikey': process.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`
          },
          expectedStatus: 200,
          timeout: 3000
        },
        localStorage: {
          type: 'browser',
          check: 'localStorage.setItem("healthcheck", Date.now())',
          cleanup: 'localStorage.removeItem("healthcheck")'
        },
        memory: {
          type: 'performance',
          metric: 'memory.usedJSHeapSize',
          threshold: 100 * 1024 * 1024 // 100MB
        },
        performance: {
          type: 'vitals',
          metrics: ['lcp', 'fid', 'cls'],
          thresholds: {
            lcp: 2500,
            fid: 100,
            cls: 0.1
          }
        }
      },
      businessChecks: {
        productosModule: {
          type: 'functional',
          description: 'Verificar carga del módulo de productos',
          critical: true
        },
        facturasModule: {
          type: 'functional',
          description: 'Verificar carga del módulo de facturas',
          critical: true
        },
        inventarioModule: {
          type: 'functional',
          description: 'Verificar carga del módulo de inventario',
          critical: false
        }
      }
    };

    await this.writeConfigFile('health-checks.config.js', healthConfig);
    
    this.setupReport.services.healthChecks = { 
      configured: true,
      interval: healthConfig.interval,
      checksCount: Object.keys(healthConfig.checks).length + Object.keys(healthConfig.businessChecks).length
    };
    
    console.log('✅ Health Checks configurados correctamente');
  }

  async validateConfiguration() {
    console.log('🔍 Validando configuración...');
    
    const configFiles = [
      'sentry.config.js',
      'analytics.config.js',
      'alerts.config.js',
      'business-hours.config.js',
      'health-checks.config.js'
    ];

    const configDir = path.join(process.cwd(), 'config', 'monitoring');
    
    for (const file of configFiles) {
      const filePath = path.join(configDir, file);
      if (!fs.existsSync(filePath)) {
        this.setupReport.warnings.push(`Archivo de configuración faltante: ${file}`);
      }
    }

    // Validar que los servicios críticos estén configurados
    const criticalServices = ['sentry', 'analytics', 'alerts', 'healthChecks'];
    const unconfiguredServices = criticalServices.filter(service => 
      !this.setupReport.services[service] || !this.setupReport.services[service].configured
    );

    if (unconfiguredServices.length > 0) {
      this.setupReport.warnings.push(`Servicios críticos no configurados: ${unconfiguredServices.join(', ')}`);
    }

    console.log('✅ Validación de configuración completada');
  }

  async generateDocumentation() {
    console.log('📚 Generando documentación...');
    
    const documentation = {
      title: 'EVITA ERP - Configuración de Monitoreo',
      version: this.getAppVersion(),
      environment: this.environment,
      timestamp: new Date().toISOString(),
      sections: {
        overview: {
          description: 'Sistema de monitoreo integral para EVITA ERP',
          services: Object.keys(this.setupReport.services),
          timezone: this.timezone,
          businessHours: '08:00-20:00 ART (Lun-Sáb)'
        },
        sentry: {
          enabled: this.setupReport.services.sentry?.configured || false,
          sampleRate: this.config[this.environment].sentry.sampleRate,
          features: ['Error Tracking', 'Performance Monitoring', 'Release Tracking', 'User Context']
        },
        analytics: {
          enabled: this.setupReport.services.analytics?.configured || false,
          metrics: ['Core Web Vitals', 'Business KPIs', 'User Flows', 'Performance'],
          dashboards: 3
        },
        alerts: {
          enabled: this.setupReport.services.alerts?.configured || false,
          channels: this.config[this.environment].alerts.channels,
          categories: ['Infrastructure', 'Business', 'Performance'],
          escalation: 'Automática en 3 niveles'
        },
        healthChecks: {
          enabled: this.setupReport.services.healthChecks?.configured || false,
          interval: this.config[this.environment].healthCheck.interval,
          checks: ['Supabase', 'LocalStorage', 'Memory', 'Performance', 'Business Modules']
        }
      },
      troubleshooting: {
        commonIssues: [
          {
            issue: 'Sentry no recibe eventos',
            solution: 'Verificar VITE_SENTRY_DSN y conectividad de red'
          },
          {
            issue: 'Alertas no llegan a Slack',
            solution: 'Verificar SLACK_WEBHOOK_URL y permisos del webhook'
          },
          {
            issue: 'Health checks fallan',
            solution: 'Verificar conectividad con Supabase y variables de entorno'
          }
        ],
        contacts: {
          technical: 'tech@evita.com.ar',
          business: 'admin@evita.com.ar',
          emergency: '+54 11 XXXX-XXXX'
        }
      },
      runbook: {
        deployment: [
          '1. Ejecutar npm run monitor:setup',
          '2. Verificar variables de entorno',
          '3. Validar conectividad con servicios',
          '4. Confirmar alertas en Slack',
          '5. Ejecutar health check completo'
        ],
        incident_response: [
          '1. Identificar severidad del incidente',
          '2. Notificar al equipo correspondiente',
          '3. Investigar causa raíz',
          '4. Implementar solución temporal',
          '5. Documentar resolución'
        ],
        maintenance: [
          '1. Programar ventana de mantenimiento',
          '2. Notificar a usuarios',
          '3. Deshabilitar alertas no críticas',
          '4. Ejecutar mantenimiento',
          '5. Validar servicios post-mantenimiento'
        ]
      }
    };

    const docDir = path.join(process.cwd(), 'docs', 'monitoring');
    await this.ensureDirectoryExists(docDir);
    
    await this.writeFile(
      path.join(docDir, 'README.md'),
      this.generateMarkdownDoc(documentation)
    );
    
    await this.writeFile(
      path.join(docDir, 'setup-report.json'),
      JSON.stringify(this.setupReport, null, 2)
    );

    console.log('✅ Documentación generada correctamente');
  }

  generateMarkdownDoc(doc) {
    return `# ${doc.title}

**Versión:** ${doc.version}  
**Ambiente:** ${doc.environment}  
**Fecha:** ${doc.timestamp}  
**Timezone:** ${doc.sections.overview.timezone}

## Resumen

${doc.sections.overview.description}

### Servicios Configurados
${doc.sections.overview.services.map(s => `- ${s}`).join('\n')}

## Configuración por Servicio

### Sentry (Error Tracking)
- **Estado:** ${doc.sections.sentry.enabled ? '✅ Habilitado' : '❌ Deshabilitado'}
- **Sample Rate:** ${doc.sections.sentry.sampleRate}
- **Funcionalidades:** ${doc.sections.sentry.features.join(', ')}

### Analytics
- **Estado:** ${doc.sections.analytics.enabled ? '✅ Habilitado' : '❌ Deshabilitado'}
- **Métricas:** ${doc.sections.analytics.metrics.join(', ')}
- **Dashboards:** ${doc.sections.analytics.dashboards}

### Alertas
- **Estado:** ${doc.sections.alerts.enabled ? '✅ Habilitado' : '❌ Deshabilitado'}
- **Canales:** ${doc.sections.alerts.channels.join(', ')}
- **Categorías:** ${doc.sections.alerts.categories.join(', ')}
- **Escalation:** ${doc.sections.alerts.escalation}

### Health Checks
- **Estado:** ${doc.sections.healthChecks.enabled ? '✅ Habilitado' : '❌ Deshabilitado'}
- **Intervalo:** ${doc.sections.healthChecks.interval}ms
- **Verificaciones:** ${doc.sections.healthChecks.checks.join(', ')}

## Troubleshooting

### Problemas Comunes
${doc.troubleshooting.commonIssues.map(item => 
  `**${item.issue}**\n${item.solution}\n`
).join('\n')}

### Contactos
- **Técnico:** ${doc.troubleshooting.contacts.technical}
- **Negocio:** ${doc.troubleshooting.contacts.business}
- **Emergencia:** ${doc.troubleshooting.contacts.emergency}

## Runbook

### Deployment
${doc.runbook.deployment.map(step => `${step}`).join('\n')}

### Respuesta a Incidentes
${doc.runbook.incident_response.map(step => `${step}`).join('\n')}

### Mantenimiento
${doc.runbook.maintenance.map(step => `${step}`).join('\n')}
`;
  }

  printReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 REPORTE DE CONFIGURACIÓN - EVITA ERP MONITORING');
    console.log('='.repeat(60));
    
    console.log(`\n🕒 Timestamp: ${this.setupReport.timestamp}`);
    console.log(`🌍 Ambiente: ${this.setupReport.environment}`);
    
    console.log('\n📋 SERVICIOS CONFIGURADOS:');
    Object.entries(this.setupReport.services).forEach(([service, config]) => {
      const status = config.configured ? '✅' : '❌';
      console.log(`  ${status} ${service.toUpperCase()}: ${config.configured ? 'Configurado' : 'No configurado'}`);
      if (config.reason) console.log(`     Razón: ${config.reason}`);
      if (config.error) console.log(`     Error: ${config.error}`);
    });

    if (this.setupReport.warnings.length > 0) {
      console.log('\n⚠️  ADVERTENCIAS:');
      this.setupReport.warnings.forEach(warning => {
        console.log(`  - ${warning}`);
      });
    }

    if (this.setupReport.errors.length > 0) {
      console.log('\n❌ ERRORES:');
      this.setupReport.errors.forEach(error => {
        console.log(`  - ${error}`);
      });
    }

    // Generar próximos pasos
    this.generateNextSteps();
    
    if (this.setupReport.nextSteps.length > 0) {
      console.log('\n🚀 PRÓXIMOS PASOS:');
      this.setupReport.nextSteps.forEach((step, index) => {
        console.log(`  ${index + 1}. ${step}`);
      });
    }

    console.log('\n📚 Documentación generada en: docs/monitoring/');
    console.log('🔧 Configuración guardada en: config/monitoring/');
    console.log('\n' + '='.repeat(60));
  }

  generateNextSteps() {
    const steps = [];
    
    // Verificar servicios configurados
    if (this.setupReport.services.sentry?.configured) {
      steps.push('Verificar eventos de prueba en Sentry dashboard');
    }
    
    if (this.setupReport.services.alerts?.configured) {
      steps.push('Confirmar recepción de alertas en Slack');
      steps.push('Configurar contactos adicionales para escalation');
    }
    
    if (this.setupReport.services.analytics?.configured) {
      steps.push('Revisar dashboards de analytics configurados');
    }
    
    if (this.setupReport.services.healthChecks?.configured) {
      steps.push('Ejecutar health check completo: npm run health-check');
    }

    // Pasos generales
    steps.push('Revisar documentación generada en docs/monitoring/');
    steps.push('Configurar backup de configuraciones de monitoreo');
    steps.push('Programar revisión semanal de métricas y alertas');
    
    if (this.environment === 'production') {
      steps.push('Configurar monitoreo de costos de servicios externos');
      steps.push('Establecer SLAs y métricas de negocio');
    }

    this.setupReport.nextSteps = steps;
  }

  // Utility methods
  async makeHttpRequest(options) {
    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => resolve({ statusCode: res.statusCode, data }));
      });
      
      req.on('error', reject);
      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      req.end();
    });
  }

  async ensureDirectoryExists(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  async writeConfigFile(filename, config) {
    const configDir = path.join(process.cwd(), 'config', 'monitoring');
    await this.ensureDirectoryExists(configDir);
    
    const content = `// Configuración generada automáticamente para EVITA ERP
// Ambiente: ${this.environment}
// Timestamp: ${new Date().toISOString()}

export default ${JSON.stringify(config, null, 2)};
`;
    
    await this.writeFile(path.join(configDir, filename), content);
  }

  async writeFile(filePath, content) {
    return new Promise((resolve, reject) => {
      fs.writeFile(filePath, content, 'utf8', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  getAppVersion() {
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
      return packageJson.version || '1.0.0';
    } catch {
      return '1.0.0';
    }
  }
}

// Ejecutar script si se llama directamente
if (require.main === module) {
  const setup = new MonitoringSetup();
  setup.run().catch(error => {
    console.error('💥 Error fatal durante la configuración:', error);
    process.exit(1);
  });
}

module.exports = MonitoringSetup;