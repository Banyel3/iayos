# PowerShell script to fix hardcoded localhost URLs in frontend_web
# This script is more careful - only replaces standalone "http://localhost:8000" strings

param(
    [string]$Path = "c:\code\iayos\apps\frontend_web"
)

$importStatement = "import { API_BASE } from '@/lib/api/config';"

# Get all TypeScript files except config.ts and node_modules
$files = Get-ChildItem -Path $Path -Recurse -Include "*.tsx","*.ts" | 
    Where-Object { 
        $_.FullName -notmatch "node_modules" -and 
        $_.FullName -notmatch "lib\\api\\config\.ts$"
    }

$fixedCount = 0

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName)
    $originalContent = $content
    $needsImport = $false
    
    # Pattern 1: Replace standalone `"http://localhost:8000"` (exact match as argument)
    # This handles fetch("http://localhost:8000/api/...") - single quoted fetch URLs
    if ($content -match 'fetch\s*\(\s*"http://localhost:8000') {
        # Replace fetch("http://localhost:8000/path") with fetch(`${API_BASE}/path`)
        $content = $content -replace 'fetch\s*\(\s*"http://localhost:8000(/[^"]*)"', 'fetch(`${API_BASE}$1`'
        $needsImport = $true
    }
    
    # Pattern 2: Replace template literal with localhost: `http://localhost:8000/...`
    # This handles `${baseUrl}http://localhost:8000/...` type patterns
    if ($content -match '`http://localhost:8000') {
        # Replace `http://localhost:8000/path/...` with `${API_BASE}/path/...`
        $content = $content -replace '`http://localhost:8000(/[^`]*)`', '`${API_BASE}$1`'
        $needsImport = $true
    }
    
    # Pattern 3: Replace variable assignments
    # const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
    # We'll remove this line and use the import instead
    if ($content -match 'const\s+API_BASE\s*=\s*[^;]+\|\|\s*"http://localhost:8000"') {
        $content = $content -replace 'const\s+API_BASE\s*=\s*[^;]+\|\|\s*"http://localhost:8000";?\s*\r?\n', ''
        $needsImport = $true
    }
    
    # Pattern 4: Replace API_URL variable assignments
    if ($content -match 'const\s+API_URL\s*=\s*[^;]+\|\|\s*"http://localhost:8000"') {
        # Replace variable name and definition
        $content = $content -replace 'const\s+API_URL\s*=\s*[^;]+\|\|\s*"http://localhost:8000";?\s*\r?\n', ''
        # Also replace usages of API_URL with API_BASE
        $content = $content -replace '\$\{API_URL\}', '${API_BASE}'
        $needsImport = $true
    }
    
    # Pattern 5: apiUrl or baseUrl variable (same logic)
    if ($content -match 'const\s+apiUrl\s*=\s*[^;]+\|\|\s*"http://localhost:8000"') {
        $content = $content -replace 'const\s+apiUrl\s*=\s*[^;]+\|\|\s*"http://localhost:8000";?\s*\r?\n', ''
        $content = $content -replace '\$\{apiUrl\}', '${API_BASE}'
        $needsImport = $true
    }
    
    if ($content -match 'const\s+baseUrl\s*=\s*[^;]+\|\|\s*"http://localhost:8000"') {
        $content = $content -replace 'const\s+baseUrl\s*=\s*[^;]+\|\|\s*"http://localhost:8000";?\s*\r?\n', ''
        $content = $content -replace '\$\{baseUrl\}', '${API_BASE}'
        $needsImport = $true
    }
    
    # Add import if needed and not already present
    if ($needsImport -and $content -notmatch "import.*API_BASE.*from.*@/lib/api/config") {
        # Add import after "use client" directive or at the beginning
        if ($content -match '^"use client";\s*\r?\n') {
            $content = $content -replace '^("use client";\s*\r?\n)', "`$1`n$importStatement`n"
        } else {
            $content = "$importStatement`n$content"
        }
    }
    
    # Write back if changed
    if ($content -ne $originalContent) {
        [System.IO.File]::WriteAllText($file.FullName, $content)
        Write-Host "Fixed: $($file.FullName.Replace($Path, ''))" -ForegroundColor Green
        $fixedCount++
    }
}

Write-Host "`nTotal files fixed: $fixedCount" -ForegroundColor Cyan
