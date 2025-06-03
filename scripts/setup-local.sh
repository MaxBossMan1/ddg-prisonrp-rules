#!/bin/bash

# Setup for Local Development Environment
echo "🏠 Setting up Local Development Environment..."

# Create/update backend .env file for local development
cat > backend/.env << EOF
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
EOF

# Create/update frontend .env file for local development
cat > frontend/.env << EOF
# Frontend Local Development Configuration
REACT_APP_API_URL=http://localhost:3001
NODE_ENV=development
EOF

echo "✅ Local development environment configured!"
echo "📝 Next steps:"
echo "   1. cd backend && npm start"
echo "   2. cd frontend && npm start"
echo "   3. Access frontend at: http://localhost:3000"
echo "   4. Access backend at: http://localhost:3001" 