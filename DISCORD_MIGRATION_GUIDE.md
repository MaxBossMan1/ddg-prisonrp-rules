# Discord Authentication Migration Guide

## 🎯 Overview

The system has been updated to use Discord OAuth instead of Steam authentication, with role-based permissions controlled by a Discord bot.

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Discord App
1. Go to https://discord.com/developers/applications
2. Create new application
3. Add OAuth2 redirect: `http://YOUR_IP:3001/auth/discord/callback`
4. Create bot in same application
5. Enable "Server Members Intent"

### 3. Update Environment
```env
DISCORD_CLIENT_ID=your-client-id
DISCORD_CLIENT_SECRET=your-client-secret
DISCORD_BOT_TOKEN=your-bot-token
DISCORD_GUILD_ID=your-server-id
```

### 4. Set Up Role Mappings
```bash
node scripts/manage-discord-roles.js add "ROLE_ID" "Role Name" permission_level
```

Permission levels: `owner`, `admin`, `moderator`, `editor`

### 5. Test System
```bash
npm run dev
# Visit: http://localhost:3000/staff/staff-dashboard-2025/dashboard
```

## ✅ Migration Complete!

Users now log in with Discord accounts and permissions are automatically determined by their Discord server roles. 