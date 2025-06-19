# Check and Fix Database Script
Write-Host "Checking MongoDB connection..." -ForegroundColor Green

# Check if .env file exists
if (-not (Test-Path ".\server\.env")) {
    Write-Host "ERROR: .env file does not exist in server directory." -ForegroundColor Red
    Write-Host "Creating .env file with default MongoDB URI..." -ForegroundColor Yellow
    
    # Create .env file with default content
    $envContent = @"
PORT=5001
MONGO_URI=mongodb+srv://bhargav623sskal:bhargaV264@mychatcluster.spzuz.mongodb.net/blog_database?retryWrites=true&w=majority&appName=mychatcluster
JWT_SECRET=36f1dc44bcf6b30fd7c7c2bd9384a4f5e2ae8923ad5e9e7f2c1c4e9d0b3c8a7b
JWT_EXPIRE=30d
"@
    
    Set-Content -Path ".\server\.env" -Value $envContent
    Write-Host "Created .env file with default MongoDB URI." -ForegroundColor Green
} else {
    # Check if MONGO_URI is defined in .env
    $envContent = Get-Content ".\server\.env" -Raw
    if (-not ($envContent -match "MONGO_URI=")) {
        Write-Host "ERROR: MONGO_URI is not defined in .env file." -ForegroundColor Red
        Write-Host "Adding default MongoDB URI to .env file..." -ForegroundColor Yellow
        
        # Add MONGO_URI to .env file
        $envContent += "`nMONGO_URI=mongodb+srv://bhargav623sskal:bhargaV264@mychatcluster.spzuz.mongodb.net/blog_database?retryWrites=true&w=majority&appName=mychatcluster"
        Set-Content -Path ".\server\.env" -Value $envContent
        Write-Host "Added default MongoDB URI to .env file." -ForegroundColor Green
    } else {
        # Check if MONGO_URI is defined but empty
        if ($envContent -match "MONGO_URI=`"?`'?$") {
            Write-Host "ERROR: MONGO_URI is empty in .env file." -ForegroundColor Red
            Write-Host "Updating MongoDB URI in .env file..." -ForegroundColor Yellow
            
            # Replace empty MONGO_URI with default value
            $updatedContent = $envContent -replace "MONGO_URI=`"?`'?$", "MONGO_URI=mongodb+srv://bhargav623sskal:bhargaV264@mychatcluster.spzuz.mongodb.net/blog_database?retryWrites=true&w=majority&appName=mychatcluster"
            Set-Content -Path ".\server\.env" -Value $updatedContent
            Write-Host "Updated MongoDB URI in .env file." -ForegroundColor Green
        } else {
            Write-Host "MONGO_URI is defined in .env file." -ForegroundColor Green
        }
    }
}

# Check uploads directory
if (-not (Test-Path ".\server\uploads")) {
    Write-Host "Creating uploads directory..." -ForegroundColor Yellow
    New-Item -Path ".\server\uploads" -ItemType Directory | Out-Null
    Write-Host "Created uploads directory." -ForegroundColor Green
}

if (-not (Test-Path ".\server\uploads\blogs")) {
    Write-Host "Creating blogs upload directory..." -ForegroundColor Yellow
    New-Item -Path ".\server\uploads\blogs" -ItemType Directory | Out-Null
    Write-Host "Created blogs upload directory." -ForegroundColor Green
}

Write-Host "`nDatabase connection check complete." -ForegroundColor Green
Write-Host "You can now run .\restart-all.ps1 to start the application." -ForegroundColor White 