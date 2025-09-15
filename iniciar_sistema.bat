@echo off
title Sistema de Gestion ERP - Inicializacion

echo ====================================================
echo Sistema de Gestion ERP - Inicializacion de la Base de Datos
echo ====================================================

cd /d "C:\Users\usuario\Desktop\Sistema de Gestion"

REM Verificar si existe el directorio sqlite
if not exist "sqlite" (
    echo Creando directorio sqlite...
    mkdir sqlite
)

cd /d "C:\Users\usuario\Desktop\Sistema de Gestion\sqlite"

REM Verificar si existe sqlite3.exe
if not exist "sqlite3.exe" (
    echo Descargando SQLite3 portable...
    powershell -Command "Invoke-WebRequest -Uri 'https://www.sqlite.org/2024/sqlite-tools-win-x64-3450200.zip' -OutFile 'sqlite-tools.zip'"
    
    echo Extrayendo SQLite3...
    powershell -Command "Expand-Archive -Path 'sqlite-tools.zip' -DestinationPath '.'"
    
    REM Mover los archivos a la carpeta principal y eliminar el zip y la carpeta extra
    for /f "delims=" %%i in ('dir /b sqlite-tools-win-x64-*') do (
        move "%%i\*.exe" .
        rmdir /s /q "%%i"
    )
    del sqlite-tools.zip
    
    echo SQLite3 instalado correctamente.
)

REM Crear la base de datos SQLite ejecutando el script SQL
echo Creando base de datos...
sqlite3.exe gestion.db < create_tables.sql

if %ERRORLEVEL% EQU 0 (
    echo Base de datos creada exitosamente: gestion.db
) else (
    echo Error al crear la base de datos
    pause
    exit /b 1
)

REM Insertar datos de prueba
echo Insertando datos de prueba...
sqlite3.exe gestion.db < sample_data.sql

if %ERRORLEVEL% EQU 0 (
    echo Datos de prueba insertados correctamente.
) else (
    echo Advertencia: No se pudieron insertar datos de prueba.
)

echo.
echo ====================================================
echo Iniciando aplicacion...
echo ====================================================

echo Instalando dependencias del frontend...
cd /d "C:\Users\usuario\Desktop\Sistema de Gestion\frontend"
if not exist "node_modules" (
    npm install
)

echo Iniciando servidor de desarrollo del frontend...
start "Frontend - Sistema de Gestion ERP" cmd /k "npm run dev"

echo.
echo Aplicacion iniciada correctamente.
echo El frontend esta disponible en http://localhost:5173
echo.
echo Para detener la aplicacion, cierre las ventanas del servidor.
echo.
pause