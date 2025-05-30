#!/bin/bash

echo "🚀 Deploying DDG PrisonRP Staff Dashboard Fix..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 This script will:${NC}"
echo -e "   1. Pull latest fixes from GitHub"
echo -e "   2. Update backend configuration for cloud server"
echo -e "   3. Restart services with correct settings"
echo ""

# Navigate to project directory
cd ~/ddg-prisonrp-rules

# Pull latest changes
echo -e "${YELLOW}📥 Pulling latest fixes from GitHub...${NC}"
git pull origin main

# Stop existing services
echo -e "${YELLOW}⏹️ Stopping existing services...${NC}"
pm2 stop ddg-backend ddg-frontend 2>/dev/null || true

# Update backend configuration
echo -e "${YELLOW}🔧 Updating backend configuration...${NC}"
cd ~/ddg-prisonrp-rules/backend

# Create .env file with cloud configuration
cat > .env << 'EOF'
# DigitalDeltaGaming PrisonRP Rules System - Cloud Configuration

# Server Configuration
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://34.132.234.56:3000

# Database Configuration
DATABASE_PATH=./database/ddg_prisonrp.db

# Session Configuration
SESSION_SECRET=ddg-super-secure-session-secret-2024-cloud

# Steam Authentication Configuration
STEAM_API_KEY=your-steam-api-key-here
STEAM_REALM=http://34.132.234.56:3001
STEAM_RETURN_URL=http://34.132.234.56:3001/auth/steam/return

# Staff Management
STAFF_SECRET_URL=staff-dashboard-2025

# File Upload Configuration
MAX_FILE_SIZE=10mb
UPLOAD_DIR=./uploads
EOF

echo -e "${GREEN}✅ Backend .env updated${NC}"

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
echo -e "${GREEN}🎉 Deployment complete!${NC}"
pm2 status

echo ""
echo -e "${BLUE}📋 Access URLs:${NC}"
echo -e "   🌐 Main Site: ${GREEN}http://34.132.234.56:3000${NC}"
echo -e "   👥 Staff Dashboard: ${GREEN}http://34.132.234.56:3000/staff/staff-dashboard-2025${NC}"
echo -e "   🔧 Backend Health: ${GREEN}http://34.132.234.56:3001/health${NC}"
echo ""
echo -e "${YELLOW}⚠️ Don't forget to:${NC}"
echo -e "   1. Add your Steam API key to backend/.env"
echo -e "   2. Add your Steam ID as admin: ${BLUE}cd backend && node scripts/add-staff.js YOUR_STEAM_ID \"Your Name\" admin${NC}"
echo ""
echo -e "${GREEN}✅ Staff dashboard should now work properly!${NC}" 