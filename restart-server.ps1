# Restart Server Script
Write-Host "Restarting Blog Application Server..." -ForegroundColor Green

# Stop any running Node processes (optional)
# Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Clear client cache
Write-Host "Clearing Vite cache..." -ForegroundColor Cyan
if (Test-Path ".\client\node_modules\.vite") {
    Remove-Item -Recurse -Force ".\client\node_modules\.vite"
    Write-Host "Vite cache cleared" -ForegroundColor Green
} else {
    Write-Host "No Vite cache found to clear" -ForegroundColor Yellow
}

# Start server
Write-Host "Starting server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd $PWD\server; npm start"

Write-Host "`nServer has been restarted." -ForegroundColor Green
Write-Host "- Server should be running at: http://localhost:5001" -ForegroundColor White
Write-Host "`nTo restart the client, run: cd client && npm run dev" -ForegroundColor Yellow 