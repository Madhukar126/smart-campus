[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$runtimeDirectory = Join-Path $projectRoot ".local-runtime"
$stateFile = Join-Path $runtimeDirectory "processes.json"

if (-not (Test-Path -LiteralPath $stateFile)) {
    Write-Host "Campus360 is not recorded as running."
    exit 0
}

$state = Get-Content -Raw -LiteralPath $stateFile | ConvertFrom-Json

foreach ($processId in @($state.backendPid, $state.frontendPid)) {
    if ($processId -and (Get-Process -Id $processId -ErrorAction SilentlyContinue)) {
        Stop-Process -Id $processId -Force
    }
}

Remove-Item -LiteralPath $stateFile -Force
Write-Host "Campus360 local servers have stopped." -ForegroundColor Green

