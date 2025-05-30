#!/bin/bash

echo "🔧 Updating DDG PrisonRP Cloud Configuration..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Server details
SERVER_IP="34.132.234.56"
BACKEND_PORT="3001"
FRONTEND_PORT="3000"

echo -e "${BLUE}📋 Configuration Details:${NC}"
echo -e "   Server IP: ${SERVER_IP}"
echo -e "   Frontend URL: http://${SERVER_IP}:${FRONTEND_PORT}"
echo -e "   Backend URL: http://${SERVER_IP}:${BACKEND_PORT}"
echo -e "   Staff Dashboard: http://${SERVER_IP}:${FRONTEND_PORT}/staff/staff-dashboard-2025"
echo ""

# Check if we're running on the cloud server
if [[ $(curl -s ifconfig.me 2>/dev/null) == "$SERVER_IP" ]]; then
    echo -e "${GREEN}✅ Running on cloud server${NC}"
    
    # Update backend .env file
    echo -e "${YELLOW}🔧 Updating backend configuration...${NC}"
    cd ~/ddg-prisonrp-rules/backend
    
    # Create .env file with cloud configuration
    cat > .env << EOF
# DigitalDeltaGaming PrisonRP Rules System - Cloud Configuration

# Server Configuration
NODE_ENV=development
PORT=${BACKEND_PORT}
FRONTEND_URL=http://${SERVER_IP}:${FRONTEND_PORT}

# Database Configuration
DATABASE_PATH=./database/ddg_prisonrp.db

# Session Configuration
SESSION_SECRET=ddg-super-secure-session-secret-2024-cloud

# Steam Authentication Configuration
STEAM_API_KEY=your-steam-api-key-here
STEAM_REALM=http://${SERVER_IP}:${BACKEND_PORT}
STEAM_RETURN_URL=http://${SERVER_IP}:${BACKEND_PORT}/auth/steam/return

# Staff Management
STAFF_SECRET_URL=staff-dashboard-2025

# File Upload Configuration
MAX_FILE_SIZE=10mb
UPLOAD_DIR=./uploads
EOF

    echo -e "${GREEN}✅ Backend .env updated${NC}"
    
    # Stop existing services
    echo -e "${YELLOW}⏹️ Stopping existing services...${NC}"
    pm2 stop ddg-backend ddg-frontend 2>/dev/null || true
    
    # Install/update dependencies
    echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
    npm install
    
    echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
    cd ../frontend
    npm install
    
    # Start services
    echo -e "${YELLOW}🚀 Starting services...${NC}"
    cd ../backend
    pm2 start server.js --name ddg-backend
    
    cd ../frontend
    pm2 start npm --name ddg-frontend -- start
    
    # Save PM2 configuration
    pm2 save
    
    # Show status
    echo ""
    echo -e "${GREEN}🎉 Services started successfully!${NC}"
    pm2 status
    
    echo ""
    echo -e "${BLUE}📋 Access URLs:${NC}"
    echo -e "   🌐 Main Site: ${GREEN}http://${SERVER_IP}:${FRONTEND_PORT}${NC}"
    echo -e "   👥 Staff Dashboard: ${GREEN}http://${SERVER_IP}:${FRONTEND_PORT}/staff/staff-dashboard-2025${NC}"
    echo -e "   🔧 Backend API: ${GREEN}http://${SERVER_IP}:${BACKEND_PORT}/health${NC}"
    echo ""
    echo -e "${YELLOW}⚠️ Don't forget to:${NC}"
    echo -e "   1. Add your Steam API key to backend/.env"
    echo -e "   2. Add your Steam ID as admin: ${BLUE}node scripts/add-staff.js YOUR_STEAM_ID \"Your Name\" admin${NC}"
    
else
    echo -e "${RED}❌ This script should be run on the cloud server (${SERVER_IP})${NC}"
    echo -e "${YELLOW}💡 To connect to the server:${NC}"
    echo -e "   ${BLUE}gcloud compute ssh ddg-development-server --zone=us-central1-a${NC}"
    echo ""
    echo -e "${YELLOW}💡 Then run this script on the server:${NC}"
    echo -e "   ${BLUE}cd ~/ddg-prisonrp-rules && chmod +x update-cloud-config.sh && ./update-cloud-config.sh${NC}"
fi 