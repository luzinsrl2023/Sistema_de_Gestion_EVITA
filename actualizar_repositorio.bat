@echo off
setlocal

echo ================================
echo Actualizando Repositorio GitHub
echo ================================

:: Ir al directorio del repositorio
cd /d "C:\Users\usuario\Desktop\Sistema de Gestion"

:: Verificar si es un repositorio de git
git rev-parse --is-inside-work-tree >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo 1. Inicializando repositorio git...
    git init
)

:: Verificar si el remoto 'origin' existe
git remote get-url origin >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo 2. Configurando origen remoto...
    git remote add origin https://github.com/luzinsrl2023/Sistema_de_Gestion_EVITA.git
)

echo.
echo 3. Agregando todos los archivos...
git add .

echo.
echo 4. Creando commit...
git commit -m "Codigo actual del sistema de gestion"

echo.
echo 5. Renombrando rama a 'main'...
git branch -M main

echo.
echo 6. Subiendo cambios a GitHub...
git push -u --force origin main

if %errorlevel% neq 0 (
    echo.
    echo ERROR: No se pudo subir los cambios.
    echo Verifica tu conexion a internet y permisos del repositorio.
) else (
    echo.
    echo EXITO: Repositorio actualizado correctamente.
)