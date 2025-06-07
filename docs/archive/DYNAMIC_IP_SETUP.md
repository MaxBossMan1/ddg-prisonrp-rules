# Dynamic IP Configuration Setup Guide

## 🎯 Problem Solved

This new setup eliminates the need to manually switch between `localhost` and server IP addresses. The system now automatically detects the environment and configures URLs accordingly.

## 🚀 Quick Setup

### For Local Development (Windows)
```powershell
.\scripts\setup-local.ps1
```

### For Cloud/Server Deployment (Windows) 
```powershell
.\scripts\setup-cloud.ps1
```

### For Linux/Mac
```bash
# Local development
./scripts/setup-local.sh

# Cloud/server deployment  
./scripts/setup-cloud.sh
```

## 🔧 How It Works

### Frontend Dynamic Detection
The frontend automatically detects:
- **Localhost**: Uses `http://localhost:3001` for API calls
- **Remote IP**: Uses `http://[detected-ip]:3001` for API calls
- **Production**: Uses relative URLs for same-domain deployment

### Backend Environment Variables
The backend uses environment variables:
- `FRONTEND_URL`: Frontend URL for CORS and redirects
- `BASE_URL`/`BACKEND_URL`: Backend URL for internal references
- `STEAM_REALM`/`STEAM_RETURN_URL`: Steam authentication URLs

## 📁 File Changes Made

### New Files
- `frontend/src/config/environment.js` - Dynamic environment detection
- `scripts/setup-local.sh|ps1` - Local development setup
- `scripts/setup-cloud.sh|ps1` - Cloud deployment setup

### Updated Files
- `frontend/src/services/api.js` - Dynamic API base URL
- `frontend/src/utils/apiConfig.js` - Dynamic configuration
- `frontend/src/setupProxy.js` - Dynamic proxy target
- `frontend/src/pages/RulePage.js` - Dynamic URLs
- `frontend/src/pages/StaffDashboard.js` - Dynamic URLs
- `backend/server.js` - Environment-based CORS and CSP
- `backend/routes/staff.js` - Environment-based URLs
- `backend/routes/discord.js` - Environment-based URLs

## 🎮 Usage Examples

### Scenario 1: Local Development
```bash
# Run setup once
.\scripts\setup-local.ps1

# Start backend
cd backend && npm start

# Start frontend (in new terminal)
cd frontend && npm start

# Access at: http://localhost:3000
```

### Scenario 2: Cloud Server
```bash
# Run setup once - automatically detects server IP
.\scripts\setup-cloud.ps1

# Example output:
# 🌐 Detected Server IP: 34.132.234.56
# ✅ Cloud/Server environment configured!
# 🔗 Frontend URL: http://34.132.234.56:3000
# 🔗 Backend URL: http://34.132.234.56:3001

# Start services
cd backend && npm start
cd frontend && npm start
```

### Scenario 3: Manual Override
If automatic detection fails, you can manually set the IP:

**Windows:**
```powershell
$ServerIP = "your.server.ip.here"
.\scripts\setup-cloud.ps1
```

**Linux/Mac:**
```bash
export SERVER_IP=your.server.ip.here
./scripts/setup-cloud.sh
```

## 🔍 Environment Detection Logic

The system uses this logic:

1. **Frontend Detection**:
   ```javascript
   const hostname = window.location.hostname;
   const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
   
   if (isLocalhost) {
     // Use localhost URLs
   } else {
     // Use current hostname with ports
   }
   ```

2. **Backend Configuration**:
   ```javascript
   const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
   const backendUrl = process.env.BASE_URL || 'http://localhost:3001';
   ```

## 🚨 Important Notes

### Steam Authentication
After running cloud setup, update your Steam API settings:
1. Go to https://steamcommunity.com/dev/apikey
2. Update "Domain Name" to your server IP (e.g., `34.132.234.56`)
3. The scripts automatically update the Steam URLs in your `.env`

### Security
- The scripts generate basic session secrets - **change these for production**
- Environment files (`.env`) are gitignored for security
- Always use HTTPS in production environments

### Troubleshooting

**Issue**: Frontend can't connect to backend
**Solution**: Check that both `.env` files have matching URLs

**Issue**: CORS errors
**Solution**: Ensure `FRONTEND_URL` in backend `.env` matches your actual frontend URL

**Issue**: Steam authentication fails
**Solution**: Verify Steam API key and that Steam domain settings match your server IP

## 🔄 Migration from Old Setup

If you have existing hardcoded IPs:

1. **Backup your current `.env` files**
2. **Run appropriate setup script**
3. **Copy over your Steam API key and session secrets**
4. **Test both localhost and server environments**

## 📈 Benefits

✅ **No more manual IP switching**
✅ **Automatic environment detection**  
✅ **Easy local ↔ cloud switching**
✅ **Cleaner, maintainable code**
✅ **Production-ready configuration**
✅ **Windows and Linux support** 