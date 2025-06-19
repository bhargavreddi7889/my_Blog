# Restart All Script
Write-Host "Restarting Blog Application..." -ForegroundColor Green

# Check if concurrently is installed
$concurrentlyInstalled = $false
try {
    if (Test-Path -Path "node_modules/concurrently") {
        $concurrentlyInstalled = $true
    }
}
catch {
    $concurrentlyInstalled = $false
}

# Kill any running Node processes (if desired)
# Write-Host "Stopping existing Node processes..." -ForegroundColor Cyan
# Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Clear client cache
Write-Host "Clearing Vite cache..." -ForegroundColor Cyan
if (Test-Path ".\client\node_modules\.vite") {
    Remove-Item -Recurse -Force ".\client\node_modules\.vite"
    Write-Host "Vite cache cleared" -ForegroundColor Green
} else {
    Write-Host "No Vite cache found to clear" -ForegroundColor Yellow
}

# Start server in a new PowerShell window
Write-Host "Starting server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\server'; npm start"

# Wait a bit for the server to start
Start-Sleep -Seconds 2

# Start client in a new PowerShell window
Write-Host "Starting client..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\client'; npm run dev"

Write-Host "`nBlog application is starting in separate windows." -ForegroundColor Green
Write-Host "- Server should be running at: http://localhost:5001" -ForegroundColor White
Write-Host "- Client should be running at: http://localhost:5173" -ForegroundColor White
Write-Host "`nIf you see MongoDB errors, make sure your .env file in server folder has the MONGO_URI defined properly." -ForegroundColor Yellow 