# 🎮 DDG Discord Setup Complete!

Your DigitalDeltaGaming Discord authentication system has been successfully configured with your server details.

## ✅ What's Been Set Up

### Discord Bot Configuration
- **Server ID**: 929440166991527946
- **Bot Token**: Configured ✅
- **Hardcoded Owners**: 2 users configured ✅

### Role Mappings
- **Administrator** (1241190526296920065) → Admin permissions
- **Moderator** (929440167012491334) → Moderator permissions  
- **Editor** (929440166991527955) → Editor permissions

### Hardcoded Owners
- **Owner 1**: 616691120407052291
- **Owner 2**: 303675233359888384

## 🚀 Next Steps to Complete Setup

### 1. Create Discord Application (If Not Done)
1. Go to https://discord.com/developers/applications
2. Create a new application called "DDG PrisonRP Rules"
3. Go to OAuth2 section and copy:
   - **Client ID**
   - **Client Secret**

### 2. Update Environment Variables
Edit your `backend/.env` file and add:
```env
DISCORD_CLIENT_ID=your-actual-client-id-here
DISCORD_CLIENT_SECRET=your-actual-client-secret-here
```

### 3. Configure OAuth2 Redirect URLs
In your Discord application OAuth2 settings, add these redirect URLs:
```
http://localhost:3001/auth/discord/callback
https://your-domain.com/auth/discord/callback
```

### 4. Bot Permissions
Your bot needs these permissions in your Discord server:
- Read Messages
- View Channels
- Read Message History

## 🧪 Testing Your Setup

### Test Commands
```bash
# Test role mappings
node scripts/manage-discord-roles.js list

# Test specific user permissions
node scripts/manage-discord-roles.js test 616691120407052291
node scripts/manage-discord-roles.js test 303675233359888384

# Start the server
npm run dev
```

### Test Login
1. Start your server: `npm run dev`
2. Go to: http://localhost:3000/staff/staff-dashboard-2025/dashboard
3. Click "Login with Discord"
4. You should be redirected to Discord OAuth
5. After authorization, you'll be logged in with appropriate permissions

## 🔧 Permission System

### How It Works
1. **Hardcoded Owners**: Always get owner permissions regardless of Discord roles
2. **Role-Based**: Users get permissions based on their Discord server roles
3. **Real-Time**: Permissions update when Discord roles change
4. **Logging**: All authentication events are logged for security

### Permission Levels
- **Owner**: Full access to everything (hardcoded users)
- **Admin**: Can manage rules, users, and announcements  
- **Moderator**: Can edit rules and manage content
- **Editor**: Can edit rules and basic content

## 🛠️ Management Commands

```bash
# List all role mappings
node scripts/manage-discord-roles.js list

# Add a new role mapping
node scripts/manage-discord-roles.js add ROLE_ID ROLE_NAME PERMISSION_LEVEL

# Remove a role mapping  
node scripts/manage-discord-roles.js remove ROLE_ID

# Test user permissions
node scripts/manage-discord-roles.js test DISCORD_USER_ID

# Sync all users' roles
node scripts/manage-discord-roles.js sync-all
```

## 🚨 Important Security Notes

1. **Never share your bot token** - It's already configured in your .env
2. **Keep your client secret secure** - Don't commit it to git
3. **Use HTTPS in production** - Update redirect URLs when deploying
4. **Monitor auth logs** - Check database for suspicious activity

## 🎯 Ready to Go!

Your system is now configured for Discord authentication! Just add your Discord app credentials to the .env file and you're ready to test.

Need help? Check the migration guide: `DISCORD_MIGRATION_GUIDE.md` 