$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$Python = Join-Path $Root ".venv\Scripts\python.exe"
if (-not (Test-Path $Python)) {
    $Python = "python"
}

if (-not $env:DATABASE_URL) {
    $env:DATABASE_URL = "sqlite:///$($Root -replace '\\', '/')/e2e-notes.db"
}
$DbFile = Join-Path $Root "e2e-notes.db"
if (Test-Path $DbFile) {
    Remove-Item $DbFile -Force
}

& $Python -m alembic upgrade head
& $Python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
