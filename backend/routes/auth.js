const express = require('express');
const passport = require('passport');
const SteamStrategy = require('passport-steam').Strategy;
const ActivityLogger = require('../middleware/activityLogger');
const router = express.Router();

// Check if Steam API key is configured
if (!process.env.STEAM_API_KEY || process.env.STEAM_API_KEY === 'your-steam-api-key-here') {
    console.error('🚨 STEAM AUTHENTICATION ERROR: Steam API key not configured!');
    console.error('   Please set STEAM_API_KEY in your .env file');
    console.error('   Get your key from: https://steamcommunity.com/dev/apikey');
    console.error('   Copy backend/env.example to backend/.env and update the values');
}

// Initialize Passport Steam Strategy
passport.use(new SteamStrategy({
    returnURL: process.env.STEAM_RETURN_URL || 'http://localhost:3001/auth/steam/return',
    realm: process.env.STEAM_REALM || 'http://localhost:3001',
    apiKey: process.env.STEAM_API_KEY || 'your-steam-api-key-here'
}, async (identifier, profile, done) => {
    try {
        const steamId = identifier.split('/').pop();
        
        // Check if user exists in staff_users table
        const db = require('../database/init').getInstance();
        const user = await db.get(
            'SELECT * FROM staff_users WHERE steam_id = ? AND is_active = 1',
            [steamId]
        );
        
        if (user) {
            // Update last login
            await db.run(
                'UPDATE staff_users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
                [user.id]
            );
            
            // Update username if it changed
            if (user.steam_username !== profile.displayName) {
                await db.run(
                    'UPDATE staff_users SET steam_username = ? WHERE id = ?',
                    [profile.displayName, user.id]
                );
            }
            
            return done(null, {
                id: user.id,
                steamId: user.steam_id,
                username: profile.displayName,
                permissionLevel: user.permission_level,
                profile: profile
            });
        } else {
            // User not authorized
            return done(null, false, { message: 'Access denied. Contact administrator.' });
        }
    } catch (error) {
        console.error('Steam authentication error:', error);
        return done(error);
    }
}));

// Passport serialization
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const db = require('../database/init').getInstance();
        const user = await db.get(
            'SELECT * FROM staff_users WHERE id = ? AND is_active = 1',
            [id]
        );
        
        if (user) {
            done(null, {
                id: user.id,
                steamId: user.steam_id,
                username: user.steam_username,
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
router.get('/steam', (req, res, next) => {
    // Check if Steam API key is configured before attempting authentication
    if (!process.env.STEAM_API_KEY || process.env.STEAM_API_KEY === 'your-steam-api-key-here') {
        return res.status(500).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Steam Authentication Error</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        background: #1a1d23; 
                        color: #ecf0f1; 
                        text-align: center; 
                        padding: 50px; 
                    }
                    .error-container {
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 40px;
                        background: #e74c3c;
                        border-radius: 8px;
                    }
                    .code-block {
                        background: #2c3e50;
                        padding: 15px;
                        border-radius: 4px;
                        margin: 20px 0;
                        text-align: left;
                        font-family: monospace;
                    }
                </style>
            </head>
            <body>
                <div class="error-container">
                    <h1>🚨 Steam Authentication Not Configured</h1>
                    <p>The Steam API key is missing or not properly configured.</p>
                    <h3>To fix this:</h3>
                    <div class="code-block">
                        1. Get Steam API key: https://steamcommunity.com/dev/apikey<br>
                        2. Copy backend/env.example to backend/.env<br>
                        3. Update STEAM_API_KEY in .env file<br>
                        4. Restart the server
                    </div>
                    <p>Contact your system administrator for help.</p>
                </div>
            </body>
            </html>
        `);
    }
    
    passport.authenticate('steam')(req, res, next);
});

router.get('/steam/return', 
    passport.authenticate('steam', { failureRedirect: '/staff/login-failed' }),
    async (req, res) => {
        try {
            // Log successful login
            await ActivityLogger.logLogin(req.user.id, req, true);
            
            const staffSecretUrl = process.env.STAFF_SECRET_URL || 'staff-management-2024';
            res.redirect(`/staff/${staffSecretUrl}/dashboard`);
        } catch (error) {
            console.error('Login logging error:', error);
            // Don't fail the login because of logging issues
            const staffSecretUrl = process.env.STAFF_SECRET_URL || 'staff-management-2024';
            res.redirect(`/staff/${staffSecretUrl}/dashboard`);
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
        steamId: req.user.steamId,
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
                steamId: req.user.steamId,
                username: req.user.username,
                permissionLevel: req.user.permissionLevel
            }
        });
    } else {
        res.json({ authenticated: false });
    }
});

module.exports = { router, requireAuth, requirePermission, canManageUser, getValidPermissionLevels }; 