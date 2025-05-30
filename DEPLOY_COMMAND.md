# 🚀 One-Command Deployment

## **Copy and paste this command on your server:**

```bash
cd ~/ddg-prisonrp-rules && git pull origin main && chmod +x deploy-fix.sh && ./deploy-fix.sh
```

## **What this does:**
1. ✅ Pulls the latest fixes from GitHub
2. ✅ Makes the deployment script executable  
3. ✅ Runs the automated deployment script

## **Expected output:**
- Updates frontend to use cloud server IP instead of localhost
- Configures backend .env with correct URLs
- Restarts services with PM2
- Shows you the access URLs

## **After deployment:**
- **Main Site**: http://34.132.234.56:3000
- **Staff Dashboard**: http://34.132.234.56:3000/staff/staff-dashboard-2025

**The staff dashboard connection issues should be completely fixed!** 🎉 