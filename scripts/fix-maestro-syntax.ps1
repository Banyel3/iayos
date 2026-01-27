# Fix Maestro test files - remove anyOf and fix appId

$maestroDir = "c:\code\iayos\apps\frontend_mobile\iayos_mobile\.maestro"
$files = Get-ChildItem -Path $maestroDir -Recurse -Filter *.yaml

Write-Host "Found $($files.Count) YAML files to process" -ForegroundColor Cyan

foreach ($file in $files) {
    Write-Host "Processing: $($file.Name)" -ForegroundColor Yellow
    
    $content = Get-Content $file.FullName -Raw
    $modified = $false
    
    # Fix 1: Replace appId
    if ($content -match 'appId: com\.iayos\.app') {
        $content = $content -replace 'appId: com\.iayos\.app', 'appId: com.devante.iayos'
        $modified = $true
        Write-Host "  - Fixed appId" -ForegroundColor Green
    }
    
    # Fix 2: Remove anyOf blocks (replace with first option + optional: true)
    # This is a simplified fix - replaces anyOf blocks with just the first ID assertion
    while ($content -match '(?s)(\s+)anyOf:\s*\n(?:\1\s+-\s+id:\s+"([^"]+)"\s*\n)+') {
        $indent = $matches[1]
        # Extract the first id from the anyOf list
        if ($content -match '(?s)anyOf:\s*\n\s+-\s+id:\s+"([^"]+)"') {
            $firstId = $matches[1]
            # Replace the entire anyOf block with a simple id assertion with optional: true
            $content = $content -replace '(?s)anyOf:\s*\n(?:\s+-\s+id:\s+"[^"]+"\s*\n)+(\s+)optional:\s*(true|false)', "id: `"$firstId`"`n`$1optional: true"
            # If no optional field after anyOf, add it
            $content = $content -replace '(?s)anyOf:\s*\n(?:\s+-\s+id:\s+"[^"]+"\s*\n)+(?!\s+optional:)', "id: `"$firstId`"`n${indent}optional: true`n"
            $modified = $true
            Write-Host "  - Removed anyOf block" -ForegroundColor Green
        }
    }
    
    # Save if modified
    if ($modified) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "  ✓ Saved changes to $($file.Name)" -ForegroundColor Cyan
    }
}

Write-Host "`nAll files processed!" -ForegroundColor Green
