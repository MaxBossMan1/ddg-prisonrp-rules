#!/bin/bash

echo "🚀 DDG PrisonRP Development Server Setup"
echo "========================================"

# Update system
echo "📦 Updating system packages..."
sudo apt-get update -y

# Install Node.js 18.x
echo "📱 Installing Node.js 18.x..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
echo "⚡ Installing PM2..."
sudo npm install -g pm2

# Install git (if not already installed)
sudo apt-get install -y git

# Verify installations
echo "✅ Verifying installations..."
echo "Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "PM2 version: $(pm2 --version)"

# Clone repository
echo "📥 Cloning DDG PrisonRP repository..."
if [ -d "ddg-prisonrp-rules" ]; then
    echo "Repository already exists, pulling latest changes..."
    cd ddg-prisonrp-rules
    git pull
else
    git clone https://github.com/MaxBossMan1/ddg-prisonrp-rules.git
    cd ddg-prisonrp-rules
fi

# Setup backend
echo "🔧 Setting up backend..."
cd backend

# Copy environment template
if [ ! -f ".env" ]; then
    cp env.example .env
    echo "📝 Created .env file from template"
    echo "⚠️  IMPORTANT: You need to edit .env and add your Steam API key!"
    echo "   Run: nano .env"
    echo "   Set STEAM_API_KEY=your-steam-api-key-here"
    echo "   Set FRONTEND_URL=http://$(curl -s ifconfig.me):3000"
else
    echo "✅ .env file already exists"
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
npm install

# Setup frontend
echo "🎨 Setting up frontend..."
cd ../frontend

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install

# Go back to project root
cd ..

echo "🎯 Setup Complete!"
echo "=================="
echo ""
echo "📝 Next Steps:"
echo "1. Edit the backend/.env file with your Steam API key:"
echo "   cd ~/ddg-prisonrp-rules/backend"
echo "   nano .env"
echo ""
echo "2. Initialize the database:"
echo "   node scripts/add-staff.js"
echo ""
echo "3. Start the applications:"
echo "   pm2 start server.js --name ddg-backend"
echo "   cd ../frontend"
echo "   pm2 start npm --name ddg-frontend -- start"
echo "   pm2 save"
echo "   pm2 startup"
echo ""
echo "4. Check status:"
echo "   pm2 status"
echo ""
echo "🌐 Access URLs (after starting):"
echo "   Frontend: http://$(curl -s ifconfig.me):3000"
echo "   Backend:  http://$(curl -s ifconfig.me):3001"
echo "   Staff:    http://$(curl -s ifconfig.me):3000/staff/staff-management-2024"
echo "" 