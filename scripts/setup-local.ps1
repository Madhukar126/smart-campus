[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$backendDirectory = Join-Path $projectRoot "backend"
$frontendDirectory = Join-Path $projectRoot "frontend"
$venvDirectory = Join-Path $backendDirectory ".venv"
$venvPython = Join-Path $venvDirectory "Scripts\python.exe"

function Find-PythonLauncher {
    $python = Get-Command python -ErrorAction SilentlyContinue
    if ($python) {
        return @{ FilePath = $python.Source; Arguments = @() }
    }

    $py = Get-Command py -ErrorAction SilentlyContinue
    if ($py) {
        return @{ FilePath = $py.Source; Arguments = @("-3") }
    }

    throw "Python 3.12 or newer was not found. Install Python, enable 'Add Python to PATH', and run this script again."
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    throw "npm was not found. Install Node.js 20 or newer and run this script again."
}

if (-not (Test-Path -LiteralPath $venvPython)) {
    $launcher = Find-PythonLauncher
    Write-Host "Creating the backend virtual environment..." -ForegroundColor Cyan
    & $launcher.FilePath @($launcher.Arguments) -m venv $venvDirectory
    if ($LASTEXITCODE -ne 0) {
        throw "Python could not create the virtual environment."
    }
}

Write-Host "Installing backend dependencies..." -ForegroundColor Cyan
& $venvPython -m pip install --upgrade pip
& $venvPython -m pip install -r (Join-Path $backendDirectory "requirements-dev.txt")
if ($LASTEXITCODE -ne 0) {
    throw "Backend dependency installation failed."
}

Write-Host "Installing frontend dependencies..." -ForegroundColor Cyan
Push-Location $frontendDirectory
try {
    if (Test-Path -LiteralPath (Join-Path $frontendDirectory "package-lock.json")) {
        & npm.cmd ci
    } else {
        & npm.cmd install
    }
    if ($LASTEXITCODE -ne 0) {
        throw "Frontend dependency installation failed."
    }
} finally {
    Pop-Location
}

$env:DATABASE_URL = "sqlite+pysqlite:///./campus360_local.db"
$env:JWT_SECRET = "local-development-only-change-me"
$env:BACKEND_CORS_ORIGINS = "http://localhost:3000"

Write-Host "Creating the local SQLite database..." -ForegroundColor Cyan
Push-Location $backendDirectory
try {
    & $venvPython -m alembic upgrade head
    if ($LASTEXITCODE -ne 0) {
        throw "Database migration failed."
    }
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "Campus360 local setup is complete." -ForegroundColor Green
Write-Host "Start the application with: .\scripts\start-local.ps1"

