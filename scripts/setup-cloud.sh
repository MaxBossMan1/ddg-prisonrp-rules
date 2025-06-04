#!/bin/bash

# Setup for Cloud/Server Environment
echo "☁️ Setting up Cloud/Server Environment..."

# Get the public IP of this server
SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || curl -s icanhazip.com)

if [ -z "$SERVER_IP" ]; then
    echo "❌ Could not detect server IP automatically"
    echo "Please set SERVER_IP manually:"
    echo "export SERVER_IP=your.server.ip.address"
    echo "Then run this script again"
    exit 1
fi

echo "🌐 Detected Server IP: $SERVER_IP"

# Create/update backend .env file for cloud deployment
cat > backend/.env << EOF
# DigitalDeltaGaming PrisonRP Rules System - Cloud/Server Configuration
NODE_ENV=production
PORT=3001
FRONTEND_URL=http://$SERVER_IP:3000
BASE_URL=http://$SERVER_IP:3001
BACKEND_URL=http://$SERVER_IP:3001

# Database Configuration
DATABASE_PATH=./database/ddg_prisonrp.db

# Session Configuration
SESSION_SECRET=change-this-to-a-secure-random-string-for-production

# Steam Authentication Configuration
STEAM_API_KEY=your-steam-api-key-here
STEAM_REALM=http://$SERVER_IP:3001
STEAM_RETURN_URL=http://$SERVER_IP:3001/auth/steam/return

# Staff Management
STAFF_SECRET_URL=staff-management-2025

# File Upload Configuration
MAX_FILE_SIZE=10mb
UPLOAD_DIR=./uploads
EOF

# Create/update frontend .env file for cloud deployment
cat > frontend/.env << EOF
# Frontend Cloud/Server Configuration
REACT_APP_API_URL=http://$SERVER_IP:3001
NODE_ENV=production
EOF

echo "✅ Cloud/Server environment configured!"
echo "📝 Configuration Details:"
echo "   🔗 Frontend URL: http://$SERVER_IP:3000"
echo "   🔗 Backend URL: http://$SERVER_IP:3001"
echo "   🔗 Staff Panel: http://$SERVER_IP:3001/staff/staff-management-2025"
echo ""
echo "📝 Next steps:"
echo "   1. Update your Steam API settings with the new URLs"
echo "   2. cd backend && npm start"
echo "   3. cd frontend && npm start"
echo "   4. Access your site at: http://$SERVER_IP:3000" 