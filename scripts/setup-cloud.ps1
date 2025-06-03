# Setup for Cloud/Server Environment
Write-Host "☁️ Setting up Cloud/Server Environment..." -ForegroundColor Green

# Get the public IP of this server
try {
    $ServerIP = (Invoke-RestMethod -Uri "http://ifconfig.me" -TimeoutSec 10).Trim()
    if (-not $ServerIP) {
        $ServerIP = (Invoke-RestMethod -Uri "http://ipinfo.io/ip" -TimeoutSec 10).Trim()
    }
    if (-not $ServerIP) {
        $ServerIP = (Invoke-RestMethod -Uri "http://icanhazip.com" -TimeoutSec 10).Trim()
    }
} catch {
    Write-Host "❌ Could not detect server IP automatically" -ForegroundColor Red
    Write-Host "Please set SERVER_IP manually:" -ForegroundColor Yellow
    Write-Host "`$ServerIP = 'your.server.ip.address'"
    Write-Host "Then run this script again"
    exit 1
}

Write-Host "🌐 Detected Server IP: $ServerIP" -ForegroundColor Cyan

# Create backend .env file for cloud deployment
$backendEnv = @"
# DigitalDeltaGaming PrisonRP Rules System - Cloud/Server Configuration
NODE_ENV=production
PORT=3001
FRONTEND_URL=http://$ServerIP:3000
BASE_URL=http://$ServerIP:3001
BACKEND_URL=http://$ServerIP:3001

# Database Configuration
DATABASE_PATH=./database/ddg_prisonrp.db

# Session Configuration
SESSION_SECRET=change-this-to-a-secure-random-string-for-production

# Steam Authentication Configuration
STEAM_API_KEY=your-steam-api-key-here
STEAM_REALM=http://$ServerIP:3001
STEAM_RETURN_URL=http://$ServerIP:3001/auth/steam/return

# Staff Management
STAFF_SECRET_URL=staff-management-2025

# File Upload Configuration
MAX_FILE_SIZE=10mb
UPLOAD_DIR=./uploads
"@

$backendEnv | Out-File -FilePath "backend\.env" -Encoding UTF8

# Create frontend .env file for cloud deployment
$frontendEnv = @"
# Frontend Cloud/Server Configuration
REACT_APP_API_URL=http://$ServerIP:3001
NODE_ENV=production
"@

$frontendEnv | Out-File -FilePath "frontend\.env" -Encoding UTF8

Write-Host "✅ Cloud/Server environment configured!" -ForegroundColor Green
Write-Host "📝 Configuration Details:" -ForegroundColor Yellow
Write-Host "   🔗 Frontend URL: http://$ServerIP`:3000"
Write-Host "   🔗 Backend URL: http://$ServerIP`:3001"
Write-Host "   🔗 Staff Panel: http://$ServerIP`:3001/staff/staff-management-2025"
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Update your Steam API settings with the new URLs"
Write-Host "   2. cd backend && npm start"
Write-Host "   3. cd frontend && npm start"
Write-Host "   4. Access your site at: http://$ServerIP`:3000" 