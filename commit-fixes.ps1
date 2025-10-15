# PowerShell script to commit and push the fixes for cotizaciones RLS issue
Write-Host "Starting commit and push process for cotizaciones RLS fixes..." -ForegroundColor Green

try {
    # Add all changes
    Write-Host "Adding all changes..." -ForegroundColor Yellow
    git add .
    
    # Check if there are changes to commit
    $status = git status --porcelain
    if ([string]::IsNullOrWhiteSpace($status)) {
        Write-Host "No changes to commit." -ForegroundColor Yellow
        exit 0
    }
    
    # Commit changes
    Write-Host "Creating commit..." -ForegroundColor Yellow
    git commit -m "Chore: Cotizaciones permite app-auth (RLS anon select/insert) y usa session local; fix servicio"
    
    # Push changes
    Write-Host "Pushing changes to remote repository..." -ForegroundColor Yellow
    git push
    
    Write-Host "Successfully committed and pushed changes!" -ForegroundColor Green
}
catch {
    Write-Host "Error occurred during commit/push process:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}