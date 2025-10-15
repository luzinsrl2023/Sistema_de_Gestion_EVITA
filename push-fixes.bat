@echo off
setlocal

echo ================================
echo Pushing Cotizaciones Fixes
echo ================================

:: Add all changes
echo 1. Adding all changes...
git add .

:: Commit changes
echo 2. Creating commit...
git commit -m "Fix: Cotizaciones authentication issue - Allow app-auth users to save quotations"

:: Pull and rebase
echo 3. Pulling and rebasing with remote...
git pull --rebase origin main

:: Push changes
echo 4. Pushing changes to GitHub...
git push origin main

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to push changes.
    echo You may need to resolve conflicts manually.
) else (
    echo.
    echo SUCCESS: Changes pushed successfully.
)

pause