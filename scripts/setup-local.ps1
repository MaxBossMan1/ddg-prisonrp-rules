# Setup for Local Development Environment
Write-Host "🏠 Setting up Local Development Environment..." -ForegroundColor Green

# Create backend .env file for local development
$backendEnv = @"
# DigitalDeltaGaming PrisonRP Rules System - Local Development Configuration
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
BASE_URL=http://localhost:3001

# Database Configuration
DATABASE_PATH=./database/ddg_prisonrp.db

# Session Configuration
SESSION_SECRET=local-development-secret-key-change-for-production

# Steam Authentication Configuration
STEAM_API_KEY=your-steam-api-key-here
STEAM_REALM=http://localhost:3001
STEAM_RETURN_URL=http://localhost:3001/auth/steam/return

# Staff Management
STAFF_SECRET_URL=staff-management-2025

# File Upload Configuration
MAX_FILE_SIZE=10mb
UPLOAD_DIR=./uploads
"@

$backendEnv | Out-File -FilePath "backend\.env" -Encoding UTF8

# Create frontend .env file for local development
$frontendEnv = @"
# Frontend Local Development Configuration
REACT_APP_API_URL=http://localhost:3001
NODE_ENV=development
"@

$frontendEnv | Out-File -FilePath "frontend\.env" -Encoding UTF8

Write-Host "✅ Local development environment configured!" -ForegroundColor Green
Write-Host "📝 Next steps:" -ForegroundColor Yellow
Write-Host "   1. cd backend && npm start"
Write-Host "   2. cd frontend && npm start"
Write-Host "   3. Access frontend at: http://localhost:3000"
Write-Host "   4. Access backend at: http://localhost:3001" 