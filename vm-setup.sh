#!/bin/bash

# VM Setup Script for DDG PrisonRP Server
echo "Starting DDG PrisonRP VM Setup..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Git
sudo apt-get install -y git

# Install PM2 globally
sudo npm install -g pm2

# Create application directory
sudo mkdir -p /opt/ddg-prisonrp
sudo chown $USER:$USER /opt/ddg-prisonrp
cd /opt/ddg-prisonrp

# Clone the repository (this will be done manually)
echo "Repository should be cloned manually to /opt/ddg-prisonrp"

# Create environment file template
cat > .env << 'EOF'
NODE_ENV=production
PORT=3001
SESSION_SECRET=your-super-secret-session-key-here-change-this
DISCORD_CLIENT_ID=1386748138164851000
DISCORD_CLIENT_SECRET=F8JDiZzPcxp2qp7nd1pvwSWj6Kr_SaX1
DISCORD_CALLBACK_URL=http://34.41.22.155:3001/auth/discord/callback
DATABASE_TYPE=sqlite
DATABASE_PATH=./database/ddg_motd.db
EOF

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'ddg-prisonrp-backend',
    script: './server.js',
    cwd: '/opt/ddg-prisonrp/backend',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: '/var/log/ddg-prisonrp-error.log',
    out_file: '/var/log/ddg-prisonrp-out.log',
    log_file: '/var/log/ddg-prisonrp-combined.log',
    time: true
  }]
};
EOF

# Create log files with proper permissions
sudo touch /var/log/ddg-prisonrp-error.log
sudo touch /var/log/ddg-prisonrp-out.log
sudo touch /var/log/ddg-prisonrp-combined.log
sudo chown $USER:$USER /var/log/ddg-prisonrp-*.log

# Create systemd service for PM2
sudo tee /etc/systemd/system/ddg-prisonrp.service > /dev/null << 'EOF'
[Unit]
Description=DDG PrisonRP Backend Service
After=network.target

[Service]
Type=forking
User=maxbossman1
WorkingDirectory=/opt/ddg-prisonrp
ExecStart=/usr/local/bin/pm2 start ecosystem.config.js --no-daemon
ExecReload=/usr/local/bin/pm2 reload ecosystem.config.js
ExecStop=/usr/local/bin/pm2 stop ecosystem.config.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable the service
sudo systemctl daemon-reload
sudo systemctl enable ddg-prisonrp

echo "VM setup complete!"
echo "Next steps:"
echo "1. Clone your repository to /opt/ddg-prisonrp"
echo "2. Install dependencies with 'npm install' in both frontend and backend directories"
echo "3. Update the .env file with correct values"
echo "4. Initialize the database"
echo "5. Start the service with 'sudo systemctl start ddg-prisonrp'"
echo ""
echo "VM External IP: 34.41.22.155"
echo "Backend will be available at: http://34.41.22.155:3001" 