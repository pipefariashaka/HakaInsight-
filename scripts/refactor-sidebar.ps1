# Script to refactor SidebarPanelManager.ts
$filePath = "src/extension/SidebarPanelManager.ts"
$content = Get-Content $filePath -Raw

# Find the start and end of getWebviewContent method
$startPattern = '  private getWebviewContent\(\): string \{'
$endPattern = '^\s*\}\s*\}\s*$'

# Read the file line by line
$lines = Get-Content $filePath

# Find line numbers
$startLine = -1
$endLine = -1

for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match 'private getWebviewContent\(\): string') {
        $startLine = $i
        Write-Host "Found start at line $i"
    }
    if ($startLine -ge 0 -and $i -gt $startLine -and $lines[$i] -match '^\s*\}\s*$' -and $lines[$i+1] -match '^\}') {
        $endLine = $i
        Write-Host "Found end at line $i"
        break
    }
}

if ($startLine -ge 0 -and $endLine -ge 0) {
    Write-Host "Method spans from line $startLine to $endLine"
    Write-Host "Total lines to replace: $($endLine - $startLine + 1)"
} else {
    Write-Host "Could not find method boundaries"
    Write-Host "Start: $startLine, End: $endLine"
}
