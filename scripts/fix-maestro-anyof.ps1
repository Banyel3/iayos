# Comprehensive fix for all anyOf instances in Maestro test files
# This will replace anyOf blocks with just the first element + optional: true

$maestroDir = "c:\code\iayos\apps\frontend_mobile\iayos_mobile\.maestro"
$files = Get-ChildItem -Path $maestroDir -Recurse -Filter *.yaml | Where-Object { $_.Name -ne 'config.yaml' }

Write-Host "Processing $($files.Count) test files..." -ForegroundColor Cyan
$totalFixed = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    $fileFixed = 0
    
    # Pattern: Match anyOf block and replace with first element
    # This handles: anyOf:\n    - id: "something"\n    - id: "another"
    # Replaces with: id: "something"
    
    $lines = $content -split "`n"
    $newLines = @()
    $i = 0
    $skipUntilIndent = -1
    
    while ($i -lt $lines.Count) {
        $line = $lines[$i]
        
        # Check if line contains "anyOf:"
        if ($line -match '^(\s+)anyOf:\s*$') {
            $indent = $matches[1]
            $indentLen = $indent.Length
            
            # Look ahead to find the first element
            $j = $i + 1
            $firstElement = $null
            
            while ($j -lt $lines.Count) {
                $nextLine = $lines[$j]
                
                # Check if this is a list item (starts with '- ')
                if ($nextLine -match "^$indent\s{2,4}-\s+(.+)") {
                    # Extract the property (id: "something" or text: "something")
                    $firstElement = $matches[1].Trim()
                    break
                } elseif ($nextLine -match "^$indent\s{2,4}(\w+):\s*(.+)") {
                    # Direct property without list marker
                    $firstElement = $matches[1] + ": " + $matches[2]
                    break
                } elseif ($nextLine.Trim() -eq "" -or $nextLine -match "^\s*#") {
                    # Skip empty lines and comments
                    $j++
                    continue
                } else {
                    break
                }
            }
            
            if ($firstElement) {
                # Add the first element as a direct property
                $newLines += "$indent$firstElement"
                
                # Check if there's already an "optional:" field after the anyOf block
                $hasOptional = $false
                $k = $j + 1
                while ($k -lt $lines.Count) {
                    $checkLine = $lines[$k]
                    if ($checkLine -match "^$indent\s{2,4}-\s+") {
                        # Another list item, keep checking
                        $k++
                    } elseif ($checkLine -match "^$indent(optional:)") {
                        $hasOptional = $true
                        break
                    } elseif ($checkLine -match "^\s*$" -or $checkLine -match "^\s*#") {
                        # Empty line or comment
                        $k++
                    } else {
                        # Different property at same indent level
                        break
                    }
                }
                
                # Add optional: true if not already present
                if (-not $hasOptional) {
                    $newLines += "${indent}optional: true"
                }
                
                # Skip all anyOf list items
                $i = $j
                while ($i -lt $lines.Count) {
                    $skipLine = $lines[$i]
                    if ($skipLine -match "^$indent\s{2,4}-\s+" -or $skipLine -match "^$indent\s{2,4}\w+:") {
                        # Skip this list item
                        $i++
                    } elseif ($skipLine -match "^$indent(optional:)" -and -not $hasOptional) {
                        # Skip the optional line if we're adding our own
                        $i++
                        break
                    } elseif ($skipLine -match "^\s*$" -or $skipLine -match "^\s*#") {
                        # Skip empty lines and comments within the anyOf block
                        $i++
                    } else {
                        # We've reached the end of the anyOf block
                        break
                    }
                }
                $fileFixed++
                $i-- # Back up one since the while loop will increment
            } else {
                $newLines += $line
            }
        } else {
            $newLines += $line
        }
        
        $i++
    }
    
    $content = $newLines -join "`n"
    
    # Save if modified
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $totalFixed += $fileFixed
        Write-Host "✓ $($file.Name): Fixed $fileFixed anyOf blocks" -ForegroundColor Green
    }
}

Write-Host "`nTotal: Fixed $totalFixed anyOf blocks across all files!" -ForegroundColor Cyan
