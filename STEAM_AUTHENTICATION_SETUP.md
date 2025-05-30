# Steam Authentication Setup Guide

## 🔐 Overview

The DigitalDeltaGaming PrisonRP Rules System now includes a complete Steam authentication system for staff management. This allows authorized staff members to log in with their Steam accounts and manage content through a secure dashboard.

## 🚀 Quick Start

### 1. Get a Steam API Key

1. Go to [Steam Web API Key Registration](https://steamcommunity.com/dev/apikey)
2. Log in with your Steam account
3. Enter your domain name (for development: `localhost`)
4. Copy the generated API key

### 2. Configure Environment Variables

Create or update `backend/.env` with the following:

```env
# Server Configuration
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# Database Configuration
DATABASE_PATH=./database/ddg_prisonrp.db

# Session Configuration
SESSION_SECRET=your-super-secret-session-key-change-this-in-production

# Steam Authentication Configuration
STEAM_API_KEY=your-steam-api-key-here
STEAM_REALM=http://localhost:3001
STEAM_RETURN_URL=http://localhost:3001/auth/steam/return

# Staff Management
STAFF_SECRET_URL=staff-management-2024

# File Upload Configuration
MAX_FILE_SIZE=10mb
UPLOAD_DIR=./uploads
```

### 3. Add Staff Users

Use the included script to add staff members:

```bash
# Add an admin user
cd backend
node scripts/add-staff.js 76561198123456789 "John Admin" admin

# Add a moderator
node scripts/add-staff.js 76561198987654321 "Jane Moderator" moderator

# Add an editor
node scripts/add-staff.js 76561198555666777 "Bob Editor" editor

# List all staff users
node scripts/add-staff.js list
```

### 4. Start the Server

```bash
cd backend
npm start
```

## 🔑 Staff Access

### Accessing the Staff Panel

**Secret URL**: `http://localhost:3001/staff/staff-management-2024`

> **Security Note**: The staff panel is only accessible through this secret URL. There are no login buttons or links on the public site.

### Authentication Flow

1. **Visit Secret URL** → Staff login page appears
2. **Click "Login with Steam"** → Redirected to Steam OpenID
3. **Authorize Application** → Steam redirects back to your site
4. **Access Granted** → If Steam ID is in staff database, access dashboard
5. **Access Denied** → If not authorized, show error page

## 👥 Permission Levels

### Admin
- Full system access
- User management (add/remove staff)
- All content editing
- System configuration

### Moderator  
- Content editing (rules, announcements, media)
- Cannot manage users
- Cannot access admin settings

### Editor
- Limited content editing
- Can edit existing rules
- Cannot create/delete rules or manage announcements

## 🛠️ API Endpoints

### Authentication Endpoints
```
GET  /auth/steam          - Initiate Steam login
GET  /auth/steam/return   - Steam callback
POST /auth/logout         - Logout current user
GET  /auth/check          - Check authentication status
GET  /auth/user           - Get current user info
```

### Staff Management Endpoints
```
GET  /api/staff/dashboard      - Dashboard data
GET  /api/staff/users          - List staff users (admin only)
POST /api/staff/users          - Add staff user (admin only)
PUT  /api/staff/users/:id      - Update staff user (admin only)
DELETE /api/staff/users/:id    - Deactivate staff user (admin only)
```

### Content Management Endpoints
```
GET  /api/staff/announcements     - List all announcements
POST /api/staff/announcements     - Create announcement (moderator+)
PUT  /api/staff/announcements/:id - Update announcement (moderator+)
DELETE /api/staff/announcements/:id - Delete announcement (moderator+)

GET  /api/staff/rules             - List all rules (editor+)
POST /api/staff/rules             - Create rule (editor+)
```

## 🔧 How to Find Steam IDs

### Method 1: Steam Profile URL
1. Go to Steam profile
2. Look at URL: `https://steamcommunity.com/profiles/76561198123456789`
3. The number at the end is the Steam ID

### Method 2: Steam ID Finder
1. Visit [steamid.io](https://steamid.io)
2. Enter Steam profile URL or custom URL
3. Copy the "steamID64" value

### Method 3: Steam Console
1. Open Steam
2. Go to View → Settings → Interface
3. Enable "Display Steam URL address bar when available"
4. Visit your profile, copy ID from URL

## 🗃️ Database Schema

The system uses these tables for authentication:

### staff_users
```sql
- id: Primary key
- steam_id: Unique Steam ID (76561198...)
- steam_username: Display name from Steam
- permission_level: 'admin', 'moderator', or 'editor'
- is_active: Whether user can log in
- created_at: When user was added
- last_login: Last successful login
```

### sessions
```sql
- id: Primary key
- user_id: Reference to staff_users
- session_token: Secure session identifier
- expires_at: Session expiration time
- created_at: Session creation time
```

## 🚨 Security Features

### Authentication Security
- Steam OpenID verification
- Secure session management
- Session expiration (24 hours)
- CSRF protection via session tokens

### Authorization Security  
- Permission-based access control
- Secret URL (no public login links)
- Steam ID whitelist (only authorized users)
- Automatic session cleanup

### API Security
- All staff endpoints require authentication
- Permission level validation
- Input sanitization and validation
- SQL injection protection

## 🐛 Troubleshooting

### "Access Denied" Error
- Check if user's Steam ID is in the staff database
- Verify Steam ID format (should be 17 digits starting with 765611)
- Ensure user account is active (`is_active = 1`)

### Steam Login Not Working
- Verify `STEAM_API_KEY` is set correctly
- Check `STEAM_REALM` and `STEAM_RETURN_URL` match your domain
- Ensure Steam Web API key domain matches your server domain

### Session Issues
- Check `SESSION_SECRET` is set
- Verify session middleware is properly configured
- Clear browser cookies if having persistent issues

## 📝 Next Steps

### Immediate
1. **Get Steam API Key** and update `.env`
2. **Add your Steam ID** as an admin user
3. **Test authentication** by visiting the staff panel
4. **Add other staff members** using the script

### Future Enhancements
- React-based staff dashboard
- Rich text editor for content creation
- Media upload interface
- User activity logging
- Email notifications for important changes

## 🔐 Production Deployment

### Environment Variables for Production
```env
NODE_ENV=production
STEAM_REALM=https://yourdomain.com
STEAM_RETURN_URL=https://yourdomain.com/auth/steam/return
SESSION_SECRET=a-very-long-random-string-for-production
STAFF_SECRET_URL=your-custom-secret-url-here
```

### Security Checklist
- [ ] Change default session secret
- [ ] Use HTTPS in production
- [ ] Update Steam API key domain
- [ ] Set secure session cookies
- [ ] Remove demo staff accounts
- [ ] Configure proper CORS origins
- [ ] Set up SSL certificates

---

**Staff Panel URL**: `http://localhost:3001/staff/staff-management-2024`

**Need Help?** Check the troubleshooting section or contact the development team. 