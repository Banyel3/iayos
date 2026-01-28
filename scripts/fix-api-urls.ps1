# Fix hardcoded localhost URLs in frontend_web
# Replaces http://localhost:8000 with centralized API_BASE from @/lib/api/config

$ErrorActionPreference = "Stop"
$frontendPath = "c:\code\iayos\apps\frontend_web"

Write-Host "=== Fixing Hardcoded API URLs ===" -ForegroundColor Cyan
Write-Host ""

# Find all affected .tsx and .ts files in app/ directory
$files = Get-ChildItem -Path "$frontendPath\app" -Recurse -Include "*.tsx","*.ts" | 
    Where-Object { $_.FullName -notmatch 'node_modules' } |
    Select-String -Pattern 'http://localhost:8000' -List | 
    Select-Object -ExpandProperty Path -Unique

Write-Host "Found $($files.Count) files with hardcoded localhost URLs" -ForegroundColor Yellow
Write-Host ""

$fixedCount = 0

foreach ($file in $files) {
    $relativePath = $file.Replace("$frontendPath\", "")
    Write-Host "Processing: $relativePath" -ForegroundColor Gray
    
    $content = [System.IO.File]::ReadAllText($file)
    $originalContent = $content
    
    # Check if API_BASE is already imported from lib/api/config
    $hasApiBaseImport = $content -match "import\s*\{[^}]*API_BASE[^}]*\}\s*from\s*['""]@/lib/api/config['""]"
    
    if (-not $hasApiBaseImport) {
        # Check if there's any import from @/lib/api/config
        if ($content -match "(import\s*\{)([^}]*)(\}\s*from\s*['""]@/lib/api/config['""])") {
            # Add API_BASE to existing import
            $content = $content -replace "(import\s*\{)([^}]*)(\}\s*from\s*['""]@/lib/api/config['""])", '$1 API_BASE,$2$3'
        } else {
            # Add new import after "use client" if present, otherwise at top
            if ($content -match '^"use client";?\s*\r?\n') {
                $content = $content -replace '^("use client";?\s*\r?\n)', "`$1import { API_BASE } from '@/lib/api/config';`n"
            } elseif ($content -match "^'use client';?\s*\r?\n") {
                $content = $content -replace "^('use client';?\s*\r?\n)", "`$1import { API_BASE } from '@/lib/api/config';`n"
            } else {
                $content = "import { API_BASE } from '@/lib/api/config';`n" + $content
            }
        }
    }
    
    # Replace hardcoded URLs - various patterns
    
    # Pattern 1: Template literal `http://localhost:8000/... -> `${API_BASE}/...
    $content = $content -replace '`http://localhost:8000/', '`${API_BASE}/'
    
    # Pattern 2: String "http://localhost:8000/api/..." -> `${API_BASE}/api/...`
    $content = $content -replace '"http://localhost:8000/api/', '`${API_BASE}/api/'
    
    # Pattern 3: String "http://localhost:8000" at end of line or with comma
    $content = $content -replace '"http://localhost:8000"', 'API_BASE'
    
    # Pattern 4: Local API_BASE variable definitions - comment them out
    $content = $content -replace 'const API_BASE = process\.env\.NEXT_PUBLIC_API_URL \|\| "http://localhost:8000";', '// API_BASE imported from @/lib/api/config'
    $content = $content -replace 'const API_BASE =\s*\r?\n\s*process\.env\.NEXT_PUBLIC_API_URL \|\| "http://localhost:8000";', '// API_BASE imported from @/lib/api/config'
    
    # Pattern 5: Other env var patterns
    $content = $content -replace 'process\.env\.NEXT_PUBLIC_BACKEND_URL \|\| "http://localhost:8000"', 'API_BASE'
    $content = $content -replace 'process\.env\.NEXT_PUBLIC_API_URL \|\| "http://localhost:8000"', 'API_BASE'
    
    # Pattern 6: Fetch with string concatenation `http://localhost:8000${...}` -> `${API_BASE}${...}`
    $content = $content -replace '`http://localhost:8000\$\{', '`${API_BASE}${'
    
    if ($content -ne $originalContent) {
        [System.IO.File]::WriteAllText($file, $content)
        Write-Host "  [FIXED] $relativePath" -ForegroundColor Green
        $fixedCount++
    } else {
        Write-Host "  [NO CHANGE] $relativePath" -ForegroundColor DarkGray
    }
}

Write-Host ""
Write-Host "=== Summary ===" -ForegroundColor Cyan
Write-Host "Files scanned: $($files.Count)"
Write-Host "Files fixed: $fixedCount" -ForegroundColor Green
Write-Host ""

# Verify no localhost URLs remain
Write-Host "=== Verification ===" -ForegroundColor Cyan
$remaining = Get-ChildItem -Path "$frontendPath\app" -Recurse -Include "*.tsx","*.ts" | 
    Where-Object { $_.FullName -notmatch 'node_modules' } |
    Select-String -Pattern 'http://localhost:8000'

if ($remaining.Count -eq 0) {
    Write-Host "SUCCESS: No hardcoded localhost URLs remaining in app/ folder" -ForegroundColor Green
} else {
    Write-Host "WARNING: $($remaining.Count) occurrences still found:" -ForegroundColor Red
    $remaining | ForEach-Object {
        Write-Host "  $($_.Path):$($_.LineNumber): $($_.Line.Trim())" -ForegroundColor Yellow
    }
}
