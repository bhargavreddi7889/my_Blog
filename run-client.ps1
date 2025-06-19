# PowerShell script to run the client
Write-Host "Current directory: $(Get-Location)" -ForegroundColor Cyan
Write-Host "Changing to client directory..." -ForegroundColor Cyan
cd client
Write-Host "New directory: $(Get-Location)" -ForegroundColor Cyan
Write-Host "Starting client..." -ForegroundColor Green
npm run dev 