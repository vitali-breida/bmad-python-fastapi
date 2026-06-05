# Point this repo at .githooks/ (run once per clone).
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root
git config core.hooksPath .githooks
Write-Host "Git hooks path set to .githooks"
Write-Host "pre-commit will run npm ci when frontend/package*.json is staged."
