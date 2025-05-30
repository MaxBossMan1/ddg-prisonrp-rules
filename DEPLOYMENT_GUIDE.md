# 🚀 DDG PrisonRP - Google Cloud Deployment Guide

## 📋 **Overview**

This guide covers everything you need to deploy, manage, and maintain the DDG PrisonRP Rules Management System on Google Cloud.

**Server Details:**
- **Instance**: ddg-development-server
- **External IP**: 34.132.234.56
- **Zone**: us-central1-a
- **Frontend URL**: http://34.132.234.56:3000
- **Backend URL**: http://34.132.234.56:3001
- **Staff Dashboard**: http://34.132.234.56:3000/staff/staff-management-2024

---

## 🛠️ **Initial Installation**

### **Step 1: Connect to Server**
```bash
gcloud compute ssh ddg-development-server --zone=us-central1-a
```

### **Step 2: System Setup**
```bash
# Update system
sudo apt-get update -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install additional tools
sudo apt-get install -y git unzip
```

### **Step 3: Download Application**
```bash
cd ~

# Option A: Git clone (if authentication works)
git clone https://github.com/MaxBossMan1/ddg-prisonrp-rules.git

# Option B: Direct file download (if git fails)
mkdir -p ddg-prisonrp-rules/backend ddg-prisonrp-rules/frontend
cd ddg-prisonrp-rules/backend
curl -o package.json https://raw.githubusercontent.com/MaxBossMan1/ddg-prisonrp-rules/main/backend/package.json
curl -o server.js https://raw.githubusercontent.com/MaxBossMan1/ddg-prisonrp-rules/main/backend/server.js
curl -o env.example https://raw.githubusercontent.com/MaxBossMan1/ddg-prisonrp-rules/main/backend/env.example
cd ../frontend
curl -o package.json https://raw.githubusercontent.com/MaxBossMan1/ddg-prisonrp-rules/main/frontend/package.json
```

### **Step 4: Backend Configuration**
```bash
cd ~/ddg-prisonrp-rules/backend

# Create environment file
cp env.example .env

# Edit configuration
nano .env
```

**Required .env settings:**
```env
STEAM_API_KEY=your-steam-api-key-here
PORT=3001
FRONTEND_URL=http://34.132.234.56:3000
DATABASE_PATH=./database/ddg_motd.db
SESSION_SECRET=ddg-super-secure-session-secret-2024
STAFF_SECRET_URL=staff-management-2024
NODE_ENV=development
```

### **Step 5: Install Dependencies**
```bash
# Backend dependencies
cd ~/ddg-prisonrp-rules/backend
npm install

# Frontend dependencies
cd ~/ddg-prisonrp-rules/frontend
npm install
```

### **Step 6: Initialize Database**
```bash
cd ~/ddg-prisonrp-rules/backend
node scripts/add-staff.js
```

---

## ▶️ **Starting the Application**

### **Start Both Services**
```bash
# Start backend
cd ~/ddg-prisonrp-rules/backend
pm2 start server.js --name ddg-backend

# Start frontend
cd ~/ddg-prisonrp-rules/frontend
pm2 start npm --name ddg-frontend -- start

# Save PM2 configuration
pm2 save

# Enable auto-start on boot
pm2 startup
```

### **Quick Start Script**
```bash
# Create a start script
cd ~
cat > start-ddg.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting DDG PrisonRP Services..."
cd ~/ddg-prisonrp-rules/backend
pm2 start server.js --name ddg-backend
cd ~/ddg-prisonrp-rules/frontend
pm2 start npm --name ddg-frontend -- start
pm2 status
echo "✅ Services started!"
echo "Frontend: http://34.132.234.56:3000"
echo "Staff: http://34.132.234.56:3000/staff/staff-management-2024"
EOF

chmod +x start-ddg.sh
```

---

## ⏹️ **Stopping the Application**

### **Stop Both Services**
```bash
# Stop specific services
pm2 stop ddg-backend
pm2 stop ddg-frontend

# Or stop all PM2 processes
pm2 stop all

# Delete processes (if needed)
pm2 delete ddg-backend
pm2 delete ddg-frontend
```

### **Quick Stop Script**
```bash
# Create a stop script
cd ~
cat > stop-ddg.sh << 'EOF'
#!/bin/bash
echo "⏹️ Stopping DDG PrisonRP Services..."
pm2 stop ddg-backend ddg-frontend
pm2 status
echo "✅ Services stopped!"
EOF

chmod +x stop-ddg.sh
```

---

## 🔄 **Updating the Application**

### **Method 1: Git Pull (if git clone was used)**
```bash
cd ~/ddg-prisonrp-rules

# Stop services
pm2 stop ddg-backend ddg-frontend

# Update code
git pull origin main

# Update dependencies
cd backend && npm install
cd ../frontend && npm install

# Restart services
pm2 restart ddg-backend ddg-frontend
```

### **Method 2: Full Redownload**
```bash
# Stop services
pm2 stop ddg-backend ddg-frontend

# Backup current .env
cp ~/ddg-prisonrp-rules/backend/.env ~/env-backup.txt

# Remove old code
rm -rf ~/ddg-prisonrp-rules

# Redownload (use installation steps above)
# Then restore .env:
cp ~/env-backup.txt ~/ddg-prisonrp-rules/backend/.env

# Install dependencies and restart
cd ~/ddg-prisonrp-rules/backend && npm install
cd ~/ddg-prisonrp-rules/frontend && npm install
pm2 restart ddg-backend ddg-frontend
```

### **Update Script**
```bash
# Create an update script
cd ~
cat > update-ddg.sh << 'EOF'
#!/bin/bash
echo "🔄 Updating DDG PrisonRP..."

# Stop services
pm2 stop ddg-backend ddg-frontend

# Backup .env
cp ~/ddg-prisonrp-rules/backend/.env ~/env-backup.txt

# Update code
cd ~/ddg-prisonrp-rules
git pull origin main

# Update dependencies
echo "📦 Updating backend dependencies..."
cd backend && npm install

echo "📦 Updating frontend dependencies..."
cd ../frontend && npm install

# Restart services
echo "🚀 Restarting services..."
pm2 restart ddg-backend ddg-frontend

# Show status
pm2 status

echo "✅ Update complete!"
echo "Frontend: http://34.132.234.56:3000"
EOF

chmod +x update-ddg.sh
```

---

## 📊 **Monitoring & Management**

### **Check Service Status**
```bash
# View all PM2 processes
pm2 status

# View logs
pm2 logs ddg-backend
pm2 logs ddg-frontend
pm2 logs --lines 50  # Last 50 lines

# Monitor in real-time
pm2 monit
```

### **Resource Monitoring**
```bash
# Check system resources
htop  # Install with: sudo apt install htop

# Check disk space
df -h

# Check memory usage
free -h

# Check running processes
ps aux | grep node
```

### **Database Management**
```bash
# Backup database
cd ~/ddg-prisonrp-rules/backend
cp database/ddg_motd.db ~/ddg_motd_backup_$(date +%Y%m%d).db

# Check database size
ls -lh database/ddg_motd.db
```

---

## 🌐 **Firewall & Network**

### **Required Firewall Rules** (Already configured)
```bash
# Frontend access
gcloud compute firewall-rules create allow-ddg-frontend --allow tcp:3000

# Backend access  
gcloud compute firewall-rules create allow-ddg-backend --allow tcp:3001
```

### **Check Open Ports**
```bash
# Check if ports are listening
sudo netstat -tlnp | grep :3000
sudo netstat -tlnp | grep :3001

# Check firewall status
sudo ufw status
```

---

## 🔧 **Troubleshooting**

### **Common Issues**

#### **Services Won't Start**
```bash
# Check PM2 logs
pm2 logs ddg-backend
pm2 logs ddg-frontend

# Check if ports are in use
sudo lsof -i :3000
sudo lsof -i :3001

# Kill processes on ports if needed
sudo kill -9 $(sudo lsof -t -i:3000)
sudo kill -9 $(sudo lsof -t -i:3001)
```

#### **Database Issues**
```bash
# Reset database
cd ~/ddg-prisonrp-rules/backend
rm database/ddg_motd.db
node scripts/add-staff.js
```

#### **Permission Issues**
```bash
# Fix permissions
sudo chown -R $(whoami):$(whoami) ~/ddg-prisonrp-rules
chmod -R 755 ~/ddg-prisonrp-rules
```

#### **Memory Issues**
```bash
# Clear PM2 logs
pm2 flush

# Restart PM2
pm2 kill
pm2 resurrect
```

### **Fresh Start (Nuclear Option)**
```bash
# Stop everything
pm2 kill

# Remove application
rm -rf ~/ddg-prisonrp-rules

# Follow installation steps again
```

---

## 🔒 **Security Notes**

1. **Change default secrets** in .env file
2. **Regularly update** system packages: `sudo apt update && sudo apt upgrade`
3. **Monitor logs** for suspicious activity
4. **Backup database** regularly
5. **Consider setting up SSL** for production use

---

## 🆘 **Emergency Contacts**

- **Server IP**: 34.132.234.56
- **Google Cloud Console**: https://console.cloud.google.com/
- **Project ID**: ddgmotd
- **GitHub Repository**: https://github.com/MaxBossMan1/ddg-prisonrp-rules

---

## 📚 **Quick Command Reference**

```bash
# Connect to server
gcloud compute ssh ddg-development-server --zone=us-central1-a

# Start services
pm2 start ddg-backend ddg-frontend

# Stop services  
pm2 stop ddg-backend ddg-frontend

# Check status
pm2 status

# View logs
pm2 logs

# Update application
cd ~/ddg-prisonrp-rules && git pull && npm install

# Access URLs
# Frontend: http://34.132.234.56:3000
# Staff: http://34.132.234.56:3000/staff/staff-management-2024
```

---

**Last Updated**: May 30, 2025  
**Version**: 1.2.1 