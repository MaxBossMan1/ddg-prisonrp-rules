# 🚀 Quick Fix Guide - Staff Dashboard Connection Issues

## 🔍 **Problem Diagnosed**
The staff dashboard is trying to connect to `localhost:3001` instead of your cloud server `34.132.234.56:3001`.

> **Note:** For local development, replace `34.132.234.56` with `localhost` in all URLs and configuration steps.

## ✅ **Solution Applied**
I've updated the frontend code to point to the correct server IP. Now you need to deploy these changes to your cloud server.

---

## 🛠️ **Option 1: Upload Fixed Files (Recommended)**

### **Step 1: Upload the Fixed Repository**
```bash
# On your cloud server, backup current version
cd ~
mv ddg-prisonrp-rules ddg-prisonrp-rules-backup

# Download the fixed version
git clone https://github.com/MaxBossMan1/ddg-prisonrp-rules.git
cd ddg-prisonrp-rules
```

### **Step 2: Run the Auto-Configuration Script**
```bash
# Make script executable and run it
chmod +x update-cloud-config.sh
./update-cloud-config.sh
```

This script will:
- ✅ Configure backend `.env` with correct cloud server URLs
- ✅ Install/update dependencies
- ✅ Stop and restart services with PM2
- ✅ Show you the access URLs

---

## 🛠️ **Option 2: Manual Fix (If Option 1 doesn't work)**

### **Step 1: Connect to Your Server**
```bash
# If you have gcloud CLI installed:
gcloud compute ssh ddg-development-server --zone=us-central1-a

# Or use SSH directly:
ssh -i ~/.ssh/google_compute_engine max@34.132.234.56
```

### **Step 2: Update Backend Configuration**
```bash
cd ~/ddg-prisonrp-rules/backend

# Create proper .env file
cat > .env << 'EOF'
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://34.132.234.56:3000

DATABASE_PATH=./database/ddg_prisonrp.db
SESSION_SECRET=ddg-super-secure-session-secret-2024-cloud

STEAM_API_KEY=your-steam-api-key-here
STEAM_REALM=http://34.132.234.56:3001
STEAM_RETURN_URL=http://34.132.234.56:3001/auth/steam/return

STAFF_SECRET_URL=staff-dashboard-2025
MAX_FILE_SIZE=10mb
UPLOAD_DIR=./uploads
EOF
```

### **Step 3: Restart Services**
```bash
# Stop current services
pm2 stop ddg-backend ddg-frontend

# Update dependencies
cd ~/ddg-prisonrp-rules/backend && npm install
cd ~/ddg-prisonrp-rules/frontend && npm install

# Start services
cd ~/ddg-prisonrp-rules/backend
pm2 start server.js --name ddg-backend

cd ~/ddg-prisonrp-rules/frontend  
pm2 start npm --name ddg-frontend -- start

# Save PM2 configuration
pm2 save
```

---

## 🎯 **After Fix - Access URLs**

Once the fix is applied, you should be able to access:

- **🌐 Main Site**: http://34.132.234.56:3000
- **👥 Staff Dashboard**: http://34.132.234.56:3000/staff/staff-dashboard-2025
- **🔧 Backend Health**: http://34.132.234.56:3001/health

---

## ⚠️ **Important Notes**

1. **Steam API Key**: You'll need to add your Steam API key to the `.env` file
2. **Staff Access**: Add your Steam ID as admin:
   ```bash
   cd ~/ddg-prisonrp-rules/backend
   node scripts/add-staff.js YOUR_STEAM_ID "Your Name" admin
   ```

3. **Firewall**: Make sure ports 3000 and 3001 are open (they should be already)

---

## 🔧 **Troubleshooting**

### **If services won't start:**
```bash
# Check what's running on the ports
sudo lsof -i :3000
sudo lsof -i :3001

# Kill any conflicting processes
sudo kill -9 $(sudo lsof -t -i:3000)
sudo kill -9 $(sudo lsof -t -i:3001)

# Try starting again
pm2 restart ddg-backend ddg-frontend
```

### **Check service status:**
```bash
pm2 status
pm2 logs ddg-backend
pm2 logs ddg-frontend
```

---

## 📞 **Need Help?**

If you encounter any issues:
1. Check the PM2 logs: `pm2 logs`
2. Verify the backend is responding: `curl http://34.132.234.56:3001/health`
3. Make sure your Steam API key is correctly set in the `.env` file

---

**The fix is ready! Choose Option 1 for the easiest solution.** 🚀 