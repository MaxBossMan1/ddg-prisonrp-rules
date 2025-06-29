const express = require('express');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const ActivityLogger = require('../middleware/activityLogger');
const { getInstance: getDiscordBot } = require('../services/discordBot');
const router = express.Router();

const getDynamicUrls = () => {
  const isLocal = process.env.NODE_ENV === 'development' || process.env.LOCAL_DEV === 'true';
  
  if (isLocal) {
    return {
      callbackURL: 'http://localhost:3001/auth/discord/callback',
      frontendUrl: 'http://localhost:3000'
    };
  } else {
    // In production, SERVER_IP must be explicitly set
    const serverIp = process.env.SERVER_IP;
    if (!serverIp) {
      throw new Error('SERVER_IP environment variable is required in production for Discord OAuth callbacks. Please set it to your server\'s public IP address or domain name.');
    }
    
    return {
      callbackURL: `http://${serverIp}:3001/auth/discord/callback`,
      frontendUrl: `http://${serverIp}:3000`
    };
  }
};

try {
  console.log('🔧 Discord Auth Configuration:', {
    NODE_ENV: process.env.NODE_ENV,
    LOCAL_DEV: process.env.LOCAL_DEV,
    SERVER_IP: process.env.SERVER_IP,
    discordUrls: getDynamicUrls()
  });
} catch (error) {
  console.error('🚨 DISCORD AUTHENTICATION CONFIGURATION ERROR:', error.message);
  console.error('   This will prevent Discord OAuth from working properly in production.');
  console.error('   Please set the SERVER_IP environment variable to your server\'s public IP or domain.');
}

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
    let currentUrls;
    try {
        currentUrls = getDynamicUrls();
        console.log('🔧 Creating Discord Strategy with URLs:', currentUrls);
    } catch (error) {
        console.error('🚨 DISCORD STRATEGY CREATION ERROR:', error.message);
        console.error('   Using fallback configuration. Discord authentication may not work properly.');
        
        // Provide fallback URLs to prevent complete failure
        currentUrls = {
            callbackURL: 'http://localhost:3001/auth/discord/callback', // fallback to localhost
            frontendUrl: 'http://localhost:3000'
        };
    }
    
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
                
                // ALWAYS check Discord roles first (even if user has 'none' in database)
                console.log(`  🔍 Checking Discord roles for existing user (current db level: ${user.permission_level})...`);
                
                if (discordBot && discordBot.isReady()) {
                    console.log('  - Syncing user roles with Discord bot...');
                    const newPermissionLevel = await discordBot.determinePermissionLevel(discordId);
                    
                    if (newPermissionLevel && newPermissionLevel !== user.permission_level) {
                        console.log(`  ✅ Permission level changed from ${user.permission_level} to ${newPermissionLevel}`);
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
                    } else if (newPermissionLevel && newPermissionLevel === user.permission_level) {
                        // Permissions are the same, just continue with existing level
                        console.log(`  ✅ Permission level confirmed: ${user.permission_level}`);
                        permissionLevel = user.permission_level;
                    } else if (!newPermissionLevel) {
                        // User has no Discord permissions
                        console.log(`  🚨 User ${discordUsername} has no Discord staff roles - denying login`);
                        
                        // Update database to reflect no permissions
                        await db.run(`
                            UPDATE staff_users 
                            SET permission_level = 'none'
                            WHERE id = ?
                        `, [user.id]);
                        
                        await discordBot.logAuthEvent(discordId, 'login', false, {
                            reason: 'No Discord staff roles found',
                            previousLevel: user.permission_level
                        });
                        
                        await discordBot.sendAuthNotification(discordId, 'Access Denied - No Staff Roles', false, {
                            reason: 'No Discord staff roles found'
                        });
                        
                        return done(null, false, { 
                            message: 'Access denied. You need appropriate Discord roles to access the staff panel. Contact an administrator if you believe this is an error.' 
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
                    
                    // Get the newly created user - use discord_id as fallback if lastID fails
                    let newUser = null;
                    if (result.lastID) {
                        newUser = await db.get('SELECT * FROM staff_users WHERE id = ?', [result.lastID]);
                    }
                    
                    // Fallback: if lastID didn't work, find by discord_id
                    if (!newUser) {
                        newUser = await db.get('SELECT * FROM staff_users WHERE discord_id = ? ORDER BY created_at DESC LIMIT 1', [discordId]);
                    }
                    
                    if (!newUser) {
                        throw new Error('Failed to create user account in database');
                    }
                    
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
            
            // Handle rate limiting specifically
            if (error.code === 'invalid_request' && error.message?.includes('rate limited')) {
                console.log('🚨 Discord OAuth rate limited - implementing backoff...');
                return done(null, false, { 
                    message: 'Discord authentication is temporarily rate limited. Please wait a moment and try again.' 
                });
            }
            
            return done(error);
        }
    });
};

// Initialize with current strategy
try {
    console.log('🔧 Initializing Discord Strategy at startup with URLs:', getDynamicUrls());
} catch (error) {
    console.error('🚨 DISCORD STRATEGY INITIALIZATION WARNING:', error.message);
    console.error('   Discord authentication may not work properly in production.');
}

try {
    passport.use('discord', createDiscordStrategy());
    console.log('✅ Discord Strategy initialized successfully');
} catch (error) {
    console.error('🚨 FAILED TO INITIALIZE DISCORD STRATEGY:', error.message);
    console.error('   Discord authentication will not be available.');
    console.error('   Please check your Discord configuration and SERVER_IP settings.');
}

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

        // Periodic role revalidation (every 30 seconds for security)
        const REVALIDATION_INTERVAL = 30 * 1000; // 30 seconds in milliseconds
        const lastRevalidation = req.session.lastRoleCheck || 0;
        const now = Date.now();
        
        // Always check permissions for write operations (POST, PUT, DELETE)
        const isWriteOperation = ['POST', 'PUT', 'DELETE'].includes(req.method);
        const shouldRevalidate = (now - lastRevalidation > REVALIDATION_INTERVAL) || isWriteOperation;
        
        if (shouldRevalidate) {
            console.log(`🔄 Revalidating Discord roles for user ${req.user.username} (last check: ${Math.floor((now - lastRevalidation) / 60000)} minutes ago)`);
            
            try {
                const discordBot = getDiscordBot();
                if (discordBot && discordBot.isReady()) {
                    const currentPermissionLevel = await discordBot.determinePermissionLevel(req.user.discordId);
                    
                    if (!currentPermissionLevel) {
                        // User has lost all permissions - force logout
                        console.log(`🚨 User ${req.user.username} has lost Discord permissions - forcing logout`);
                        
                        await discordBot.logAuthEvent(req.user.discordId, 'permission_revoked', true, {
                            previousLevel: req.user.permissionLevel,
                            reason: 'Discord roles removed'
                        });
                        
                        req.logout((err) => {
                            if (err) console.error('Logout error during permission revocation:', err);
                        });
                        
                        return res.status(401).json({ 
                            error: 'Permissions revoked',
                            message: 'Your Discord roles have been removed. Please log in again.',
                            forceLogout: true
                        });
                    }
                    
                    if (currentPermissionLevel !== req.user.permissionLevel) {
                        // Store previous level before updating for accurate logging
                        const previousLevel = req.user.permissionLevel;
                        
                        // Permission level changed - update session and database
                        console.log(`🔄 User ${req.user.username} permission changed: ${previousLevel} → ${currentPermissionLevel}`);
                        
                        const db = require('../database/init').getInstance();
                        await db.run(`
                            UPDATE staff_users 
                            SET permission_level = ?, updated_at = CURRENT_TIMESTAMP
                            WHERE id = ?
                        `, [currentPermissionLevel, req.user.id]);
                        
                        // Update current request's user object (database update ensures future requests get correct level)
                        req.user.permissionLevel = currentPermissionLevel;
                        
                        await discordBot.logAuthEvent(req.user.discordId, 'permission_updated', true, {
                            previousLevel: previousLevel,
                            newLevel: currentPermissionLevel,
                            reason: 'Discord roles changed'
                        });
                    }
                }
                
                // Update last revalidation timestamp
                req.session.lastRoleCheck = now;
                
            } catch (error) {
                console.error('🚨 Error during role revalidation:', error);
                // Continue with current permissions if revalidation fails
            }
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
        let frontendUrl;
        try {
            frontendUrl = getDynamicUrls().frontendUrl;
        } catch (error) {
            console.error('🚨 Error getting frontend URL for redirect:', error.message);
            // Fallback to localhost if URL generation fails
            frontendUrl = 'http://localhost:3000';
        }
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

// Manual permission refresh endpoint
router.post('/refresh-permissions', requireAuth, async (req, res) => {
    try {
        console.log(`🔄 Manual permission refresh requested by user ${req.user.username}`);
        
        const discordBot = getDiscordBot();
        if (!discordBot || !discordBot.isReady()) {
            return res.status(503).json({ 
                error: 'Discord bot not available',
                message: 'Cannot verify permissions at this time'
            });
        }

        const currentPermissionLevel = await discordBot.determinePermissionLevel(req.user.discordId);
        
        if (!currentPermissionLevel) {
            // User has lost all permissions - force logout
            console.log(`🚨 User ${req.user.username} has lost Discord permissions during manual refresh`);
            
            await discordBot.logAuthEvent(req.user.discordId, 'permission_revoked', true, {
                previousLevel: req.user.permissionLevel,
                reason: 'Manual refresh - Discord roles removed'
            });
            
            req.logout((err) => {
                if (err) console.error('Logout error during manual permission refresh:', err);
            });
            
            return res.status(401).json({ 
                error: 'Permissions revoked',
                message: 'Your Discord roles have been removed. You have been logged out.',
                forceLogout: true
            });
        }
        
        const previousLevel = req.user.permissionLevel;
        
        if (currentPermissionLevel !== previousLevel) {
            // Permission level changed - update session and database
            console.log(`🔄 User ${req.user.username} permission changed during manual refresh: ${previousLevel} → ${currentPermissionLevel}`);
            
            const db = require('../database/init').getInstance();
            await db.run(`
                UPDATE staff_users 
                SET permission_level = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [currentPermissionLevel, req.user.id]);
            
            // Update current request's user object (database update ensures future requests get correct level)
            req.user.permissionLevel = currentPermissionLevel;
            
            await discordBot.logAuthEvent(req.user.discordId, 'permission_updated', true, {
                previousLevel: previousLevel,
                newLevel: currentPermissionLevel,
                reason: 'Manual refresh - Discord roles changed'
            });
        }
        
        // Update last revalidation timestamp
        req.session.lastRoleCheck = Date.now();
        
        res.json({
            success: true,
            message: 'Permissions refreshed successfully',
            permissionLevel: currentPermissionLevel,
            changed: currentPermissionLevel !== previousLevel,
            previousLevel: previousLevel
        });
        
    } catch (error) {
        console.error('🚨 Error during manual permission refresh:', error);
        res.status(500).json({ 
            error: 'Permission refresh failed',
            message: 'An error occurred while checking your permissions'
        });
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