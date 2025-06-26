const express = require('express');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const ActivityLogger = require('../middleware/activityLogger');
const router = express.Router();

const getDynamicUrls = () => {
  const isLocal = process.env.NODE_ENV === 'development' || process.env.LOCAL_DEV === 'true';
  
  if (isLocal) {
    return {
      returnURL: 'http://localhost:3001/auth/discord/callback',
      realm: 'http://localhost:3001',
      frontendUrl: 'http://localhost:3000'
    };
  } else {
    // Use environment variables or default to VM IP
    const serverIp = process.env.SERVER_IP || '34.41.22.155';
    return {
      returnURL: process.env.DISCORD_CALLBACK_URL || `http://${serverIp}:3001/auth/discord/callback`,
      realm: process.env.DISCORD_REALM || `http://${serverIp}:3001`,
      frontendUrl: process.env.FRONTEND_URL || `http://${serverIp}:3000`
    };
  }
};

console.log('🔧 Discord Auth Configuration:', {
  NODE_ENV: process.env.NODE_ENV,
  LOCAL_DEV: process.env.LOCAL_DEV,
  SERVER_IP: process.env.SERVER_IP,
  discordUrls: getDynamicUrls()
});

// Discord OAuth Strategy
const createDiscordStrategy = () => {
    const currentUrls = getDynamicUrls();
    console.log('🔧 Creating Discord Strategy with URLs:', currentUrls);
    
    // Use hardcoded Discord credentials provided by user
    const DISCORD_CLIENT_ID = '1386748138164851000';
    const DISCORD_CLIENT_SECRET = 'F8JDiZzPcxp2qp7nd1pvwSWj6Kr_SaX1';
    
    console.log('🔧 Discord Client ID (first 8 chars):', DISCORD_CLIENT_ID.substring(0, 8));
    
    return new DiscordStrategy({
        clientID: DISCORD_CLIENT_ID,
        clientSecret: DISCORD_CLIENT_SECRET,
        callbackURL: currentUrls.returnURL,
        scope: ['identify', 'guilds.members.read']
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            console.log('🔍 Discord Authentication Debug:');
            console.log('  - Profile:', JSON.stringify(profile, null, 2));
            
            const discordId = profile.id;
            const username = profile.username;
            const discriminator = profile.discriminator;
            const fullUsername = discriminator !== '0' ? `${username}#${discriminator}` : username;
            
            console.log('  - Discord ID:', discordId);
            console.log('  - Username:', fullUsername);
            
            // Get database instance
            let db = require('../database/init').getInstance();
            
            if (!db && global.app && global.app.locals && global.app.locals.db) {
                db = global.app.locals.db;
                console.log('  - Using global app.locals.db fallback');
            }
            
            console.log('  - Database instance:', db ? 'Found' : 'NULL');
            if (!db) {
                console.error('  ❌ Database instance is null! Check server initialization.');
                return done(new Error('Database not available'));
            }
            
            // Check if user exists in staff_users table by Discord ID
            const query = 'SELECT * FROM staff_users WHERE discord_id = ? AND is_active = 1';
            const params = [discordId];
            console.log('  - Query:', query);
            console.log('  - Params:', params);
            
            let user;
            try {
                console.log('  - Executing database query...');
                user = await db.get(query, params);
                console.log('  - Query executed successfully');
                console.log('  - Database lookup result:', user);
            } catch (queryError) {
                console.error('  - Database query error:', queryError);
                return done(queryError);
            }
            
            if (user) {
                console.log('  ✅ User found! Logging in...');
                // Update last login
                await db.run(
                    'UPDATE staff_users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
                    [user.id]
                );
                
                // Update Discord username if it changed
                if (user.discord_username !== fullUsername) {
                    console.log('  - Updating username from', user.discord_username, 'to', fullUsername);
                    await db.run(
                        'UPDATE staff_users SET discord_username = ? WHERE id = ?',
                        [fullUsername, user.id]
                    );
                }
                
                return done(null, {
                    id: user.id,
                    discordId: user.discord_id,
                    username: fullUsername,
                    permissionLevel: user.permission_level,
                    profile: profile
                });
            } else {
                console.log('  ❌ User not found in database!');
                console.log('  - Looking for Discord ID:', discordId);
                console.log('  - In database with is_active = 1');
                
                // Let's also check without the is_active filter to see if user exists but is inactive
                const inactiveUser = await db.get('SELECT * FROM staff_users WHERE discord_id = ?', [discordId]);
                console.log('  - User without is_active filter:', inactiveUser);
                
                // User not authorized
                return done(null, false, { message: 'Access denied. Contact administrator.' });
            }
        } catch (error) {
            console.error('❌ Discord authentication error:', error);
            return done(error);
        }
    });
};

// Initialize Discord strategy
console.log('🔧 Initializing Discord Strategy at startup with URLs:', getDynamicUrls());
passport.use('discord', createDiscordStrategy());

// Passport serialization
passport.serializeUser((user, done) => {
    console.log('🔧 Serializing user:', user.id);
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        console.log('🔧 Deserializing user ID:', id);
        let db = require('../database/init').getInstance();
        
        // If singleton not available, try to get from global app as fallback
        if (!db && global.app && global.app.locals && global.app.locals.db) {
            db = global.app.locals.db;
        }
        
        if (!db) {
            console.log('❌ Database not available during deserialization');
            return done(new Error('Database not available'));
        }
        
        const user = await db.get(
            'SELECT * FROM staff_users WHERE id = ? AND is_active = 1',
            [id]
        );
        
        if (user) {
            console.log('✅ User deserialized successfully:', user.discord_username);
            done(null, {
                id: user.id,
                discordId: user.discord_id,
                username: user.discord_username,
                permissionLevel: user.permission_level
            });
        } else {
            console.log('❌ User not found during deserialization:', id);
            done(null, false);
        }
    } catch (error) {
        console.log('❌ Error during deserialization:', error);
        done(error);
    }
});

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ error: 'Authentication required' });
};

const requirePermission = (minLevel) => {
    const levels = { 'editor': 1, 'moderator': 2, 'admin': 3, 'owner': 4 };
    
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        const userLevel = levels[req.user.permissionLevel] || 0;
        const requiredLevel = levels[minLevel] || 0;
        
        if (userLevel >= requiredLevel) {
            return next();
        }
        
        res.status(403).json({ error: 'Insufficient permissions' });
    };
};

// Helper function to check if user can manage another user
const canManageUser = (managerPermission, targetPermission) => {
    const levels = { 'editor': 1, 'moderator': 2, 'admin': 3, 'owner': 4 };
    const managerLevel = levels[managerPermission] || 0;
    const targetLevel = levels[targetPermission] || 0;
    
    // Owner can manage everyone
    if (managerPermission === 'owner') {
        return true;
    }
    
    // Admin can manage moderators and editors, but not admins or owners
    if (managerPermission === 'admin') {
        return targetPermission === 'moderator' || targetPermission === 'editor';
    }
    
    // Moderators and editors cannot manage users
    return false;
};

// Helper function to get valid permission levels for a user
const getValidPermissionLevels = (userPermission) => {
    if (userPermission === 'owner') {
        return ['editor', 'moderator', 'admin', 'owner'];
    }
    
    if (userPermission === 'admin') {
        return ['editor', 'moderator'];
    }
    
    // Moderators and editors cannot manage users
    return [];
};

// Routes
router.get('/discord', (req, res, next) => {
    console.log('🔧 Discord authentication requested with current URLs:', getDynamicUrls());
    passport.authenticate('discord')(req, res, next);
});

router.get('/discord/callback',
    (req, res, next) => {
        console.log('🔍 Discord Callback URL accessed');
        console.log('  - Query params:', req.query);
        console.log('  - Body:', req.body);
        console.log('  - Session ID:', req.sessionID);
        console.log('  - Session:', req.session);
        next();
    },
    passport.authenticate('discord', {
        failureRedirect: `${getDynamicUrls().frontendUrl}/staff/login-failed`,
        failureFlash: false
    }),
    async (req, res) => {
        try {
            console.log('✅ Discord authentication successful!');
            console.log('  - User:', req.user);
            console.log('  - Session after auth:', req.session);
            console.log('  - Is authenticated:', req.isAuthenticated());
            
            // Log successful login
            await ActivityLogger.logLogin(req.user.id, req, true);
            
            const staffSecretUrl = process.env.STAFF_SECRET_URL || 'staff-dashboard-2025';
            const redirectUrl = `${getDynamicUrls().frontendUrl}/staff/${staffSecretUrl}`;
            console.log('  - Redirecting to:', redirectUrl);
            res.redirect(redirectUrl);
        } catch (error) {
            console.error('❌ Login logging error:', error);
            const staffSecretUrl = process.env.STAFF_SECRET_URL || 'staff-dashboard-2025';
            const redirectUrl = `${getDynamicUrls().frontendUrl}/staff/${staffSecretUrl}`;
            console.log('  - Redirecting to (error case):', redirectUrl);
            res.redirect(redirectUrl);
        }
    }
);

router.post('/logout', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        
        req.logout((err) => {
            if (err) {
                console.error('Logout error:', err);
                return res.status(500).json({ error: 'Logout failed' });
            }
            
            // Log logout (do this after logout to avoid issues)
            ActivityLogger.logLogout(userId, req).catch(console.error);
            
            res.json({ message: 'Logged out successfully' });
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Logout failed' });
    }
});

router.get('/user', requireAuth, (req, res) => {
    res.json({
        id: req.user.id,
        discordId: req.user.discordId,
        username: req.user.username,
        permissionLevel: req.user.permissionLevel
    });
});

router.get('/check', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({
            authenticated: true,
            user: {
                id: req.user.id,
                discordId: req.user.discordId,
                username: req.user.username,
                permissionLevel: req.user.permissionLevel
            }
        });
    } else {
        res.json({ authenticated: false });
    }
});

module.exports = { router, requireAuth, requirePermission, canManageUser, getValidPermissionLevels }; 