const express = require('express');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const ActivityLogger = require('../middleware/activityLogger');
const { getInstance: getDiscordBot } = require('../services/discordBot');
const router = express.Router();

const getDynamicUrls = () => {
  const serverIp = process.env.SERVER_IP || 'localhost';
  const isLocal = process.env.NODE_ENV === 'development' || process.env.LOCAL_DEV === 'true';
  
  if (isLocal) {
    return {
      callbackURL: 'http://localhost:3001/auth/discord/callback',
      frontendUrl: 'http://localhost:3000'
    };
  } else {
    return {
      callbackURL: `http://${serverIp}:3001/auth/discord/callback`,
      frontendUrl: `http://${serverIp}:3000`
    };
  }
};

console.log('🔧 Discord Auth Configuration:', {
  NODE_ENV: process.env.NODE_ENV,
  LOCAL_DEV: process.env.LOCAL_DEV,
  SERVER_IP: process.env.SERVER_IP,
  discordUrls: getDynamicUrls()
});

// Check if Discord credentials are configured
if (!process.env.DISCORD_CLIENT_ID || process.env.DISCORD_CLIENT_ID === 'your-discord-client-id-here') {
    console.error('🚨 DISCORD AUTHENTICATION ERROR: Discord Client ID not configured!');
    console.error('   Please set DISCORD_CLIENT_ID in your .env file');
    console.error('   Create a Discord application at: https://discord.com/developers/applications');
    console.error('   Copy backend/env.example to backend/.env and update the values');
}

if (!process.env.DISCORD_CLIENT_SECRET || process.env.DISCORD_CLIENT_SECRET === 'your-discord-client-secret-here') {
    console.error('🚨 DISCORD AUTHENTICATION ERROR: Discord Client Secret not configured!');
    console.error('   Please set DISCORD_CLIENT_SECRET in your .env file');
}

// Function to create Discord strategy with current dynamic URLs
const createDiscordStrategy = () => {
    const currentUrls = getDynamicUrls();
    console.log('🔧 Creating Discord Strategy with URLs:', currentUrls);
    
    return new DiscordStrategy({
        clientID: process.env.DISCORD_CLIENT_ID || 'your-discord-client-id-here',
        clientSecret: process.env.DISCORD_CLIENT_SECRET || 'your-discord-client-secret-here',
        callbackURL: currentUrls.callbackURL,
        scope: ['identify', 'guilds.members.read']
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            console.log('🔍 Discord Authentication Debug:');
            console.log('  - Profile ID:', profile.id);
            console.log('  - Username:', profile.username);
            console.log('  - Discriminator:', profile.discriminator);
            console.log('  - Avatar:', profile.avatar);
            
            const discordId = profile.id;
            const discordUsername = profile.username;
            const discriminator = profile.discriminator;
            const avatar = profile.avatar;
            
            // Get database instance
            let db = require('../database/init').getInstance();
            
            // If singleton not available, try to get from global app as fallback
            if (!db && global.app && global.app.locals && global.app.locals.db) {
                db = global.app.locals.db;
                console.log('  - Using global app.locals.db fallback');
            }
            
            console.log('  - Database instance:', db ? 'Found' : 'NULL');
            if (!db) {
                console.error('  ❌ Database instance is null! Check server initialization.');
                return done(new Error('Database not available'));
            }
            
            // Check if user exists in staff_users table using Discord ID
            console.log('  - Searching for user in database with Discord ID...');
            let user = await db.get('SELECT * FROM staff_users WHERE discord_id = ? AND is_active = 1', [discordId]);
            
            console.log('  - Database lookup result:', user);
            
            if (user) {
                console.log('  ✅ Existing user found! Updating info and checking roles...');
                
                // Update user info
                await db.run(`
                    UPDATE staff_users 
                    SET discord_username = ?, discord_discriminator = ?, discord_avatar = ?, last_login = CURRENT_TIMESTAMP
                    WHERE id = ?
                `, [discordUsername, discriminator, avatar, user.id]);
                
                // Get Discord bot instance and sync roles
                const discordBot = getDiscordBot();
                let permissionLevel = user.permission_level;
                
                if (discordBot && discordBot.isReady()) {
                    console.log('  - Syncing user roles with Discord bot...');
                    const newPermissionLevel = await discordBot.determinePermissionLevel(discordId);
                    
                    if (newPermissionLevel && newPermissionLevel !== user.permission_level) {
                        console.log(`  - Permission level changed from ${user.permission_level} to ${newPermissionLevel}`);
                        permissionLevel = newPermissionLevel;
                        
                        // Update permission level in database
                        await db.run(`
                            UPDATE staff_users 
                            SET permission_level = ?
                            WHERE id = ?
                        `, [permissionLevel, user.id]);
                        
                        // Send notification about permission change
                        await discordBot.sendAuthNotification(discordId, 'Permission Level Changed', true, {
                            permissionLevel: permissionLevel,
                            previousLevel: user.permission_level
                        });
                    }
                    
                    // Sync roles in background
                    discordBot.syncUserRoles(discordId).catch(console.error);
                } else {
                    console.warn('  ⚠️ Discord bot not available for role sync');
                }
                
                return done(null, {
                    id: user.id,
                    discordId: user.discord_id,
                    username: discordUsername,
                    discriminator: discriminator,
                    avatar: avatar,
                    permissionLevel: permissionLevel,
                    profile: profile
                });
            } else {
                console.log('  🔍 User not found with Discord ID, checking for new user authorization...');
                
                // Check if this Discord user should have access based on their roles
                const discordBot = getDiscordBot();
                let permissionLevel = null;
                
                if (discordBot && discordBot.isReady()) {
                    console.log('  - Checking Discord roles for new user...');
                    permissionLevel = await discordBot.determinePermissionLevel(discordId);
                }
                
                if (permissionLevel) {
                    console.log('  ✅ New user authorized! Creating account with permission level:', permissionLevel);
                    
                    // Create new user account
                    const result = await db.run(`
                        INSERT INTO staff_users 
                        (discord_id, discord_username, discord_discriminator, discord_avatar, permission_level, is_active, created_at, last_login)
                        VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    `, [discordId, discordUsername, discriminator, avatar, permissionLevel]);
                    
                    const newUser = await db.get('SELECT * FROM staff_users WHERE id = ?', [result.lastID]);
                    
                    // Send notification about new user
                    if (discordBot && discordBot.isReady()) {
                        await discordBot.sendAuthNotification(discordId, 'New User Created', true, {
                            permissionLevel: permissionLevel
                        });
                        
                        // Sync roles in background
                        discordBot.syncUserRoles(discordId).catch(console.error);
                    }
                    
                    return done(null, {
                        id: newUser.id,
                        discordId: newUser.discord_id,
                        username: discordUsername,
                        discriminator: discriminator,
                        avatar: avatar,
                        permissionLevel: permissionLevel,
                        profile: profile
                    });
                } else {
                    console.log('  ❌ User not authorized! No matching Discord roles found.');
                    
                    // Log the failed authorization attempt
                    if (discordBot && discordBot.isReady()) {
                        await discordBot.logAuthEvent(discordId, 'login', false, {
                            reason: 'No matching staff roles found'
                        });
                        
                        await discordBot.sendAuthNotification(discordId, 'Access Denied', false, {
                            reason: 'No matching staff roles'
                        });
                    }
                    
                    return done(null, false, { 
                        message: 'Access denied. You need appropriate Discord roles to access the staff panel. Contact an administrator if you believe this is an error.' 
                    });
                }
            }
        } catch (error) {
            console.error('❌ Discord authentication error:', error);
            return done(error);
        }
    });
};

// Initialize with current strategy
console.log('🔧 Initializing Discord Strategy at startup with URLs:', getDynamicUrls());
passport.use('discord', createDiscordStrategy());

// Passport serialization
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        let db = require('../database/init').getInstance();
        
        // If singleton not available, try to get from global app as fallback
        if (!db && global.app && global.app.locals && global.app.locals.db) {
            db = global.app.locals.db;
        }
        
        if (!db) {
            return done(new Error('Database not available'));
        }
        
        const user = await db.get(
            'SELECT * FROM staff_users WHERE id = ? AND is_active = 1',
            [id]
        );
        
        if (user) {
            done(null, {
                id: user.id,
                discordId: user.discord_id,
                username: user.discord_username,
                discriminator: user.discord_discriminator,
                avatar: user.discord_avatar,
                permissionLevel: user.permission_level
            });
        } else {
            done(null, false);
        }
    } catch (error) {
        done(error);
    }
});

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    
    // Return HTML with Discord login for browser requests
    if (req.accepts('html')) {
        return res.status(401).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Staff Authentication Required</title>
                <style>
                    body { 
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
                        color: white;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                        margin: 0;
                    }
                    .auth-container {
                        background: rgba(255, 255, 255, 0.1);
                        padding: 2rem;
                        border-radius: 10px;
                        text-align: center;
                        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                        backdrop-filter: blur(10px);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                    }
                    .discord-btn {
                        background: #5865F2;
                        color: white;
                        padding: 12px 24px;
                        text-decoration: none;
                        border-radius: 5px;
                        font-weight: bold;
                        display: inline-block;
                        margin-top: 1rem;
                        transition: background 0.3s;
                    }
                    .discord-btn:hover { 
                        background: #4752C4; 
                    }
                    h1 { margin-top: 0; }
                </style>
            </head>
            <body>
                <div class="auth-container">
                    <h1>🔐 Staff Authentication Required</h1>
                    <p>Please authenticate with Discord to access the staff management panel.</p>
                    <p><small>You must have appropriate Discord server roles to access this area.</small></p>
                    <a href="/auth/discord" class="discord-btn">Login with Discord</a>
                </div>
            </body>
            </html>
        `);
    }
    
    // Return JSON for API requests
    res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please authenticate with Discord to access this resource',
        loginUrl: '/auth/discord'
    });
};

// Permission level hierarchy
const PERMISSION_LEVELS = {
    'owner': 4,
    'admin': 3, 
    'moderator': 2,
    'editor': 1
};

const requirePermission = (minLevel) => {
    return async (req, res, next) => {
        if (!req.isAuthenticated()) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const userLevel = PERMISSION_LEVELS[req.user.permissionLevel] || 0;
        const requiredLevel = PERMISSION_LEVELS[minLevel] || 0;

        if (userLevel >= requiredLevel) {
            return next();
        }

        // Log unauthorized access attempt
        const discordBot = getDiscordBot();
        if (discordBot && discordBot.isReady()) {
            await discordBot.logAuthEvent(req.user.discordId, 'unauthorized_access', false, {
                requiredLevel: minLevel,
                userLevel: req.user.permissionLevel,
                attemptedResource: req.path
            });
        }

        return res.status(403).json({ 
            error: 'Insufficient permissions',
            required: minLevel,
            current: req.user.permissionLevel
        });
    };
};

const canManageUser = (managerPermission, targetPermission) => {
    const managerLevel = PERMISSION_LEVELS[managerPermission] || 0;
    const targetLevel = PERMISSION_LEVELS[targetPermission] || 0;
    return managerLevel > targetLevel;
};

const getValidPermissionLevels = (userPermission) => {
    const userLevel = PERMISSION_LEVELS[userPermission] || 0;
    return Object.keys(PERMISSION_LEVELS).filter(level => 
        PERMISSION_LEVELS[level] < userLevel
    );
};

// Routes
router.get('/discord', passport.authenticate('discord', { 
    scope: ['identify', 'guilds.members.read']
}));

router.get('/discord/callback', 
    passport.authenticate('discord', { failureRedirect: '/auth/failure' }),
    (req, res) => {
        console.log('✅ Discord authentication successful for user:', req.user.username);
        
        // Log successful login
        const discordBot = getDiscordBot();
        if (discordBot && discordBot.isReady()) {
            discordBot.logAuthEvent(req.user.discordId, 'login', true, {
                permissionLevel: req.user.permissionLevel
            }).catch(console.error);
            
            discordBot.sendAuthNotification(req.user.discordId, 'Login', true, {
                permissionLevel: req.user.permissionLevel
            }).catch(console.error);
        }
        
        // Redirect to staff dashboard
        const secretUrl = process.env.STAFF_SECRET_URL || 'staff-dashboard-2025';
        const frontendUrl = getDynamicUrls().frontendUrl;
        res.redirect(`${frontendUrl}/staff/${secretUrl}/dashboard`);
    }
);

router.get('/failure', (req, res) => {
    res.status(401).send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Authentication Failed</title>
            <style>
                body { 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
                    color: white;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    margin: 0;
                }
                .error-container {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 2rem;
                    border-radius: 10px;
                    text-align: center;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }
                .retry-btn {
                    background: #3498db;
                    color: white;
                    padding: 12px 24px;
                    text-decoration: none;
                    border-radius: 5px;
                    font-weight: bold;
                    display: inline-block;
                    margin-top: 1rem;
                    transition: background 0.3s;
                }
                .retry-btn:hover { 
                    background: #2980b9; 
                }
                h1 { margin-top: 0; }
            </style>
        </head>
        <body>
            <div class="error-container">
                <h1>❌ Authentication Failed</h1>
                <p>Access denied. You need appropriate Discord server roles to access the staff panel.</p>
                <p><small>Contact an administrator if you believe this is an error.</small></p>
                <a href="/auth/discord" class="retry-btn">Try Again</a>
            </div>
        </body>
        </html>
    `);
});

router.post('/logout', (req, res) => {
    const discordId = req.user ? req.user.discordId : 'unknown';
    
    req.logout((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({ error: 'Logout failed' });
        }
        
        // Log logout
        const discordBot = getDiscordBot();
        if (discordBot && discordBot.isReady() && discordId !== 'unknown') {
            discordBot.logAuthEvent(discordId, 'logout', true).catch(console.error);
        }
        
        res.json({ message: 'Logged out successfully' });
    });
});

router.get('/status', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({
            authenticated: true,
            user: {
                id: req.user.id,
                username: req.user.username,
                discriminator: req.user.discriminator,
                avatar: req.user.avatar,
                permissionLevel: req.user.permissionLevel
            }
        });
    } else {
        res.json({ authenticated: false });
    }
});

// Export auth utilities
module.exports = {
    router,
    requireAuth,
    requirePermission,
    canManageUser,
    getValidPermissionLevels,
    PERMISSION_LEVELS
}; 