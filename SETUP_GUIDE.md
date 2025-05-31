# 🚀 Quick Setup Guide - DigitalDeltaGaming PrisonRP Rules System

## ⚠️ **Fix Steam API Error (Error 403)**

If you're seeing the error `Error: 403 Error: Check your API key is correct`, follow these steps:

### **Step 1: Create .env File**

```bash
cd backend
cp env.example .env
```

### **Step 2: Get Steam API Key**

1. Visit [Steam Web API Key Registration](https://steamcommunity.com/dev/apikey)
2. Log in with your Steam account
3. Enter domain name: **34.132.234.56** (for production) or **localhost** (for development)
4. Copy the generated API key

### **Step 3: Configure .env File**

Open `backend/.env` and update these values:

```env
# Steam Authentication Configuration
STEAM_API_KEY=YOUR_ACTUAL_STEAM_API_KEY_HERE
STEAM_REALM=http://34.132.234.56:3001
STEAM_RETURN_URL=http://34.132.234.56:3001/auth/steam/return

# Session Configuration
SESSION_SECRET=change-this-to-a-long-random-string

# Staff Management
STAFF_SECRET_URL=your-custom-secret-url
```

### **Step 4: Add Your Steam ID as Admin**

```bash
cd backend
node scripts/add-staff.js YOUR_STEAM_ID "Your Name" admin
```

**How to find your Steam ID:**
- Visit your Steam profile
- Look at URL: `https://steamcommunity.com/profiles/76561198123456789`
- The number at the end is your Steam ID

### **Step 5: Restart Server**

```bash
npm start
```

## 🔐 **Access Staff Panel**

After setup, visit: `http://34.132.234.56:3001/staff/your-custom-secret-url`

---

## 🛠️ **Complete Installation Guide**

### **Prerequisites**
- Node.js 16+ installed
- Git installed

### **1. Clone & Install**

```bash
git clone <repository-url>
cd DDGMOTD
cd backend && npm install
cd ../frontend && npm install
```

### **2. Backend Setup**

```bash
cd backend
cp env.example .env
# Edit .env file with your Steam API key
npm start
```

### **3. Frontend Setup**

```bash
cd frontend
npm start
```

### **4. Database Setup**

The database is automatically created when you first start the backend server.

Default demo accounts are created:
- **Steam ID**: `76561198000000000` (Demo Admin)
- **Steam ID**: `76561198000000001` (Demo Moderator)

Replace these with real Steam IDs using the script:

```bash
cd backend
node scripts/add-staff.js YOUR_STEAM_ID "Your Name" admin
```

---

## 📋 **Environment Variables Reference**

### **Required Variables**

| Variable | Description | Example |
|----------|-------------|---------|
| `STEAM_API_KEY` | Steam Web API key | `ABC123DEF456...` |
| `SESSION_SECRET` | Session encryption key | `long-random-string` |
| `STAFF_SECRET_URL` | Secret staff panel URL | `my-secret-admin-2024` |

### **Optional Variables**

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment | `development` |
| `DATABASE_PATH` | Database file path | `./database/ddg_prisonrp.db` |

---

## 🚨 **Common Issues & Solutions**

### **Issue: Steam API Error 403**
**Solution**: Configure `STEAM_API_KEY` in `.env` file

### **Issue: "Access Denied" in Staff Panel**
**Solution**: Add your Steam ID to staff database using the script

### **Issue: Server won't start**
**Solution**: Check if all required environment variables are set

### **Issue: Database errors**
**Solution**: Delete `backend/database/ddg_prisonrp.db` and restart server

---

## 📞 **Support**

- Check `STEAM_AUTHENTICATION_SETUP.md` for detailed auth guide
- Run `node scripts/add-staff.js list` to see current staff users
- Check server logs for detailed error messages

---

## ✅ **Quick Verification**

After setup, you should be able to:

1. ✅ Visit `http://34.132.234.56:3001/health` (shows server status)
2. ✅ Visit `http://34.132.234.56:3000` (main site)
3. ✅ Visit `http://34.132.234.56:3001/staff/your-secret-url` (staff login)

> **Note:** For local development, replace `34.132.234.56` with `localhost` in all URLs and environment variables.
4. ✅ Login with Steam and access dashboard 