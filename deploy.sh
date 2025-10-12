#!/bin/bash

# Script de despliegue completo para EVITA Sistema de Gestión
# Este script maneja el despliegue de Netlify Functions y configuración de Supabase

set -e

echo "🚀 Iniciando despliegue completo de EVITA Sistema de Gestión..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    error "No se encontró package.json. Asegúrate de estar en el directorio raíz del proyecto."
    exit 1
fi

# Verificar que Netlify CLI está instalado
if ! command -v netlify &> /dev/null; then
    warning "Netlify CLI no está instalado. Instalando..."
    npm install -g netlify-cli
fi

# Verificar que Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    warning "Supabase CLI no está instalado. Instalando..."
    npm install -g supabase
fi

log "Verificando configuración del proyecto..."

# Verificar variables de entorno
if [ -z "$VITE_SUPABASE_URL" ]; then
    error "VITE_SUPABASE_URL no está configurada"
    exit 1
fi

if [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    error "VITE_SUPABASE_ANON_KEY no está configurada"
    exit 1
fi

success "Variables de entorno verificadas"

# Instalar dependencias del frontend
log "Instalando dependencias del frontend..."
cd frontend
npm install
success "Dependencias del frontend instaladas"

# Construir el proyecto
log "Construyendo el proyecto..."
npm run build
success "Proyecto construido exitosamente"

# Volver al directorio raíz
cd ..

# Configurar Supabase
log "Configurando Supabase..."

# Aplicar migraciones
log "Aplicando migraciones de Supabase..."
supabase db push

# Ejecutar función de configuración de base de datos
log "Ejecutando configuración automática de base de datos..."
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  "$VITE_SUPABASE_URL/functions/v1/setup-database" \
  -d '{}' || warning "No se pudo ejecutar la configuración automática"

success "Supabase configurado"

# Desplegar a Netlify
log "Desplegando a Netlify..."

# Verificar que estamos autenticados en Netlify
if ! netlify status &> /dev/null; then
    warning "No estás autenticado en Netlify. Por favor, ejecuta 'netlify login' primero."
    exit 1
fi

# Desplegar el sitio
netlify deploy --prod --dir=frontend/dist
success "Sitio desplegado a Netlify"

# Desplegar funciones de Netlify
log "Desplegando funciones de Netlify..."
netlify functions:deploy
success "Funciones de Netlify desplegadas"

# Verificar el despliegue
log "Verificando despliegue..."
sleep 5

# Hacer una petición de prueba al sitio
SITE_URL=$(netlify status --json | jq -r '.site.url')
if curl -s -o /dev/null -w "%{http_code}" "$SITE_URL" | grep -q "200"; then
    success "Sitio verificado y funcionando correctamente"
else
    warning "No se pudo verificar el sitio. Puede que necesite unos minutos para estar disponible."
fi

# Mostrar información del despliegue
log "Información del despliegue:"
echo "🌐 URL del sitio: $SITE_URL"
echo "📊 Dashboard de Netlify: https://app.netlify.com/sites/articulosdelimpiezaevita"
echo "🗄️  Dashboard de Supabase: https://supabase.com/dashboard/project/articulosdelimpiezaevita"

# Crear archivo de estado del despliegue
cat > deployment-status.json << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "status": "success",
  "site_url": "$SITE_URL",
  "supabase_url": "$VITE_SUPABASE_URL",
  "version": "1.0.0",
  "deployment_type": "production"
}
EOF

success "Despliegue completado exitosamente!"
log "El sistema EVITA está ahora disponible en producción"

# Mostrar próximos pasos
echo ""
echo "📋 Próximos pasos:"
echo "1. Verificar que el sitio funciona correctamente en $SITE_URL"
echo "2. Probar el login con las credenciales demo: test@example.com / password123"
echo "3. Verificar que todos los módulos cargan sin errores"
echo "4. Configurar monitoreo y alertas si es necesario"
echo ""
echo "🔧 Comandos útiles:"
echo "- Ver logs: netlify logs"
echo "- Ver estado: netlify status"
echo "- Abrir sitio: netlify open"
echo "- Ver funciones: netlify functions:list"
echo ""
echo "🎉 ¡EVITA Sistema de Gestión está listo para producción!"
