# PowerShell script to run the server
Write-Host "Current directory: $(Get-Location)" -ForegroundColor Cyan
Write-Host "Changing to server directory..." -ForegroundColor Cyan
cd server
Write-Host "New directory: $(Get-Location)" -ForegroundColor Cyan
Write-Host "Starting server..." -ForegroundColor Green
npm run dev 