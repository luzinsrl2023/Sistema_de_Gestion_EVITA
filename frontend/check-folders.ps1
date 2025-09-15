# Check for case-sensitive folder duplicates and clean up
$componentsPath = "c:\Users\usuario\Desktop\Sistema de Gestion\frontend\src\components"
$pagesPath = "c:\Users\usuario\Desktop\Sistema de Gestion\frontend\src\pages"

Write-Host "Checking for duplicate folders..."

# Check components folder
Write-Host "Components folders:"
Get-ChildItem -Path $componentsPath | Select-Object Name, FullName

# Check pages folder  
Write-Host "Pages folders:"
Get-ChildItem -Path $pagesPath | Select-Object Name, FullName

Write-Host "If there are uppercase duplicates of lowercase folders, we should remove them..."