# DDG PrisonRP Rules - Google Cloud Deployment Guide

## 📊 **Server Information**

### **Google Cloud Project Details**
- **Project ID**: `ddgmotd`
- **Project Name**: DDG MOTD
- **Billing**: Enabled
- **Region**: `us-central1-a`

### **VM Instance Details**
- **Instance Name**: `ddg-development-server`
- **Machine Type**: `e2-medium` (2 vCPUs, 4 GB memory)
- **Operating System**: Ubuntu 22.04 LTS
- **External IP**: `34.132.234.56`
- **Internal IP**: `10.128.0.2`
- **Zone**: `us-central1-a`
- **Username**: `maxime`

### **Firewall Configuration**
- **Port 3000**: Frontend (React app)
- **Port 3001**: Backend (Node.js API)
- **Port 22**: SSH access
- **Port 80/443**: HTTP/HTTPS (future use)

---

## 🔗 **Application URLs**

- **Frontend**: http://34.132.234.56:3000
- **Backend API**: http://34.132.234.56:3001
- **Staff Dashboard**: http://34.132.234.56:3000/staff/staff-management-2025
- **API Health Check**: http://34.132.234.56:3001/health
- **API Categories**: http://34.132.234.56:3001/api/categories

---

## 🔧 **Connection Methods**

### **Method 1: Google Cloud CLI (Recommended)**
```bash
# Install Google Cloud CLI (Windows)
winget install Google.CloudSDK

# Connect to server
gcloud compute ssh ddg-development-server --zone=us-central1-a

# Alternative with full path (if PATH issues)
& "C:\Users\Maxime\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" compute ssh ddg-development-server --zone=us-central1-a
```

### **Method 2: Direct SSH**
```bash
# Standard SSH connection
ssh maxime@34.132.234.56

# With key file (if using custom SSH keys)
ssh -i /path/to/private-key maxime@34.132.234.56
```

### **Method 3: Google Cloud Console**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to Compute Engine > VM instances
3. Click "SSH" button next to `ddg-development-server`

---

## 📁 **Server File Structure**

```
/home/maxime/
├── ddg-prisonrp-rules/           # Main application directory
│   ├── frontend/                 # React frontend
│   │   ├── src/
│   │   ├── public/
│   │   └── package.json
│   ├── backend/                  # Node.js backend
│   │   ├── .env                  # Environment configuration
│   │   ├── server.js             # Main server file
│   │   ├── database/             # SQLite database
│   │   ├── routes/               # API routes
│   │   └── uploads/              # File uploads
│   ├── DEPLOYMENT_GUIDE.md       # Deployment instructions
│   └── GOOGLE_CLOUD_DEPLOYMENT.md # This file
```

---

## ⚙️ **Service Management (PM2)**

### **Check Service Status**
```bash
pm2 status
pm2 list
```

### **Start Services**
```bash
# Start backend
cd ~/ddg-prisonrp-rules/backend
pm2 start server.js --name ddg-backend

# Start frontend
cd ~/ddg-prisonrp-rules/frontend
pm2 start "npm start" --name ddg-frontend
```

### **Restart Services**
```bash
pm2 restart ddg-backend
pm2 restart ddg-frontend
pm2 restart all
```

### **Stop Services**
```bash
pm2 stop ddg-backend
pm2 stop ddg-frontend
pm2 stop all
```

### **View Logs**
```bash
pm2 logs ddg-backend --lines 20
pm2 logs ddg-frontend --lines 20
pm2 logs all --lines 10
```

### **Monitor Services**
```bash
pm2 monit
```

### **Save PM2 Configuration**
```bash
pm2 save
pm2 startup
```

---

## 🔄 **Deployment & Updates**

### **Update from GitHub**
```bash
# Connect to server
gcloud compute ssh ddg-development-server --zone=us-central1-a

# Navigate to project directory
cd ~/ddg-prisonrp-rules

# Pull latest changes
git pull origin main

# Restart services
pm2 restart ddg-backend
pm2 restart ddg-frontend
```

### **Full Redownload (if git issues)**
```bash
# Backup current directory
mv ~/ddg-prisonrp-rules ~/ddg-prisonrp-rules-backup-$(date +%Y%m%d-%H%M%S)

# Clone fresh copy
git clone https://github.com/MaxBossMan1/ddg-prisonrp-rules.git

# Setup backend
cd ~/ddg-prisonrp-rules/backend
npm install
cp env.example .env
# Edit .env file with correct values

# Setup frontend
cd ~/ddg-prisonrp-rules/frontend
npm install

# Restart services
pm2 restart all
```

---

## 🔧 **Environment Configuration**

### **Backend Environment File** (`backend/.env`)
```bash
# DigitalDeltaGaming PrisonRP Rules System - Google Cloud Configuration
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://34.132.234.56:3000

# Database Configuration
DATABASE_PATH=./database/ddg_prisonrp.db

# Session Configuration
SESSION_SECRET=ddg-prisonrp-production-secret-key-change-this

# Steam Authentication Configuration
STEAM_API_KEY=YOUR_STEAM_API_KEY_HERE
STEAM_REALM=http://34.132.234.56:3001
STEAM_RETURN_URL=http://34.132.234.56:3001/auth/steam/return

# Staff Management
STAFF_SECRET_URL=staff-management-2024

# File Upload Configuration
MAX_FILE_SIZE=10mb
UPLOAD_DIR=./uploads
```

### **Creating/Updating .env file**
```bash
cd ~/ddg-prisonrp-rules/backend
cp env.example .env

# Update values (use nano, vim, or sed)
nano .env

# Or update specific values with sed
sed -i 's|FRONTEND_URL=http://localhost:3000|FRONTEND_URL=http://34.132.234.56:3000|g' .env
sed -i 's|STEAM_REALM=http://localhost:3001|STEAM_REALM=http://34.132.234.56:3001|g' .env
sed -i 's|STEAM_RETURN_URL=http://localhost:3001|STEAM_RETURN_URL=http://34.132.234.56:3001|g' .env
```

---

## 🗄️ **Database Information**

### **Database Details**
- **Type**: SQLite
- **Location**: `~/ddg-prisonrp-rules/backend/database/ddg_prisonrp.db`
- **Backup Location**: `~/ddg-prisonrp-rules/backend/database/backups/`

### **Database Management**
```bash
# Access SQLite database
cd ~/ddg-prisonrp-rules/backend
sqlite3 database/ddg_prisonrp.db

# Common commands in SQLite
.tables              # List all tables
.schema categories   # Show table structure
SELECT * FROM categories; # View data
.quit               # Exit SQLite
```

### **Database Categories**
1. **A - General Server Rules**
2. **B - PrisonRP Specific Rules**
3. **C - Guard Guidelines**
4. **D - Prisoner Guidelines**
5. **E - Warden Protocols**
6. **F - Economy & Contraband Rules**
7. **G - Staff Information**

---

## 🔒 **Security & Access**

### **Steam API Configuration**
To enable staff authentication:
1. Get Steam API key from: https://steamcommunity.com/dev/apikey
2. Update `STEAM_API_KEY` in `backend/.env`
3. Restart backend: `pm2 restart ddg-backend`

### **Staff Access Levels**
- **Level 1**: Editor - Can edit rules
- **Level 2**: Moderator - Can manage rules and categories
- **Level 3**: Admin - Full access except user management
- **Level 4**: Owner - Complete system access

### **Staff Management URL**
- Access: http://34.132.234.56:3000/staff/staff-management-2024
- Can be changed via `STAFF_SECRET_URL` environment variable

---

## 🔍 **Troubleshooting**

### **Common Issues & Solutions**

#### **Services Not Starting**
```bash
# Check PM2 status
pm2 status

# Check logs for errors
pm2 logs ddg-backend --lines 50
pm2 logs ddg-frontend --lines 50

# Restart services
pm2 restart all
```

#### **CORS Errors**
- Ensure `FRONTEND_URL` in backend/.env is set to: `http://34.132.234.56:3000`
- Check that both services are running on correct ports
- Restart backend after .env changes

#### **Database Errors**
```bash
# Check database file exists
ls -la ~/ddg-prisonrp-rules/backend/database/

# Check database permissions
chmod 644 ~/ddg-prisonrp-rules/backend/database/ddg_prisonrp.db

# Restart backend
pm2 restart ddg-backend
```

#### **Port Issues**
```bash
# Check what's running on ports
sudo netstat -tlnp | grep :3000
sudo netstat -tlnp | grep :3001

# Kill processes if needed
sudo kill -9 <PID>
```

### **Firewall Issues**
```bash
# Check firewall rules
sudo ufw status

# Allow ports if needed
sudo ufw allow 3000
sudo ufw allow 3001
```

---

## 📊 **Monitoring & Maintenance**

### **System Resources**
```bash
# Check disk usage
df -h

# Check memory usage
free -h

# Check CPU usage
top
htop
```

### **Application Health**
```bash
# Test API endpoints
curl http://localhost:3001/health
curl http://localhost:3001/api/categories

# Test external access
curl http://34.132.234.56:3001/health
```

### **Log Management**
```bash
# PM2 logs
pm2 logs --lines 100
pm2 flush  # Clear logs

# System logs
sudo journalctl -u ssh
sudo tail -f /var/log/syslog
```

---

## 🚀 **Quick Commands Reference**

### **Connection**
```bash
gcloud compute ssh ddg-development-server --zone=us-central1-a
```

### **Update & Restart**
```bash
cd ~/ddg-prisonrp-rules && git pull origin main && pm2 restart all
```

### **Status Check**
```bash
pm2 status && curl -s http://localhost:3001/health | jq
```

### **View Logs**
```bash
pm2 logs all --lines 20
```

### **Emergency Stop/Start**
```bash
pm2 stop all && pm2 start all
```

---

## 📞 **Support Information**

### **Key File Locations**
- **Main Config**: `~/ddg-prisonrp-rules/backend/.env`
- **Database**: `~/ddg-prisonrp-rules/backend/database/ddg_prisonrp.db`
- **Logs**: `~/.pm2/logs/`
- **Uploads**: `~/ddg-prisonrp-rules/backend/uploads/`

### **GitHub Repository**
- **URL**: https://github.com/MaxBossMan1/ddg-prisonrp-rules.git
- **Main Branch**: `main`

### **Contact & Access**
- **Server User**: `maxime`
- **Project Owner**: MaxBossMan1
- **Google Cloud Project**: `ddgmotd`

---

*Last Updated: December 2024*
*Server Status: ✅ Operational* 