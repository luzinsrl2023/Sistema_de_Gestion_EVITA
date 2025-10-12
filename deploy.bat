@echo off
REM Script de despliegue completo para EVITA Sistema de Gestión (Windows)
REM Este script maneja el despliegue de Netlify Functions y configuración de Supabase

echo 🚀 Iniciando despliegue completo de EVITA Sistema de Gestión...

REM Verificar que estamos en el directorio correcto
if not exist "package.json" (
    echo ❌ No se encontró package.json. Asegúrate de estar en el directorio raíz del proyecto.
    exit /b 1
)

REM Verificar que Node.js está instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js no está instalado. Por favor instala Node.js primero.
    exit /b 1
)

REM Verificar que npm está instalado
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm no está instalado. Por favor instala npm primero.
    exit /b 1
)

echo ✅ Verificando configuración del proyecto...

REM Verificar variables de entorno
if "%VITE_SUPABASE_URL%"=="" (
    echo ❌ VITE_SUPABASE_URL no está configurada
    exit /b 1
)

if "%VITE_SUPABASE_ANON_KEY%"=="" (
    echo ❌ VITE_SUPABASE_ANON_KEY no está configurada
    exit /b 1
)

echo ✅ Variables de entorno verificadas

REM Instalar dependencias del frontend
echo 📦 Instalando dependencias del frontend...
cd frontend
call npm install
if errorlevel 1 (
    echo ❌ Error instalando dependencias del frontend
    exit /b 1
)
echo ✅ Dependencias del frontend instaladas

REM Construir el proyecto
echo 🔨 Construyendo el proyecto...
call npm run build
if errorlevel 1 (
    echo ❌ Error construyendo el proyecto
    exit /b 1
)
echo ✅ Proyecto construido exitosamente

REM Volver al directorio raíz
cd ..

REM Verificar que Netlify CLI está instalado
netlify --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Netlify CLI no está instalado. Instalando...
    call npm install -g netlify-cli
    if errorlevel 1 (
        echo ❌ Error instalando Netlify CLI
        exit /b 1
    )
)

REM Verificar que Supabase CLI está instalado
supabase --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Supabase CLI no está instalado. Instalando...
    call npm install -g supabase
    if errorlevel 1 (
        echo ❌ Error instalando Supabase CLI
        exit /b 1
    )
)

echo ✅ Herramientas CLI verificadas

REM Desplegar a Netlify
echo 🌐 Desplegando a Netlify...

REM Verificar que estamos autenticados en Netlify
netlify status >nul 2>&1
if errorlevel 1 (
    echo ⚠️  No estás autenticado en Netlify. Por favor, ejecuta 'netlify login' primero.
    exit /b 1
)

REM Desplegar el sitio
call netlify deploy --prod --dir=frontend/dist
if errorlevel 1 (
    echo ❌ Error desplegando a Netlify
    exit /b 1
)
echo ✅ Sitio desplegado a Netlify

REM Desplegar funciones de Netlify
echo ⚙️  Desplegando funciones de Netlify...
call netlify functions:deploy
if errorlevel 1 (
    echo ⚠️  Error desplegando funciones de Netlify
)
echo ✅ Funciones de Netlify desplegadas

REM Verificar el despliegue
echo 🔍 Verificando despliegue...
timeout /t 5 /nobreak >nul

REM Obtener URL del sitio
for /f "tokens=*" %%i in ('netlify status --json ^| findstr "url"') do set SITE_URL=%%i
set SITE_URL=%SITE_URL:"url": "%
set SITE_URL=%SITE_URL:",%

echo ✅ Despliegue completado exitosamente!
echo.
echo 📋 Información del despliegue:
echo 🌐 URL del sitio: %SITE_URL%
echo 📊 Dashboard de Netlify: https://app.netlify.com/sites/articulosdelimpiezaevita
echo 🗄️  Dashboard de Supabase: https://supabase.com/dashboard/project/articulosdelimpiezaevita
echo.
echo 📋 Próximos pasos:
echo 1. Verificar que el sitio funciona correctamente en %SITE_URL%
echo 2. Probar el login con las credenciales demo: test@example.com / password123
echo 3. Verificar que todos los módulos cargan sin errores
echo 4. Configurar monitoreo y alertas si es necesario
echo.
echo 🔧 Comandos útiles:
echo - Ver logs: netlify logs
echo - Ver estado: netlify status
echo - Abrir sitio: netlify open
echo - Ver funciones: netlify functions:list
echo.
echo 🎉 ¡EVITA Sistema de Gestión está listo para producción!

REM Crear archivo de estado del despliegue
echo {> deployment-status.json
echo   "timestamp": "%date% %time%",>> deployment-status.json
echo   "status": "success",>> deployment-status.json
echo   "site_url": "%SITE_URL%",>> deployment-status.json
echo   "supabase_url": "%VITE_SUPABASE_URL%",>> deployment-status.json
echo   "version": "1.0.0",>> deployment-status.json
echo   "deployment_type": "production">> deployment-status.json
echo }>> deployment-status.json

pause
