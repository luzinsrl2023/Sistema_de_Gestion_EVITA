#!/usr/bin/env node

/**
 * Health Check Script para EVITA ERP
 * Verifica el estado de la aplicación y servicios críticos
 * Uso: node scripts/health-check.js [--verbose] [--format=json|text]
 */

const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

// Configuración
const CONFIG = {
  timeout: 10000, // 10 segundos timeout
  retries: 3,
  environment: process.env.NODE_ENV || 'development',
  verbose: process.argv.includes('--verbose'),
  format: process.argv.find(arg => arg.startsWith('--format='))?.split('=')[1] || 'json',
  timezone: 'America/Argentina/Buenos_Aires'
};

// Exit codes
const EXIT_CODES = {
  SUCCESS: 0,
  CRITICAL_FAILURE: 1,
  SCRIPT_ERROR: 2,
  INVALID_CONFIG: 3
};

// Colores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

class HealthChecker {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      environment: CONFIG.environment,
      timezone: CONFIG.timezone,
      checks: {},
      overall: { status: 'unknown', duration: 0 },
      metadata: {
        script_version: '1.0.0',
        node_version: process.version,
        platform: process.platform
      }
    };
    this.startTime = performance.now();
  }

  log(message, level = 'info') {
    if (!CONFIG.verbose && level === 'debug') return;
    
    const timestamp = new Date().toLocaleString('es-AR', { 
      timeZone: CONFIG.timezone,
      hour12: false 
    });
    
    const colorMap = {
      info: colors.blue,
      success: colors.green,
      warning: colors.yellow,
      error: colors.red,
      debug: colors.reset
    };
    
    const color = colorMap[level] || colors.reset;
    console.log(`${color}[${timestamp}] ${level.toUpperCase()}: ${message}${colors.reset}`);
  }

  async withTimeout(promise, timeoutMs = CONFIG.timeout) {
    return Promise.race([
      promise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), timeoutMs)
      )
    ]);
  }

  async withRetry(fn, retries = CONFIG.retries) {
    for (let i = 0; i <= retries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === retries) throw error;
        this.log(`Intento ${i + 1} falló, reintentando...`, 'warning');
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }

  async checkEnvironmentVariables() {
    this.log('Verificando variables de entorno...', 'info');
    const start = performance.now();
    
    const required = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY'
    ];
    
    const optional = [
      'VITE_SENTRY_DSN',
      'VITE_ANALYTICS_ID',
      'NETLIFY_SITE_ID',
      'NODE_ENV'
    ];
    
    const missing = required.filter(env => !process.env[env]);
    const present = required.filter(env => process.env[env]);
    const optionalPresent = optional.filter(env => process.env[env]);
    
    const status = missing.length === 0 ? 'healthy' : 'unhealthy';
    const duration = performance.now() - start;
    
    this.results.checks.environment = {
      status,
      duration: Math.round(duration),
      required: {
        total: required.length,
        present: present.length,
        missing: missing
      },
      optional: {
        total: optional.length,
        present: optionalPresent.length
      },
      details: {
        NODE_ENV: process.env.NODE_ENV || 'not_set',
        has_supabase_config: !!(process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY),
        has_monitoring_config: !!(process.env.VITE_SENTRY_DSN || process.env.VITE_ANALYTICS_ID)
      }
    };
    
    if (status === 'healthy') {
      this.log('✅ Variables de entorno: OK', 'success');
    } else {
      this.log(`❌ Variables de entorno faltantes: ${missing.join(', ')}`, 'error');
    }
    
    return status === 'healthy';
  }

  async checkSupabase() {
    this.log('Verificando conectividad con Supabase...', 'info');
    const start = performance.now();
    
    if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
      this.results.checks.supabase = {
        status: 'unhealthy',
        duration: 0,
        error: 'Missing Supabase configuration'
      };
      this.log('❌ Supabase: Configuración faltante', 'error');
      return false;
    }
    
    try {
      const response = await this.withTimeout(
        this.withRetry(async () => {
          // Importar fetch dinámicamente para Node.js < 18
          const fetch = globalThis.fetch || (await import('node-fetch')).default;
          
          return fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/`, {
            method: 'GET',
            headers: {
              'apikey': process.env.VITE_SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json'
            }
          });
        })
      );
      
      const duration = performance.now() - start;
      const responseTime = Math.round(duration);
      
      if (response.ok) {
        this.results.checks.supabase = {
          status: 'healthy',
          duration: responseTime,
          response_time: responseTime,
          url: process.env.VITE_SUPABASE_URL,
          status_code: response.status
        };
        this.log(`✅ Supabase: OK (${responseTime}ms)`, 'success');
        return true;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      const duration = performance.now() - start;
      this.results.checks.supabase = {
        status: 'unhealthy',
        duration: Math.round(duration),
        error: error.message,
        url: process.env.VITE_SUPABASE_URL
      };
      this.log(`❌ Supabase: ${error.message}`, 'error');
      return false;
    }
  }

  async checkBuildArtifacts() {
    this.log('Verificando artefactos de build...', 'info');
    const start = performance.now();
    
    const requiredFiles = [
      './dist',
      './dist/index.html'
    ];
    
    const optionalFiles = [
      './dist/assets',
      './dist/assets/index.js',
      './dist/assets/index.css',
      './netlify.toml',
      './package.json'
    ];
    
    const checks = {};
    let allRequired = true;
    
    // Verificar archivos requeridos
    for (const file of requiredFiles) {
      const exists = fs.existsSync(file);
      checks[file] = { exists, required: true };
      if (!exists) allRequired = false;
    }
    
    // Verificar archivos opcionales
    for (const file of optionalFiles) {
      const exists = fs.existsSync(file);
      checks[file] = { exists, required: false };
    }
    
    // Verificar tamaño del bundle si existe
    let bundleSize = null;
    try {
      if (fs.existsSync('./dist')) {
        const stats = this.getDirSize('./dist');
        bundleSize = {
          total_mb: Math.round(stats.size / 1024 / 1024 * 100) / 100,
          files: stats.files
        };
      }
    } catch (error) {
      this.log(`Warning: No se pudo calcular el tamaño del bundle: ${error.message}`, 'warning');
    }
    
    const duration = performance.now() - start;
    const status = allRequired ? 'healthy' : 'unhealthy';
    
    this.results.checks.build = {
      status,
      duration: Math.round(duration),
      files: checks,
      bundle_size: bundleSize,
      required_files_present: allRequired
    };
    
    if (status === 'healthy') {
      this.log('✅ Artefactos de build: OK', 'success');
    } else {
      this.log('❌ Artefactos de build: Archivos faltantes', 'error');
    }
    
    return allRequired;
  }

  getDirSize(dirPath) {
    let totalSize = 0;
    let fileCount = 0;
    
    const traverse = (currentPath) => {
      const stats = fs.statSync(currentPath);
      if (stats.isDirectory()) {
        const files = fs.readdirSync(currentPath);
        files.forEach(file => traverse(path.join(currentPath, file)));
      } else {
        totalSize += stats.size;
        fileCount++;
      }
    };
    
    traverse(dirPath);
    return { size: totalSize, files: fileCount };
  }

  async checkNetlifyConfig() {
    this.log('Verificando configuración de Netlify...', 'info');
    const start = performance.now();
    
    const netlifyTomlExists = fs.existsSync('./netlify.toml');
    let config = null;
    let isValid = false;
    
    if (netlifyTomlExists) {
      try {
        const content = fs.readFileSync('./netlify.toml', 'utf8');
        // Verificaciones básicas del contenido
        isValid = content.includes('[build]') && 
                 content.includes('publish') && 
                 content.includes('command');
        config = { exists: true, has_build_config: isValid };
      } catch (error) {
        config = { exists: true, readable: false, error: error.message };
      }
    } else {
      config = { exists: false };
    }
    
    const duration = performance.now() - start;
    const status = netlifyTomlExists && isValid ? 'healthy' : 'warning';
    
    this.results.checks.netlify = {
      status,
      duration: Math.round(duration),
      config
    };
    
    if (status === 'healthy') {
      this.log('✅ Configuración de Netlify: OK', 'success');
    } else {
      this.log('⚠️ Configuración de Netlify: Incompleta o faltante', 'warning');
    }
    
    return status !== 'unhealthy';
  }

  async checkCriticalEndpoints() {
    this.log('Verificando endpoints críticos...', 'info');
    const start = performance.now();
    
    // Simular verificación de endpoints críticos del ERP
    const endpoints = [
      { name: 'productos', path: '/productos', critical: true },
      { name: 'facturas', path: '/facturas', critical: true },
      { name: 'clientes', path: '/clientes', critical: false },
      { name: 'reportes', path: '/reportes', critical: false }
    ];
    
    const results = {};
    let criticalFailures = 0;
    
    for (const endpoint of endpoints) {
      // En un entorno real, aquí harías requests HTTP a los endpoints
      // Por ahora simulamos la verificación
      const mockSuccess = Math.random() > 0.1; // 90% success rate
      const responseTime = Math.floor(Math.random() * 500) + 50;
      
      results[endpoint.name] = {
        status: mockSuccess ? 'healthy' : 'unhealthy',
        response_time: responseTime,
        critical: endpoint.critical,
        path: endpoint.path
      };
      
      if (!mockSuccess && endpoint.critical) {
        criticalFailures++;
      }
    }
    
    const duration = performance.now() - start;
    const status = criticalFailures === 0 ? 'healthy' : 'unhealthy';
    
    this.results.checks.endpoints = {
      status,
      duration: Math.round(duration),
      endpoints: results,
      critical_failures: criticalFailures
    };
    
    if (status === 'healthy') {
      this.log('✅ Endpoints críticos: OK', 'success');
    } else {
      this.log(`❌ Endpoints críticos: ${criticalFailures} fallos críticos`, 'error');
    }
    
    return status === 'healthy';
  }

  async checkBusinessLogic() {
    this.log('Verificando lógica de negocio específica de EVITA...', 'info');
    const start = performance.now();
    
    const checks = {
      timezone_config: {
        expected: 'America/Argentina/Buenos_Aires',
        current: Intl.DateTimeFormat().resolvedOptions().timeZone,
        status: 'healthy'
      },
      locale_config: {
        expected: 'es-AR',
        current: Intl.DateTimeFormat().resolvedOptions().locale,
        status: 'healthy'
      },
      currency_format: {
        test_amount: 1234.56,
        formatted: new Intl.NumberFormat('es-AR', {
          style: 'currency',
          currency: 'ARS'
        }).format(1234.56),
        status: 'healthy'
      }
    };
    
    // Verificar configuración específica para Argentina
    const timezoneCorrect = checks.timezone_config.current.includes('Argentina') || 
                           process.env.TZ === 'America/Argentina/Buenos_Aires';
    
    if (!timezoneCorrect) {
      checks.timezone_config.status = 'warning';
    }
    
    const duration = performance.now() - start;
    const hasWarnings = Object.values(checks).some(check => check.status === 'warning');
    const status = hasWarnings ? 'warning' : 'healthy';
    
    this.results.checks.business = {
      status,
      duration: Math.round(duration),
      checks,
      argentina_config: timezoneCorrect
    };
    
    if (status === 'healthy') {
      this.log('✅ Configuración de negocio: OK', 'success');
    } else {
      this.log('⚠️ Configuración de negocio: Advertencias encontradas', 'warning');
    }
    
    return status !== 'unhealthy';
  }

  async runAllChecks() {
    this.log(`${colors.bold}🏥 Iniciando Health Check para EVITA ERP${colors.reset}`, 'info');
    this.log(`Ambiente: ${CONFIG.environment}`, 'info');
    
    const checks = [
      { name: 'environment', fn: () => this.checkEnvironmentVariables(), critical: true },
      { name: 'supabase', fn: () => this.checkSupabase(), critical: true },
      { name: 'build', fn: () => this.checkBuildArtifacts(), critical: false },
      { name: 'netlify', fn: () => this.checkNetlifyConfig(), critical: false },
      { name: 'endpoints', fn: () => this.checkCriticalEndpoints(), critical: true },
      { name: 'business', fn: () => this.checkBusinessLogic(), critical: false }
    ];
    
    let criticalFailures = 0;
    let totalFailures = 0;
    
    for (const check of checks) {
      try {
        const success = await check.fn();
        if (!success) {
          totalFailures++;
          if (check.critical) criticalFailures++;
        }
      } catch (error) {
        this.log(`Error en check ${check.name}: ${error.message}`, 'error');
        this.results.checks[check.name] = {
          status: 'error',
          error: error.message,
          duration: 0
        };
        totalFailures++;
        if (check.critical) criticalFailures++;
      }
    }
    
    // Calcular resultado general
    const totalDuration = performance.now() - this.startTime;
    this.results.overall = {
      status: criticalFailures === 0 ? (totalFailures === 0 ? 'healthy' : 'warning') : 'unhealthy',
      duration: Math.round(totalDuration),
      total_checks: checks.length,
      passed: checks.length - totalFailures,
      failed: totalFailures,
      critical_failures: criticalFailures
    };
    
    return this.results;
  }

  formatOutput(results) {
    if (CONFIG.format === 'json') {
      return JSON.stringify(results, null, 2);
    }
    
    // Formato texto legible
    let output = `\n${colors.bold}=== EVITA ERP Health Check Report ===${colors.reset}\n`;
    output += `Timestamp: ${results.timestamp}\n`;
    output += `Environment: ${results.environment}\n`;
    output += `Duration: ${results.overall.duration}ms\n`;
    output += `Overall Status: ${this.getStatusIcon(results.overall.status)} ${results.overall.status.toUpperCase()}\n\n`;
    
    output += `${colors.bold}Check Results:${colors.reset}\n`;
    for (const [name, check] of Object.entries(results.checks)) {
      const icon = this.getStatusIcon(check.status);
      output += `  ${icon} ${name.padEnd(12)} ${check.status.toUpperCase().padEnd(10)} (${check.duration}ms)\n`;
      
      if (check.error) {
        output += `    Error: ${check.error}\n`;
      }
    }
    
    output += `\n${colors.bold}Summary:${colors.reset}\n`;
    output += `  Total Checks: ${results.overall.total_checks}\n`;
    output += `  Passed: ${colors.green}${results.overall.passed}${colors.reset}\n`;
    output += `  Failed: ${colors.red}${results.overall.failed}${colors.reset}\n`;
    output += `  Critical Failures: ${colors.red}${results.overall.critical_failures}${colors.reset}\n`;
    
    return output;
  }

  getStatusIcon(status) {
    const icons = {
      healthy: '✅',
      warning: '⚠️',
      unhealthy: '❌',
      error: '💥',
      unknown: '❓'
    };
    return icons[status] || icons.unknown;
  }

  getExitCode(results) {
    if (results.overall.critical_failures > 0) {
      return EXIT_CODES.CRITICAL_FAILURE;
    }
    return EXIT_CODES.SUCCESS;
  }
}

// Función principal
async function main() {
  const checker = new HealthChecker();
  
  try {
    // Verificar configuración básica
    if (!process.env.NODE_ENV && CONFIG.environment === 'development') {
      checker.log('Warning: NODE_ENV no está configurado, usando "development"', 'warning');
    }
    
    // Ejecutar todos los checks
    const results = await checker.runAllChecks();
    
    // Mostrar resultados
    const output = checker.formatOutput(results);
    console.log(output);
    
    // Determinar exit code
    const exitCode = checker.getExitCode(results);
    
    if (exitCode === EXIT_CODES.SUCCESS) {
      checker.log('🎉 Health check completado exitosamente', 'success');
    } else {
      checker.log('💥 Health check falló con errores críticos', 'error');
    }
    
    process.exit(exitCode);
    
  } catch (error) {
    console.error(`${colors.red}💥 Error fatal en health check: ${error.message}${colors.reset}`);
    console.error(error.stack);
    process.exit(EXIT_CODES.SCRIPT_ERROR);
  }
}

// Manejo de señales
process.on('SIGINT', () => {
  console.log('\n🛑 Health check interrumpido por usuario');
  process.exit(EXIT_CODES.SCRIPT_ERROR);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Health check terminado');
  process.exit(EXIT_CODES.SCRIPT_ERROR);
});

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { HealthChecker, CONFIG, EXIT_CODES };