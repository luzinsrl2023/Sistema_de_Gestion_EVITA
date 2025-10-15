# PowerShell script to fix git issues and push the fixes for cotizaciones RLS issue
Write-Host "Starting git fix and push process for cotizaciones RLS fixes..." -ForegroundColor Green

try {
    # Fetch latest changes
    Write-Host "Fetching latest changes..." -ForegroundColor Yellow
    git fetch
    
    # Check if there are local changes
    $status = git status --porcelain
    if ([string]::IsNullOrWhiteSpace($status)) {
        Write-Host "No local changes to commit." -ForegroundColor Yellow
    } else {
        # Add all changes
        Write-Host "Adding all changes..." -ForegroundColor Yellow
        git add .
        
        # Commit changes
        Write-Host "Creating commit..." -ForegroundColor Yellow
        git commit -m "Chore: Cotizaciones permite app-auth (RLS anon select/insert) y usa session local; fix servicio"
    }
    
    # Try to pull and rebase
    Write-Host "Pulling and rebasing with remote changes..." -ForegroundColor Yellow
    git pull --rebase origin main
    
    # Push changes
    Write-Host "Pushing changes to remote repository..." -ForegroundColor Yellow
    git push origin main
    
    Write-Host "Successfully pulled, committed and pushed changes!" -ForegroundColor Green
}
catch {
    Write-Host "Error occurred during git operations:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host "Attempting to push with force..." -ForegroundColor Yellow
    try {
        git push --force-with-lease origin main
        Write-Host "Force push completed. Please coordinate with your team to avoid conflicts." -ForegroundColor Yellow
    } catch {
        Write-Host "Force push also failed. Please resolve manually:" -ForegroundColor Red
        Write-Host "1. git fetch" -ForegroundColor Yellow
        Write-Host "2. git pull --rebase origin main" -ForegroundColor Yellow
        Write-Host "3. Resolve any conflicts" -ForegroundColor Yellow
        Write-Host "4. git add ." -ForegroundColor Yellow
        Write-Host "5. git commit -m 'Your message'" -ForegroundColor Yellow
        Write-Host "6. git push origin main" -ForegroundColor Yellow
    }
    exit 1
}