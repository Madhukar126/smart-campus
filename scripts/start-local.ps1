[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$backendDirectory = Join-Path $projectRoot "backend"
$frontendDirectory = Join-Path $projectRoot "frontend"
$venvPython = Join-Path $backendDirectory ".venv\Scripts\python.exe"
$nodeModules = Join-Path $frontendDirectory "node_modules"
$runtimeDirectory = Join-Path $projectRoot ".local-runtime"
$stateFile = Join-Path $runtimeDirectory "processes.json"

if (-not (Test-Path -LiteralPath $venvPython) -or -not (Test-Path -LiteralPath $nodeModules)) {
    throw "Local dependencies are missing. Run .\scripts\setup-local.ps1 first."
}

if (Test-Path -LiteralPath $stateFile) {
    throw "Campus360 may already be running. Run .\scripts\stop-local.ps1 before starting it again."
}

New-Item -ItemType Directory -Force -Path $runtimeDirectory | Out-Null

$env:DATABASE_URL = "sqlite+pysqlite:///./campus360_local.db"
$env:JWT_SECRET = "local-development-only-change-me"
$env:ACCESS_TOKEN_EXPIRE_MINUTES = "60"
$env:BACKEND_CORS_ORIGINS = "http://localhost:3000"
$env:NEXT_PUBLIC_API_URL = "http://localhost:8000/api/v1"

Push-Location $backendDirectory
try {
    & $venvPython -m alembic upgrade head
    if ($LASTEXITCODE -ne 0) {
        throw "Database migration failed."
    }
} finally {
    Pop-Location
}

$backendProcess = Start-Process `
    -FilePath $venvPython `
    -ArgumentList @("-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000", "--reload") `
    -WorkingDirectory $backendDirectory `
    -WindowStyle Hidden `
    -RedirectStandardOutput (Join-Path $runtimeDirectory "backend.log") `
    -RedirectStandardError (Join-Path $runtimeDirectory "backend-error.log") `
    -PassThru

$frontendProcess = Start-Process `
    -FilePath "npm.cmd" `
    -ArgumentList @("run", "dev") `
    -WorkingDirectory $frontendDirectory `
    -WindowStyle Hidden `
    -RedirectStandardOutput (Join-Path $runtimeDirectory "frontend.log") `
    -RedirectStandardError (Join-Path $runtimeDirectory "frontend-error.log") `
    -PassThru

@{
    backendPid = $backendProcess.Id
    frontendPid = $frontendProcess.Id
    startedAt = [DateTimeOffset]::Now.ToString("O")
} | ConvertTo-Json | Set-Content -LiteralPath $stateFile -Encoding UTF8

Write-Host "Campus360 is starting without Docker." -ForegroundColor Green
Write-Host "Web application: http://localhost:3000"
Write-Host "API documentation: http://localhost:8000/docs"
Write-Host "Backend logs: $runtimeDirectory\backend.log"
Write-Host "Frontend logs: $runtimeDirectory\frontend.log"
Write-Host "Stop the application with: .\scripts\stop-local.ps1"

