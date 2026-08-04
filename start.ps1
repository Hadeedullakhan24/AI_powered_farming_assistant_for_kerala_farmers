# ============================================================
#  start.ps1  –  One-click launcher for AgriAssist
#  Double-click this file OR run:  powershell -File start.ps1
# ============================================================

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AgriAssist – Starting up..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ── 1. Activate the virtual environment ──────────────────────
$activate = Join-Path $root ".venv\Scripts\Activate.ps1"
if (Test-Path $activate) {
    Write-Host "[1/3] Activating virtual environment..." -ForegroundColor Yellow
    & $activate
} else {
    Write-Host "[ERROR] .venv not found. Please create it first:" -ForegroundColor Red
    Write-Host "        python -m venv .venv" -ForegroundColor Red
    Write-Host "        .venv\Scripts\Activate.ps1" -ForegroundColor Red
    Write-Host "        pip install -r backend\requirements.txt" -ForegroundColor Red
    pause
    exit 1
}

# ── 2. Start backend in a new window ─────────────────────────
Write-Host "[2/3] Starting FastAPI backend on http://localhost:8000 ..." -ForegroundColor Yellow
$backendCmd = "Set-Location '$root'; .venv\Scripts\uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd

# ── 3. Start frontend in a new window ────────────────────────
Write-Host "[3/3] Starting Vite frontend on http://localhost:5173 ..." -ForegroundColor Yellow
$frontendCmd = "Set-Location '$root\frontend'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd

# ── 4. Wait for Vite to boot, then open the browser ──────────
Write-Host ""
Write-Host "Waiting 5 seconds for servers to start..." -ForegroundColor Gray
Start-Sleep -Seconds 5

Write-Host "Opening http://localhost:5173 in your browser..." -ForegroundColor Green
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Both servers are running!" -ForegroundColor Green
Write-Host "  Frontend : http://localhost:5173" -ForegroundColor Green
Write-Host "  Backend  : http://localhost:8000" -ForegroundColor Green
Write-Host "  Close the two NEW terminal windows to stop." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
