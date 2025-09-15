# PowerShell script to fix escaped quotes in JSX files
$frontendPath = ".\frontend\src"

# Get all .jsx files recursively
$jsxFiles = Get-ChildItem -Path $frontendPath -Recurse -Filter "*.jsx"

Write-Host "Found $($jsxFiles.Count) JSX files to fix..."

foreach ($file in $jsxFiles) {
    Write-Host "Fixing: $($file.FullName)"
    
    # Read file content
    $content = Get-Content -Path $file.FullName -Raw
    
    # Replace escaped quotes with normal quotes
    $fixedContent = $content -replace '\\"', '"'
    
    # Write fixed content back to file
    Set-Content -Path $file.FullName -Value $fixedContent -NoNewline
}

Write-Host "All JSX files have been fixed!"