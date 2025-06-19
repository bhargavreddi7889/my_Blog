# Blog Application Startup Script
Write-Host "Starting Blog Application..." -ForegroundColor Green

# Check if Node.js is installed
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Node.js is not installed. Please install Node.js and try again." -ForegroundColor Red
    exit 1
}

# Check MongoDB connection in the .env file
$envPath = ".\server\.env"
if (Test-Path $envPath) {
    $envContent = Get-Content $envPath -Raw
    if ($envContent -notmatch "MONGO_URI=") {
        Write-Host "Error: MONGO_URI is not defined in the .env file. Please add it and try again." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Warning: .env file not found in server directory. MongoDB connection might fail." -ForegroundColor Yellow
}

# In PowerShell, we need to use separate windows for the client and server
Write-Host "Starting server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd $PWD\server; npm start"

Write-Host "Starting client..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd $PWD\client; npm run dev"

Write-Host "`nBlog application is starting in separate windows." -ForegroundColor Green
Write-Host "- Server should be running at: http://localhost:5001" -ForegroundColor White
Write-Host "- Client should be running at: http://localhost:5173" -ForegroundColor White
Write-Host "`nNote: Check the server window for any MongoDB connection errors" -ForegroundColor Yellow 