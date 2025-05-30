const express = require('express');
const { requireAuth, requirePermission, canManageUser, getValidPermissionLevels } = require('./auth');
const ActivityLogger = require('../middleware/activityLogger');
const router = express.Router();

// Helper function to automatically send Discord notifications for rules
async function sendRuleToDiscord(ruleId, action = 'update') {
    try {
        const db = require('../database/init').getInstance();
        
        // Get Discord settings
        const settings = await db.get('SELECT * FROM discord_settings WHERE id = 1');
        if (!settings || !settings.rules_enabled || !settings.rules_webhook_url) {
            console.log('Discord rules notifications disabled or not configured');
            return;
        }

        // Get rule with category information
        const rule = await db.get(`
            SELECT r.*, c.name as category_name, c.letter_code as category_letter_code,
                   rc.full_code, su.steam_username as created_by_username
            FROM rules r
            LEFT JOIN categories c ON r.category_id = c.id
            LEFT JOIN rule_codes rc ON r.id = rc.rule_id
            LEFT JOIN staff_users su ON r.submitted_by = su.id
            WHERE r.id = ?
        `, [ruleId]);

        if (!rule) {
            console.log('Rule not found for Discord notification:', ruleId);
            return;
        }

        // Only send for approved/active rules
        if (rule.status !== 'approved' || !rule.is_active) {
            console.log('Rule not approved/active, skipping Discord notification:', rule.status, rule.is_active);
            return;
        }

        // Create the Discord embed
        const axios = require('axios');
        
        // Action-specific colors and icons
        const actionConfig = {
            create: {
                color: 0x27ae60, // Green
                icon: '📝',
                title: 'New Rule Created'
            },
            update: {
                color: 0xf39c12, // Orange
                icon: '✏️',
                title: 'Rule Updated'
            },
            delete: {
                color: 0xe74c3c, // Red
                icon: '🗑️',
                title: 'Rule Deleted'
            }
        };

        const config = actionConfig[action] || actionConfig.update;
        
        // Create rule URL - parse full_code into proper URL format
        let ruleUrl;
        if (rule.full_code) {
            // Parse rule code like "C.7" or "C.7.1" into proper URL format
            const parts = rule.full_code.split('.');
            if (parts.length >= 2) {
                const category = parts[0]; // "C"
                const ruleNumber = parts[1]; // "7"
                if (parts.length >= 3) {
                    // Sub-rule like "C.7.1" -> /rules/C/7/1
                    const subRuleNumber = parts[2]; // "1"
                    ruleUrl = `http://localhost:3000/rules/${category}/${ruleNumber}/${subRuleNumber}`;
                } else {
                    // Main rule like "C.7" -> /rules/C/7
                    ruleUrl = `http://localhost:3000/rules/${category}/${ruleNumber}`;
                }
            } else {
                // Fallback if format is unexpected
                ruleUrl = `http://localhost:3000/rules/${rule.full_code}`;
            }
        } else {
            // Fallback to rule ID if no full_code
            ruleUrl = `http://localhost:3000/rules/id-${rule.id}`;
        }
        
        const embed = {
            title: `${config.icon} ${config.title}: ${rule.full_code || `Rule #${rule.id}`}`,
            description: rule.title ? `**${rule.title}**\n\n${rule.content.substring(0, 200)}...` : rule.content.substring(0, 300) + '...',
            color: config.color,
            url: ruleUrl, // Direct link to the rule page
            fields: [
                {
                    name: '📋 Category',
                    value: `${rule.category_letter_code} - ${rule.category_name}`,
                    inline: true
                },
                {
                    name: '👤 Author',
                    value: rule.created_by_username || 'Unknown',
                    inline: true
                },
                {
                    name: '📅 Date',
                    value: new Date().toLocaleDateString(),
                    inline: true
                },
                {
                    name: '🔗 View Rule',
                    value: `[Click here to view ${rule.full_code || `Rule #${rule.id}`}](${ruleUrl})`,
                    inline: false
                }
            ],
            footer: {
                text: 'DDG PrisonRP Rules System'
            },
            timestamp: new Date().toISOString()
        };

        const webhookPayload = {
            embeds: [embed]
        };

        // Send to Discord
        const response = await axios.post(settings.rules_webhook_url, webhookPayload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
        });

        if (response.status >= 200 && response.status < 300) {
            // Log successful Discord message
            await db.run(`
                INSERT INTO discord_messages (
                    message_type, rule_id, webhook_url, delivery_status, 
                    sent_by, action_type, discord_message_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
                'rule',
                ruleId,
                settings.rules_webhook_url.substring(0, 100),
                'sent',
                1, // System user
                action,
                response.data?.id || `webhook_${Date.now()}`
            ]);
            
            console.log(`Discord rule notification sent successfully: ${rule.full_code} (${action})`);
        }
    } catch (error) {
        console.error('Error sending rule to Discord:', error);
        
        // Log failed Discord message
        try {
            const db = require('../database/init').getInstance();
            await db.run(`
                INSERT INTO discord_messages (
                    message_type, rule_id, webhook_url, delivery_status, 
                    sent_by, action_type, error_message
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
                'rule',
                ruleId,
                'webhook_error',
                'failed',
                1, // System user
                action,
                error.message || 'Unknown error'
            ]);
        } catch (logError) {
            console.error('Error logging Discord failure:', logError);
        }
    }
}

// Activity logging middleware for all staff routes
router.use(ActivityLogger.middleware('access', 'dashboard'));

// Enhanced dashboard data endpoint with activity insights
router.get('/dashboard', requireAuth, async (req, res) => {
    try {
        const db = require('../database/init').getInstance();
        
        // Get dashboard statistics
        const [ruleCount, categoryCount, announcementCount, recentChanges, activitySummary, recentActivity] = await Promise.all([
            db.get('SELECT COUNT(*) as count FROM rules WHERE is_active = 1'),
            db.get('SELECT COUNT(*) as count FROM categories'),
            db.get('SELECT COUNT(*) as count FROM announcements WHERE is_active = 1'),
            db.all(`
                SELECT 
                    rc.*,
                    r.title as rule_title, 
                    c.name as category_name, 
                    su.steam_username,
                    rule_codes.full_code
                FROM rule_changes rc
                LEFT JOIN rules r ON rc.rule_id = r.id
                LEFT JOIN categories c ON r.category_id = c.id
                LEFT JOIN staff_users su ON rc.staff_user_id = su.id
                LEFT JOIN rule_codes ON r.id = rule_codes.rule_id
                ORDER BY rc.created_at DESC
                LIMIT 10
            `),
            ActivityLogger.getActivitySummary(null, 7), // Last 7 days
            ActivityLogger.getActivityLogs({ limit: 10, includeUserDetails: true })
        ]);

        res.json({
            stats: {
                rules: ruleCount.count,
                categories: categoryCount.count,
                announcements: announcementCount.count
            },
            recentChanges,
            activitySummary,
            recentActivity,
            user: {
                id: req.user.id,
                username: req.user.username,
                permissionLevel: req.user.permissionLevel
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});

// Activity logs endpoint
router.get('/activity-logs', requireAuth, requirePermission('moderator'), async (req, res) => {
    try {
        const {
            staffUserId,
            actionType,
            resourceType,
            startDate,
            endDate,
            limit = 50,
            offset = 0
        } = req.query;

        const logs = await ActivityLogger.getActivityLogs({
            staffUserId: staffUserId || null,
            actionType: actionType || null,
            resourceType: resourceType || null,
            startDate: startDate || null,
            endDate: endDate || null,
            limit: parseInt(limit),
            offset: parseInt(offset),
            includeUserDetails: true
        });

        res.json(logs);
    } catch (error) {
        console.error('Error fetching activity logs:', error);
        res.status(500).json({ error: 'Failed to fetch activity logs' });
    }
});

// Activity summary endpoint
router.get('/activity-summary', requireAuth, requirePermission('moderator'), async (req, res) => {
    try {
        const { staffUserId, days = 30 } = req.query;
        
        const summary = await ActivityLogger.getActivitySummary(
            staffUserId || null,
            parseInt(days)
        );

        res.json(summary);
    } catch (error) {
        console.error('Error fetching activity summary:', error);
        res.status(500).json({ error: 'Failed to fetch activity summary' });
    }
});

// User management routes (only admin and owner can access)
router.get('/users', requireAuth, (req, res, next) => {
    // Check if user has permission to manage users (admin or owner)
    if (req.user.permissionLevel !== 'admin' && req.user.permissionLevel !== 'owner') {
        return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
}, async (req, res) => {
    try {
        const db = require('../database/init').getInstance();
        const users = await db.all(`
            SELECT 
                su.id, su.steam_id, su.steam_username, su.permission_level, 
                su.is_active, su.created_at, su.last_login,
                (SELECT COUNT(*) FROM staff_activity_logs WHERE staff_user_id = su.id) as total_actions,
                (SELECT COUNT(*) FROM staff_activity_logs WHERE staff_user_id = su.id AND created_at >= datetime('now', '-7 days')) as recent_actions
            FROM staff_users su
            ORDER BY su.created_at DESC
        `);
        
        // Filter users based on what the current user can manage
        const filteredUsers = users.filter(user => {
            // Users can always see themselves
            if (user.id === req.user.id) {
                return true;
            }
            
            // Check if current user can manage this user
            return canManageUser(req.user.permissionLevel, user.permission_level);
        });
        
        res.json(filteredUsers);
    } catch (error) {
        console.error('Error fetching staff users:', error);
        res.status(500).json({ error: 'Failed to fetch staff users' });
    }
});

router.post('/users', requireAuth, (req, res, next) => {
    // Check if user has permission to manage users (admin or owner)
    if (req.user.permissionLevel !== 'admin' && req.user.permissionLevel !== 'owner') {
        return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
}, async (req, res) => {
    try {
        const { steamId, username, permissionLevel } = req.body;
        
        if (!steamId || !username || !permissionLevel) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check if the current user can assign this permission level
        const validLevels = getValidPermissionLevels(req.user.permissionLevel);
        if (!validLevels.includes(permissionLevel)) {
            return res.status(403).json({ 
                error: `You cannot assign ${permissionLevel} permission level. Valid levels: ${validLevels.join(', ')}` 
            });
        }

        const db = require('../database/init').getInstance();
        
        // Check if user already exists
        const existingUser = await db.get(
            'SELECT id FROM staff_users WHERE steam_id = ?',
            [steamId]
        );

        if (existingUser) {
            return res.status(409).json({ error: 'User already exists' });
        }

        const result = await db.run(
            `INSERT INTO staff_users (steam_id, steam_username, permission_level) 
             VALUES (?, ?, ?)`,
            [steamId, username, permissionLevel]
        );

        // Log the user creation
        await ActivityLogger.log({
            staffUserId: req.user.id,
            actionType: 'create',
            resourceType: 'user',
            resourceId: result.id,
            actionDetails: {
                newUserSteamId: steamId,
                newUserUsername: username,
                newUserPermissionLevel: permissionLevel
            },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            sessionId: req.sessionID,
            success: true
        });

        res.status(201).json({
            id: result.id,
            steamId,
            username,
            permissionLevel,
            message: 'User added successfully'
        });
    } catch (error) {
        console.error('Error adding staff user:', error);
        res.status(500).json({ error: 'Failed to add staff user' });
    }
});

router.put('/users/:id', requireAuth, (req, res, next) => {
    // Check if user has permission to manage users (admin or owner)
    if (req.user.permissionLevel !== 'admin' && req.user.permissionLevel !== 'owner') {
        return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
}, async (req, res) => {
    try {
        const { id } = req.params;
        const { permissionLevel, isActive } = req.body;

        if (!permissionLevel || typeof isActive !== 'boolean') {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const db = require('../database/init').getInstance();
        
        // Get old user data for logging and permission checking
        const oldUser = await db.get('SELECT * FROM staff_users WHERE id = ?', [id]);
        if (!oldUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if current user can manage the target user
        if (!canManageUser(req.user.permissionLevel, oldUser.permission_level)) {
            return res.status(403).json({ 
                error: 'You cannot manage users with this permission level' 
            });
        }

        // Check if the current user can assign the new permission level
        const validLevels = getValidPermissionLevels(req.user.permissionLevel);
        if (!validLevels.includes(permissionLevel)) {
            return res.status(403).json({ 
                error: `You cannot assign ${permissionLevel} permission level. Valid levels: ${validLevels.join(', ')}` 
            });
        }

        const result = await db.run(
            'UPDATE staff_users SET permission_level = ?, is_active = ? WHERE id = ?',
            [permissionLevel, isActive ? 1 : 0, id]
        );

        if (result.changes === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Log the user update
        await ActivityLogger.log({
            staffUserId: req.user.id,
            actionType: 'update',
            resourceType: 'user',
            resourceId: parseInt(id),
            actionDetails: {
                oldPermissionLevel: oldUser.permission_level,
                newPermissionLevel: permissionLevel,
                oldIsActive: oldUser.is_active,
                newIsActive: isActive,
                targetUserSteamId: oldUser.steam_id,
                targetUsername: oldUser.steam_username
            },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            sessionId: req.sessionID,
            success: true
        });

        res.json({ message: 'User updated successfully' });
    } catch (error) {
        console.error('Error updating staff user:', error);
        res.status(500).json({ error: 'Failed to update staff user' });
    }
});

// Deactivate user (don't actually delete for audit trail)
router.delete('/users/:id', requireAuth, (req, res, next) => {
    // Check if user has permission to manage users (admin or owner)
    if (req.user.permissionLevel !== 'admin' && req.user.permissionLevel !== 'owner') {
        return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
}, async (req, res) => {
    try {
        const { id } = req.params;
        const db = require('../database/init').getInstance();
        
        // Get user data for logging and permission checking
        const user = await db.get('SELECT * FROM staff_users WHERE id = ?', [id]);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Don't allow users to deactivate themselves
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ error: 'Cannot deactivate your own account' });
        }

        // Check if current user can manage the target user
        if (!canManageUser(req.user.permissionLevel, user.permission_level)) {
            return res.status(403).json({ 
                error: 'You cannot manage users with this permission level' 
            });
        }

        const result = await db.run(
            'UPDATE staff_users SET is_active = 0 WHERE id = ?',
            [id]
        );

        if (result.changes === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Log the user deactivation
        await ActivityLogger.log({
            staffUserId: req.user.id,
            actionType: 'delete',
            resourceType: 'user',
            resourceId: parseInt(id),
            actionDetails: {
                deactivatedUserSteamId: user.steam_id,
                deactivatedUsername: user.steam_username,
                deactivatedPermissionLevel: user.permission_level
            },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            sessionId: req.sessionID,
            success: true
        });

        res.json({ message: 'User deactivated successfully' });
    } catch (error) {
        console.error('Error deactivating staff user:', error);
        res.status(500).json({ error: 'Failed to deactivate staff user' });
    }
});

// Content management routes with approval workflow
router.get('/announcements', requireAuth, requirePermission('editor'), async (req, res) => {
    try {
        const db = require('../database/init').getInstance();
        const userLevel = req.user.permissionLevel;
        
        // Build query based on user permission level
        let whereClause = '';
        let queryParams = [];
        
        if (userLevel === 'editor') {
            // Editors can see: approved announcements + their own drafts/pending (NO rejected content)
            // Handle existing announcements without status field (treat NULL as approved)
            whereClause = `WHERE ((announcements.status = 'approved' OR announcements.status IS NULL) AND announcements.is_active = 1) 
                          OR (announcements.submitted_by = ? AND announcements.status IN ('draft', 'pending_approval'))`;
            queryParams = [req.user.id];
            console.log('🔍 EDITOR QUERY - User ID:', req.user.id, 'WHERE clause:', whereClause);
        } else if (userLevel === 'moderator') {
            // Moderators can see all announcements except rejected (only admin+ can see rejected)
            whereClause = `WHERE announcements.is_active = 1 OR announcements.status IN ('pending_approval', 'draft') OR announcements.status IS NULL`;
        } else {
            // Admin+ can see ALL announcements including rejected
            whereClause = `WHERE announcements.is_active = 1 OR announcements.status IN ('pending_approval', 'draft', 'rejected') OR announcements.status IS NULL`;
        }
        
        // Get immediate announcements
        const immediateAnnouncements = await db.all(`
            SELECT announcements.*, 'immediate' as announcement_type, 0 as is_scheduled, NULL as scheduled_for, NULL as auto_expire_hours,
                   su_submitted.steam_username as submitted_by_username,
                   su_reviewed.steam_username as reviewed_by_username
            FROM announcements
            LEFT JOIN staff_users su_submitted ON announcements.submitted_by = su_submitted.id
            LEFT JOIN staff_users su_reviewed ON announcements.reviewed_by = su_reviewed.id
            ${whereClause}
            ORDER BY announcements.priority DESC, announcements.created_at DESC
        `, queryParams);
        
        // Get scheduled announcements (only for moderators+)
        let scheduledAnnouncements = [];
        if (userLevel !== 'editor') {
            scheduledAnnouncements = await db.all(`
                SELECT *, 'scheduled' as announcement_type, 1 as is_scheduled 
                FROM scheduled_announcements
                ORDER BY scheduled_for ASC
            `);
        }
        
        // Combine and sort all announcements
        const allAnnouncements = [
            ...immediateAnnouncements,
            ...scheduledAnnouncements.map(ann => ({
                ...ann,
                // Ensure consistency with immediate announcements structure
                is_active: ann.is_published || 0
            }))
        ];
        
        // Sort by priority, then by creation date
        allAnnouncements.sort((a, b) => {
            if (a.priority !== b.priority) {
                return b.priority - a.priority; // Higher priority first
            }
            return new Date(b.created_at) - new Date(a.created_at); // Newer first
        });
        
        res.json(allAnnouncements);
    } catch (error) {
        console.error('Error fetching announcements:', error);
        res.status(500).json({ error: 'Failed to fetch announcements' });
    }
});

router.get('/announcements/:id', requireAuth, requirePermission('moderator'), async (req, res) => {
    try {
        const { id } = req.params;
        const db = require('../database/init').getInstance();
        const announcement = await db.get('SELECT * FROM announcements WHERE id = ?', [id]);
        
        if (!announcement) {
            return res.status(404).json({ error: 'Announcement not found' });
        }
        
        res.json(announcement);
    } catch (error) {
        console.error('Error fetching announcement:', error);
        res.status(500).json({ error: 'Failed to fetch announcement' });
    }
});

router.post('/announcements', requireAuth, requirePermission('editor'), async (req, res) => {
    try {
        const { title, content, priority, isActive, isScheduled, scheduledFor, autoExpireHours, status } = req.body;
        
        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required' });
        }

        const db = require('../database/init').getInstance();
        const userLevel = req.user.permissionLevel;
        
        if (isScheduled && scheduledFor) {
            // Only moderators+ can create scheduled announcements
            if (userLevel === 'editor') {
                return res.status(403).json({ error: 'Editors cannot create scheduled announcements' });
            }
            
            // Create scheduled announcement
            const scheduledDate = new Date(scheduledFor);
            const now = new Date();
            
            if (scheduledDate <= now) {
                return res.status(400).json({ error: 'Scheduled time must be in the future' });
            }
            
            const result = await db.run(
                `INSERT INTO scheduled_announcements 
                 (title, content, priority, scheduled_for, created_by, auto_expire_hours) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [title, content, priority || 1, scheduledFor, req.user.id, autoExpireHours || null]
            );

            // Log the scheduled announcement creation
            await ActivityLogger.log({
                staffUserId: req.user.id,
                actionType: 'schedule',
                resourceType: 'announcement',
                resourceId: result.id,
                actionDetails: {
                    title: title,
                    priority: priority || 1,
                    scheduledFor: scheduledFor,
                    autoExpireHours: autoExpireHours,
                    timestamp: new Date().toISOString()
                },
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.get('User-Agent'),
                sessionId: req.sessionID,
                success: true
            });

            res.status(201).json({
                id: result.id,
                message: 'Announcement scheduled successfully',
                scheduledFor: scheduledFor,
                type: 'scheduled'
            });
        } else {
            // Create immediate announcement with approval workflow
            
            // Determine status and approval fields based on user level and request
            let finalStatus, submittedBy, submittedAt, isActive;
            
            // If status is explicitly provided, respect it regardless of user level (for debug UI and explicit workflow)
            if (status && (status === 'draft' || status === 'pending_approval')) {
                finalStatus = status;
                submittedBy = req.user.id;
                submittedAt = finalStatus === 'draft' ? null : new Date().toISOString();
                isActive = 0; // Not active until approved
            } else if (userLevel === 'editor') {
                // Editors create drafts or submit for approval based on status parameter
                finalStatus = status || 'pending_approval'; // Default to pending if no status specified
                submittedBy = req.user.id;
                submittedAt = finalStatus === 'draft' ? null : new Date().toISOString();
                isActive = 0; // Not active until approved
            } else {
                // Moderators+ can create approved rules directly (when no explicit draft/pending status is provided)
                finalStatus = 'approved';
                submittedBy = req.user.id;
                submittedAt = new Date().toISOString();
                isActive = 1; // Active immediately
            }
            
            const result = await db.run(
                'INSERT INTO announcements (title, content, priority, is_active, status, submitted_by, submitted_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [title, content, priority || 1, isActive, finalStatus, submittedBy, submittedAt]
            );

            // Log the immediate announcement creation
            await ActivityLogger.log({
                staffUserId: req.user.id,
                actionType: 'create',
                resourceType: 'announcement',
                resourceId: result.id,
                actionDetails: {
                    title: title,
                    priority: priority || 1,
                    status: finalStatus,
                    isDraft: finalStatus === 'draft',
                    timestamp: new Date().toISOString()
                },
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.get('User-Agent'),
                sessionId: req.sessionID,
                success: true
            });

            const message = finalStatus === 'draft' ? 'Draft saved successfully' : 
                           finalStatus === 'pending_approval' ? 'Announcement submitted for approval' : 
                           'Announcement created successfully';

            res.status(201).json({
                id: result.id,
                status: finalStatus,
                message: message,
                type: 'immediate'
            });
        }
    } catch (error) {
        console.error('Error creating announcement:', error);
        res.status(500).json({ error: 'Failed to create announcement' });
    }
});

router.put('/announcements/:id', requireAuth, requirePermission('editor'), async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, priority, isActive, isScheduled, scheduledFor, autoExpireHours, status } = req.body;

        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required' });
        }

        const db = require('../database/init').getInstance();
        const userLevel = req.user.permissionLevel;
        
        // First, check if this is a scheduled announcement
        const scheduledAnnouncement = await db.get(
            'SELECT * FROM scheduled_announcements WHERE id = ?', 
            [id]
        );
        
        if (scheduledAnnouncement) {
            // Only moderators+ can edit scheduled announcements
            if (userLevel === 'editor') {
                return res.status(403).json({ error: 'Editors cannot edit scheduled announcements' });
            }
            
            // Update scheduled announcement
            if (isScheduled && scheduledFor) {
                const scheduledDate = new Date(scheduledFor);
                const now = new Date();
                
                if (scheduledDate <= now) {
                    return res.status(400).json({ error: 'Scheduled time must be in the future' });
                }
                
                const result = await db.run(
                    `UPDATE scheduled_announcements 
                     SET title = ?, content = ?, priority = ?, scheduled_for = ?, auto_expire_hours = ?, updated_at = CURRENT_TIMESTAMP
                     WHERE id = ?`,
                    [title, content, priority || 1, scheduledFor, autoExpireHours || null, id]
                );
                
                if (result.changes === 0) {
                    return res.status(404).json({ error: 'Scheduled announcement not found' });
                }
                
                res.json({ 
                    message: 'Scheduled announcement updated successfully',
                    type: 'scheduled'
                });
            } else {
                // Convert scheduled to immediate announcement
                await db.run('DELETE FROM scheduled_announcements WHERE id = ?', [id]);
                
                const result = await db.run(
                    'INSERT INTO announcements (title, content, priority, is_active, status, submitted_by, submitted_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [title, content, priority || 1, isActive !== false ? 1 : 0, 'approved', req.user.id, new Date().toISOString()]
                );
                
                res.json({ 
                    message: 'Converted scheduled announcement to immediate announcement',
                    newId: result.id,
                    type: 'immediate'
                });
            }
        } else {
            // Check if this is a regular announcement
            const regularAnnouncement = await db.get(
                'SELECT * FROM announcements WHERE id = ?', 
                [id]
            );
            
            if (!regularAnnouncement) {
                return res.status(404).json({ error: 'Announcement not found' });
            }
            
            if (isScheduled && scheduledFor) {
                // Only moderators+ can create scheduled announcements
                if (userLevel === 'editor') {
                    return res.status(403).json({ error: 'Editors cannot create scheduled announcements' });
                }
                
                // Convert immediate to scheduled announcement
                const scheduledDate = new Date(scheduledFor);
                const now = new Date();
                
                if (scheduledDate <= now) {
                    return res.status(400).json({ error: 'Scheduled time must be in the future' });
                }
                
                await db.run('DELETE FROM announcements WHERE id = ?', [id]);
                
                const result = await db.run(
                    `INSERT INTO scheduled_announcements 
                     (title, content, priority, scheduled_for, created_by, auto_expire_hours) 
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [title, content, priority || 1, scheduledFor, req.user.id, autoExpireHours || null]
                );
                
                res.json({ 
                    message: 'Converted immediate announcement to scheduled announcement',
                    newId: result.id,
                    type: 'scheduled'
                });
            } else {
                // Determine new status and approval fields based on user level and request
                let finalStatus, submittedBy, submittedAt, isActive;
                
                // If status is explicitly provided, respect it regardless of user level (for debug UI and explicit workflow)
                if (status && (status === 'draft' || status === 'pending_approval')) {
                    finalStatus = status;
                    submittedBy = req.user.id;
                    submittedAt = finalStatus === 'draft' ? null : new Date().toISOString();
                    isActive = 0; // Not active until approved
                } else if (userLevel === 'editor') {
                    if (status) {
                        // Editor specified a status (draft or submit for approval)
                        finalStatus = status;
                        submittedBy = req.user.id;
                        submittedAt = finalStatus === 'draft' ? null : new Date().toISOString();
                        isActive = 0; // Not active until approved
                    } else {
                        // No status specified, keep existing status for editors
                        finalStatus = regularAnnouncement.status || 'approved';
                        submittedBy = regularAnnouncement.submitted_by;
                        submittedAt = regularAnnouncement.submitted_at;
                        isActive = regularAnnouncement.is_active;
                    }
                } else {
                    // Moderators+ can edit approved rules directly (when no explicit draft/pending status is provided)
                    finalStatus = 'approved';
                    submittedBy = regularAnnouncement.submitted_by || req.user.id;
                    submittedAt = regularAnnouncement.submitted_at || new Date().toISOString();
                    isActive = 1; // Active immediately
                }
                
                // Update regular announcement
                const result = await db.run(
                    `UPDATE announcements 
                     SET title = ?, content = ?, priority = ?, is_active = ?, status = ?, submitted_by = ?, submitted_at = ?, updated_at = CURRENT_TIMESTAMP 
                     WHERE id = ?`,
                    [title || null, content, priority || 1, isActive, finalStatus, submittedBy, submittedAt, id]
                );

                if (result.changes === 0) {
                    return res.status(404).json({ error: 'Announcement not found' });
                }

                const message = finalStatus === 'draft' ? 'Announcement saved as draft successfully' : 
                               finalStatus === 'pending_approval' ? 'Announcement submitted for approval' : 
                               'Announcement updated successfully';

                res.json({ 
                    message: message,
                    status: finalStatus,
                    type: 'immediate'
                });
            }
        }
    } catch (error) {
        console.error('Error updating announcement:', error);
        res.status(500).json({ error: 'Failed to update announcement' });
    }
});

router.delete('/announcements/:id', requireAuth, requirePermission('moderator'), async (req, res) => {
    try {
        const { id } = req.params;

        const db = require('../database/init').getInstance();
        
        // First try to delete from scheduled_announcements
        const scheduledResult = await db.run(
            'DELETE FROM scheduled_announcements WHERE id = ?',
            [id]
        );
        
        if (scheduledResult.changes > 0) {
            return res.json({ 
                message: 'Scheduled announcement deleted successfully',
                type: 'scheduled'
            });
        }
        
        // If not found in scheduled, try regular announcements
        const immediateResult = await db.run(
            'DELETE FROM announcements WHERE id = ?',
            [id]
        );

        if (immediateResult.changes === 0) {
            return res.status(404).json({ error: 'Announcement not found' });
        }

        res.json({ 
            message: 'Announcement deleted successfully',
            type: 'immediate'
        });
    } catch (error) {
        console.error('Error deleting announcement:', error);
        res.status(500).json({ error: 'Failed to delete announcement' });
    }
});

// Announcement approval workflow endpoints (Moderator+ only)
router.put('/announcements/:id/approve', requireAuth, requirePermission('moderator'), async (req, res) => {
    try {
        const { id } = req.params;
        const { reviewNotes } = req.body;

        const db = require('../database/init').getInstance();
        
        // Get the announcement to approve
        const announcement = await db.get('SELECT * FROM announcements WHERE id = ?', [id]);
        if (!announcement) {
            return res.status(404).json({ error: 'Announcement not found' });
        }

        if (announcement.status !== 'pending_approval') {
            return res.status(400).json({ error: 'Announcement is not pending approval' });
        }

        // Approve the announcement
        await db.run(
            `UPDATE announcements SET status = 'approved', reviewed_by = ?, review_notes = ?, reviewed_at = CURRENT_TIMESTAMP, is_active = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [req.user.id, reviewNotes || '', id]
        );

        // Log the approval activity
        await ActivityLogger.log({
            staffUserId: req.user.id,
            actionType: 'update',
            resourceType: 'announcement',
            resourceId: parseInt(id),
            actionDetails: {
                action: 'approved',
                reviewNotes: reviewNotes || '',
                originalAuthor: announcement.submitted_by,
                timestamp: new Date().toISOString()
            },
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            sessionId: req.sessionID,
            success: true
        });

        res.json({ message: 'Announcement approved successfully' });
    } catch (error) {
        console.error('Error approving announcement:', error);
        res.status(500).json({ error: 'Failed to approve announcement' });
    }
});

router.put('/announcements/:id/reject', requireAuth, requirePermission('moderator'), async (req, res) => {
    try {
        const { id } = req.params;
        const { reviewNotes } = req.body;

        if (!reviewNotes || reviewNotes.trim() === '') {
            return res.status(400).json({ error: 'Review notes are required when rejecting an announcement' });
        }

        const db = require('../database/init').getInstance();
        
        // Get the announcement to reject
        const announcement = await db.get('SELECT * FROM announcements WHERE id = ?', [id]);
        if (!announcement) {
            return res.status(404).json({ error: 'Announcement not found' });
        }

        if (announcement.status !== 'pending_approval') {
            return res.status(400).json({ error: 'Announcement is not pending approval' });
        }

        // Reject the announcement
        await db.run(
            `UPDATE announcements SET status = 'rejected', reviewed_by = ?, review_notes = ?, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [req.user.id, reviewNotes, id]
        );

        // Log the rejection activity
        await ActivityLogger.log({
            staffUserId: req.user.id,
            actionType: 'update',
            resourceType: 'announcement',
            resourceId: parseInt(id),
            actionDetails: {
                action: 'rejected',
                reviewNotes: reviewNotes,
                originalAuthor: announcement.submitted_by,
                timestamp: new Date().toISOString()
            },
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            sessionId: req.sessionID,
            success: true
        });

        res.json({ message: 'Announcement rejected successfully' });
    } catch (error) {
        console.error('Error rejecting announcement:', error);
        res.status(500).json({ error: 'Failed to reject announcement' });
    }
});

// Enhanced rule management with activity logging and approval workflow
router.get('/rules', requireAuth, requirePermission('editor'), ActivityLogger.middleware('access', 'rule'), async (req, res) => {
    try {
        const db = require('../database/init').getInstance();
        const userLevel = req.user.permissionLevel;
        
        // Build query based on user permission level
        let whereClause = '';
        let queryParams = [];
        
        if (userLevel === 'editor') {
            // Editors can see: approved rules + their own drafts/pending (NO rejected content)
            // Handle existing rules without status field (treat NULL as approved)
            whereClause = `WHERE ((r.status = 'approved' OR r.status IS NULL) AND r.is_active = 1) 
                          OR (r.submitted_by = ? AND r.status IN ('draft', 'pending_approval'))`;
            queryParams = [req.user.id];
            console.log('🔍 EDITOR QUERY - User ID:', req.user.id, 'WHERE clause:', whereClause);
        } else if (userLevel === 'moderator') {
            // Moderators can see all rules except rejected (only admin+ can see rejected)
            whereClause = `WHERE r.is_active = 1 OR r.status IN ('pending_approval', 'draft') OR r.status IS NULL`;
        } else {
            // Admin+ can see ALL rules including rejected
            whereClause = `WHERE r.is_active = 1 OR r.status IN ('pending_approval', 'draft', 'rejected') OR r.status IS NULL`;
        }
        
        const rules = await db.all(`
            SELECT r.*, c.name as category_name, c.letter_code, rc.full_code,
                   su_submitted.steam_username as submitted_by_username,
                   su_reviewed.steam_username as reviewed_by_username
            FROM rules r
            LEFT JOIN categories c ON r.category_id = c.id
            LEFT JOIN rule_codes rc ON r.id = rc.rule_id
            LEFT JOIN staff_users su_submitted ON r.submitted_by = su_submitted.id
            LEFT JOIN staff_users su_reviewed ON r.reviewed_by = su_reviewed.id
            ${whereClause}
            ORDER BY c.order_index, r.order_index
        `, queryParams);
        
        if (userLevel === 'editor') {
            console.log('🔍 EDITOR RESULTS - Found', rules.length, 'rules');
            rules.forEach(rule => {
                console.log(`  Rule ${rule.id}: status="${rule.status}", is_active=${rule.is_active}, submitted_by=${rule.submitted_by}, title="${rule.title}"`);
            });
        }
        
        // Parse images JSON for each rule
        const rulesWithImages = rules.map(rule => {
            let images = [];
            try {
                if (rule.images && rule.images !== 'null' && rule.images !== '') {
                    images = JSON.parse(rule.images);
                }
            } catch (e) {
                console.log('Error parsing images for rule', rule.id, ':', e);
                images = [];
            }
            return {
                ...rule,
                images: Array.isArray(images) ? images : []
            };
        });
        
        // Organize rules into hierarchical structure
        const parentRules = rulesWithImages.filter(rule => !rule.parent_rule_id);
        const subRules = rulesWithImages.filter(rule => rule.parent_rule_id);
        
        // Attach sub-rules to their parent rules
        const hierarchicalRules = parentRules.map(parentRule => {
            const attachedSubRules = subRules
                .filter(subRule => subRule.parent_rule_id === parentRule.id)
                .sort((a, b) => a.sub_number - b.sub_number);
            
            return {
                ...parentRule,
                sub_rules: attachedSubRules
            };
        });
        
        res.json(hierarchicalRules);
    } catch (error) {
        console.error('Error fetching rules:', error);
        res.status(500).json({ error: 'Failed to fetch rules' });
    }
});

router.post('/rules', requireAuth, requirePermission('editor'), async (req, res) => {
    try {
        const { categoryId, title, content, parentRuleId, images, status } = req.body;
        
        if (!categoryId || !content) {
            return res.status(400).json({ error: 'Category and content are required' });
        }

        const db = require('../database/init').getInstance();
        const userLevel = req.user.permissionLevel;
        
        // Use content as title if title is empty (for simple rules)
        const ruleTitle = title && title.trim() ? title.trim() : content.replace(/<[^>]*>/g, '').substring(0, 100);
        
        // Get next rule number
        let ruleNumber = 1;
        let subNumber = null;
        
        if (parentRuleId) {
            // This is a sub-rule
            const subRuleCount = await db.get(
                'SELECT COUNT(*) as count FROM rules WHERE parent_rule_id = ?',
                [parentRuleId]
            );
            subNumber = subRuleCount.count + 1;
            
            const parentRule = await db.get(
                'SELECT rule_number FROM rules WHERE id = ?',
                [parentRuleId]
            );
            ruleNumber = parentRule.rule_number;
        } else {
            // This is a main rule
            const ruleCount = await db.get(
                'SELECT COUNT(*) as count FROM rules WHERE category_id = ? AND parent_rule_id IS NULL',
                [categoryId]
            );
            ruleNumber = ruleCount.count + 1;
        }

        // Determine status and approval fields based on user level and request
        let finalStatus, submittedBy, submittedAt, isActive;
        
        // If status is explicitly provided, respect it regardless of user level (for debug UI and explicit workflow)
        if (status && (status === 'draft' || status === 'pending_approval')) {
            finalStatus = status;
            submittedBy = req.user.id;
            submittedAt = finalStatus === 'draft' ? null : new Date().toISOString();
            isActive = 0; // Not active until approved
        } else if (userLevel === 'editor') {
            // Editors create drafts or submit for approval based on status parameter
            finalStatus = status || 'pending_approval'; // Default to pending if no status specified
            submittedBy = req.user.id;
            submittedAt = finalStatus === 'draft' ? null : new Date().toISOString();
            isActive = 0; // Not active until approved
        } else {
            // Moderators+ can create approved rules directly (when no explicit draft/pending status is provided)
            finalStatus = 'approved';
            submittedBy = req.user.id;
            submittedAt = new Date().toISOString();
            isActive = 1; // Active immediately
        }

        const result = await db.run(
            `INSERT INTO rules (category_id, parent_rule_id, title, content, rule_number, sub_number, order_index, images, status, submitted_by, submitted_at, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [categoryId, parentRuleId || null, title || null, content, ruleNumber, subNumber, ruleNumber + (subNumber || 0) * 0.1, JSON.stringify(images || []), finalStatus, submittedBy, submittedAt, isActive]
        );

        // Generate full code (e.g., "A.1", "A.1.1")
        const category = await db.get('SELECT letter_code FROM categories WHERE id = ?', [categoryId]);
        const fullCode = subNumber 
            ? `${category.letter_code}.${ruleNumber}.${subNumber}`
            : `${category.letter_code}.${ruleNumber}`;

        // Create rule_codes entry
        const truncatedDescription = content.substring(0, 100).replace(/<[^>]*>/g, '');
        await db.run(
            'INSERT INTO rule_codes (rule_id, full_code, truncated_description, searchable_content) VALUES (?, ?, ?, ?)',
            [result.id, fullCode, truncatedDescription, `${fullCode} ${ruleTitle} ${content}`.toLowerCase()]
        );

        // Create rule change record
        await db.run(
            `INSERT INTO rule_changes (rule_id, change_type, new_content, change_description, staff_user_id)
             VALUES (?, 'created', ?, ?, ?)`,
            [result.id, content, finalStatus === 'draft' ? 'Draft created' : (finalStatus === 'pending_approval' ? 'Rule submitted for approval' : 'Rule created'), req.user.id]
        );

        // Log the rule creation activity
        await ActivityLogger.log({
            staffUserId: req.user.id,
            actionType: 'create',
            resourceType: 'rule',
            resourceId: result.id,
            actionDetails: {
                ruleTitle: title,
                categoryId: categoryId,
                isSubRule: !!parentRuleId,
                fullCode: fullCode,
                status: finalStatus,
                isDraft: finalStatus === 'draft',
                timestamp: new Date().toISOString()
            },
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            sessionId: req.sessionID,
            success: true
        });

        // Send rule to Discord
        await sendRuleToDiscord(result.id, 'create');

        const message = finalStatus === 'draft' ? 'Draft saved successfully' : 
                       finalStatus === 'pending_approval' ? 'Rule submitted for approval' : 
                       'Rule created successfully';

        res.status(201).json({
            id: result.id,
            status: finalStatus,
            message: message
        });
    } catch (error) {
        console.error('Error creating rule:', error);
        res.status(500).json({ error: 'Failed to create rule' });
    }
});

router.put('/rules/:id', requireAuth, requirePermission('editor'), async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, categoryId, images, status } = req.body;
        
        console.log('🔍 PUT /rules/:id received data:', {
            id,
            title,
            categoryId,
            status,
            userLevel: req.user.permissionLevel,
            userId: req.user.id
        });
        
        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }

        const db = require('../database/init').getInstance();
        const userLevel = req.user.permissionLevel;
        
        // Get existing rule
        const existingRule = await db.get('SELECT * FROM rules WHERE id = ?', [id]);
        if (!existingRule) {
            return res.status(404).json({ error: 'Rule not found' });
        }
        
        console.log('🔍 Existing rule:', {
            id: existingRule.id,
            title: existingRule.title,
            status: existingRule.status,
            is_active: existingRule.is_active
        });
        
        // Determine new status and approval fields based on user level and request
        let finalStatus, submittedBy, submittedAt, isActive;
        
        // If status is explicitly provided, respect it regardless of user level (for debug UI and explicit workflow)
        if (status && (status === 'draft' || status === 'pending_approval')) {
            finalStatus = status;
            submittedBy = req.user.id;
            submittedAt = finalStatus === 'draft' ? null : new Date().toISOString();
            isActive = 0; // Not active until approved
        } else if (userLevel === 'editor') {
            if (status) {
                // Editor specified a status (draft or submit for approval)
                finalStatus = status;
                submittedBy = req.user.id;
                submittedAt = finalStatus === 'draft' ? null : new Date().toISOString();
                isActive = 0; // Not active until approved
            } else {
                // No status specified, keep existing status for editors
                finalStatus = existingRule.status || 'approved';
                submittedBy = existingRule.submitted_by;
                submittedAt = existingRule.submitted_at;
                isActive = existingRule.is_active;
            }
        } else {
            // Moderators+ can edit approved rules directly (when no explicit draft/pending status is provided)
            finalStatus = 'approved';
            submittedBy = existingRule.submitted_by || req.user.id;
            submittedAt = existingRule.submitted_at || new Date().toISOString();
            isActive = 1; // Active immediately
        }
        
        console.log('🔍 Calculated values:', {
            finalStatus,
            submittedBy,
            submittedAt,
            isActive,
            userLevel
        });
        
        // Update rule with new status
        const result = await db.run(
            `UPDATE rules SET title = ?, content = ?, category_id = ?, images = ?, status = ?, submitted_by = ?, submitted_at = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [title || null, content, categoryId || existingRule.category_id, JSON.stringify(images || []), finalStatus, submittedBy, submittedAt, isActive, id]
        );

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Rule not found' });
        }

        console.log('🔍 Database update result:', {
            changes: result.changes,
            finalStatus,
            isActive
        });

        // Update rule_codes entry
        const truncatedDescription = content.substring(0, 100).replace(/<[^>]*>/g, '');
        const ruleTitle = title && title.trim() ? title.trim() : content.replace(/<[^>]*>/g, '').substring(0, 100);
        
        // Get the full code for this rule
        const ruleCode = await db.get('SELECT full_code FROM rule_codes WHERE rule_id = ?', [id]);
        if (ruleCode) {
            await db.run(
                'UPDATE rule_codes SET truncated_description = ?, searchable_content = ? WHERE rule_id = ?',
                [truncatedDescription, `${ruleCode.full_code} ${ruleTitle} ${content}`.toLowerCase(), id]
            );
        }

        // Create rule change record
        const changeDescription = finalStatus === 'draft' ? 'Rule saved as draft' : 
                                 finalStatus === 'pending_approval' ? 'Rule submitted for approval' : 
                                 'Rule updated';
        
        await db.run(
            `INSERT INTO rule_changes (rule_id, change_type, old_content, new_content, change_description, staff_user_id)
             VALUES (?, 'updated', ?, ?, ?, ?)`,
            [id, existingRule.content, content, changeDescription, req.user.id]
        );

        // Log the rule update activity
        await ActivityLogger.log({
            staffUserId: req.user.id,
            actionType: 'update',
            resourceType: 'rule',
            resourceId: parseInt(id),
            actionDetails: {
                ruleTitle: title,
                oldTitle: existingRule.title,
                categoryId: categoryId || existingRule.category_id,
                oldCategoryId: existingRule.category_id,
                contentChanged: existingRule.content !== content,
                titleChanged: existingRule.title !== title,
                statusChanged: existingRule.status !== finalStatus,
                oldStatus: existingRule.status,
                newStatus: finalStatus,
                timestamp: new Date().toISOString()
            },
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            sessionId: req.sessionID,
            success: true
        });

        // Send rule to Discord
        await sendRuleToDiscord(id, 'update');

        const message = finalStatus === 'draft' ? 'Rule saved as draft successfully' : 
                       finalStatus === 'pending_approval' ? 'Rule submitted for approval' : 
                       'Rule updated successfully';

        console.log('🔍 Sending response:', {
            message,
            status: finalStatus
        });

        res.json({ 
            message: message,
            status: finalStatus
        });
    } catch (error) {
        console.error('Error updating rule:', error);
        res.status(500).json({ error: 'Failed to update rule' });
    }
});

// Approval workflow endpoints (Moderator+ only)
router.put('/rules/:id/approve', requireAuth, requirePermission('moderator'), async (req, res) => {
    try {
        const { id } = req.params;
        const { reviewNotes } = req.body;

        const db = require('../database/init').getInstance();
        
        // Get the rule to approve
        const rule = await db.get('SELECT * FROM rules WHERE id = ?', [id]);
        if (!rule) {
            return res.status(404).json({ error: 'Rule not found' });
        }

        if (rule.status !== 'pending_approval') {
            return res.status(400).json({ error: 'Rule is not pending approval' });
        }

        // Approve the rule
        await db.run(
            `UPDATE rules SET status = 'approved', reviewed_by = ?, review_notes = ?, reviewed_at = CURRENT_TIMESTAMP, is_active = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [req.user.id, reviewNotes || '', id]
        );

        // Create rule change record
        await db.run(
            `INSERT INTO rule_changes (rule_id, change_type, new_content, change_description, staff_user_id)
             VALUES (?, 'approved', ?, 'Rule approved by moderator', ?)`,
            [id, rule.content, req.user.id]
        );

        // Log the approval activity
        await ActivityLogger.log({
            staffUserId: req.user.id,
            actionType: 'update',
            resourceType: 'rule',
            resourceId: parseInt(id),
            actionDetails: {
                action: 'approved',
                reviewNotes: reviewNotes || '',
                originalAuthor: rule.submitted_by,
                timestamp: new Date().toISOString()
            },
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            sessionId: req.sessionID,
            success: true
        });

        // Send rule to Discord
        await sendRuleToDiscord(id, 'approved');

        res.json({ message: 'Rule approved successfully' });
    } catch (error) {
        console.error('Error approving rule:', error);
        res.status(500).json({ error: 'Failed to approve rule' });
    }
});

router.put('/rules/:id/reject', requireAuth, requirePermission('moderator'), async (req, res) => {
    try {
        const { id } = req.params;
        const { reviewNotes } = req.body;

        if (!reviewNotes || reviewNotes.trim() === '') {
            return res.status(400).json({ error: 'Review notes are required when rejecting a rule' });
        }

        const db = require('../database/init').getInstance();
        
        // Get the rule to reject
        const rule = await db.get('SELECT * FROM rules WHERE id = ?', [id]);
        if (!rule) {
            return res.status(404).json({ error: 'Rule not found' });
        }

        if (rule.status !== 'pending_approval') {
            return res.status(400).json({ error: 'Rule is not pending approval' });
        }

        // Reject the rule
        await db.run(
            `UPDATE rules SET status = 'rejected', reviewed_by = ?, review_notes = ?, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [req.user.id, reviewNotes, id]
        );

        // Create rule change record
        await db.run(
            `INSERT INTO rule_changes (rule_id, change_type, new_content, change_description, staff_user_id)
             VALUES (?, 'rejected', ?, 'Rule rejected by moderator', ?)`,
            [id, rule.content, req.user.id]
        );

        // Log the rejection activity
        await ActivityLogger.log({
            staffUserId: req.user.id,
            actionType: 'update',
            resourceType: 'rule',
            resourceId: parseInt(id),
            actionDetails: {
                action: 'rejected',
                reviewNotes: reviewNotes,
                originalAuthor: rule.submitted_by,
                timestamp: new Date().toISOString()
            },
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            sessionId: req.sessionID,
            success: true
        });

        // Send rule to Discord
        await sendRuleToDiscord(id, 'rejected');

        res.json({ message: 'Rule rejected successfully' });
    } catch (error) {
        console.error('Error rejecting rule:', error);
        res.status(500).json({ error: 'Failed to reject rule' });
    }
});

// Get pending approvals (Moderator+ only)
router.get('/pending-approvals', requireAuth, requirePermission('moderator'), async (req, res) => {
    try {
        const db = require('../database/init').getInstance();
        
        const pendingRules = await db.all(`
            SELECT r.*, c.name as category_name, c.letter_code, rc.full_code,
                   su_submitted.steam_username as submitted_by_username
            FROM rules r
            LEFT JOIN categories c ON r.category_id = c.id
            LEFT JOIN rule_codes rc ON r.id = rc.rule_id
            LEFT JOIN staff_users su_submitted ON r.submitted_by = su_submitted.id
            WHERE r.status = 'pending_approval'
            ORDER BY r.submitted_at ASC
        `);

        const pendingAnnouncements = await db.all(`
            SELECT a.*, su_submitted.steam_username as submitted_by_username
            FROM announcements a
            LEFT JOIN staff_users su_submitted ON a.submitted_by = su_submitted.id
            WHERE a.status = 'pending_approval'
            ORDER BY a.submitted_at ASC
        `);

        res.json({
            rules: pendingRules,
            announcements: pendingAnnouncements,
            totalPending: pendingRules.length + pendingAnnouncements.length
        });
    } catch (error) {
        console.error('Error fetching pending approvals:', error);
        res.status(500).json({ error: 'Failed to fetch pending approvals' });
    }
});

router.delete('/rules/:id', requireAuth, requirePermission('moderator'), async (req, res) => {
    try {
        const { id } = req.params;
        const db = require('../database/init').getInstance();
        
        // Get rule info for logging
        const rule = await db.get('SELECT * FROM rules WHERE id = ?', [id]);
        if (!rule) {
            return res.status(404).json({ error: 'Rule not found' });
        }

        // Check if rule has sub-rules
        const subRuleCount = await db.get(
            'SELECT COUNT(*) as count FROM rules WHERE parent_rule_id = ? AND is_active = 1',
            [id]
        );

        if (subRuleCount.count > 0) {
            return res.status(400).json({ 
                error: `Cannot delete rule: it has ${subRuleCount.count} sub-rule(s). Please delete the sub-rules first.` 
            });
        }

        // Soft delete the rule (set is_active = 0)
        const result = await db.run(
            'UPDATE rules SET is_active = 0 WHERE id = ?',
            [id]
        );

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Rule not found' });
        }

        // Also remove from rule_codes table
        await db.run('DELETE FROM rule_codes WHERE rule_id = ?', [id]);

        // Create rule change record
        await db.run(
            `INSERT INTO rule_changes (rule_id, change_type, old_content, change_description, staff_user_id)
             VALUES (?, 'deleted', ?, 'Rule deleted', ?)`,
            [id, rule.content, req.user.id]
        );

        // Log the rule deletion activity
        await ActivityLogger.log({
            staffUserId: req.user.id,
            actionType: 'delete',
            resourceType: 'rule',
            resourceId: parseInt(id),
            actionDetails: {
                ruleTitle: rule.title,
                categoryId: rule.category_id,
                isSubRule: !!rule.parent_rule_id,
                deletedContent: rule.content.substring(0, 200) + (rule.content.length > 200 ? '...' : ''),
                timestamp: new Date().toISOString()
            },
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            sessionId: req.sessionID,
            success: true
        });

        // Send rule to Discord
        await sendRuleToDiscord(id, 'deleted');

        res.json({ message: 'Rule deleted successfully' });
    } catch (error) {
        console.error('Error deleting rule:', error);
        res.status(500).json({ error: 'Failed to delete rule' });
    }
});

// Category management routes (admin only)
router.get('/categories', requireAuth, requirePermission('admin'), ActivityLogger.middleware('access', 'category'), async (req, res) => {
    try {
        const db = require('../database/init').getInstance();
        const categories = await db.all(`
            SELECT c.*, COUNT(r.id) as rule_count
            FROM categories c
            LEFT JOIN rules r ON c.id = r.category_id AND r.is_active = 1
            GROUP BY c.id
            ORDER BY c.order_index
        `);
        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// Simple categories list for editors (for rule forms)
router.get('/categories/list', requireAuth, requirePermission('editor'), async (req, res) => {
    try {
        const db = require('../database/init').getInstance();
        const categories = await db.all(`
            SELECT id, letter_code, name
            FROM categories
            ORDER BY order_index
        `);
        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

router.post('/categories', requireAuth, requirePermission('admin'), async (req, res) => {
    try {
        const { letter_code, name, description } = req.body;
        
        if (!letter_code || !name) {
            return res.status(400).json({ error: 'Letter code and name are required' });
        }

        // Validate letter code format
        if (!/^[A-Z]$/.test(letter_code)) {
            return res.status(400).json({ error: 'Letter code must be a single uppercase letter (A-Z)' });
        }

        const db = require('../database/init').getInstance();
        
        // Check if letter code already exists
        const existingCategory = await db.get(
            'SELECT id FROM categories WHERE letter_code = ?',
            [letter_code]
        );

        if (existingCategory) {
            return res.status(409).json({ error: 'Letter code already exists' });
        }

        // Get next order index
        const maxOrder = await db.get('SELECT MAX(order_index) as max_order FROM categories');
        const orderIndex = (maxOrder.max_order || 0) + 1;

        const result = await db.run(
            'INSERT INTO categories (letter_code, name, description, order_index) VALUES (?, ?, ?, ?)',
            [letter_code, name, description || '', orderIndex]
        );

        // Log the category creation activity
        await ActivityLogger.log({
            staffUserId: req.user.id,
            actionType: 'create',
            resourceType: 'category',
            resourceId: result.id,
            actionDetails: {
                letterCode: letter_code,
                name: name,
                description: description || '',
                orderIndex: orderIndex,
                timestamp: new Date().toISOString()
            },
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            sessionId: req.sessionID,
            success: true
        });

        res.status(201).json({
            id: result.id,
            letter_code,
            name,
            description: description || '',
            order_index: orderIndex,
            message: 'Category created successfully'
        });
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ error: 'Failed to create category' });
    }
});

router.put('/categories/:id', requireAuth, requirePermission('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { letter_code, name, description } = req.body;

        if (!letter_code || !name) {
            return res.status(400).json({ error: 'Letter code and name are required' });
        }

        // Validate letter code format
        if (!/^[A-Z]$/.test(letter_code)) {
            return res.status(400).json({ error: 'Letter code must be a single uppercase letter (A-Z)' });
        }

        const db = require('../database/init').getInstance();
        
        // Check if letter code already exists for a different category
        const existingCategory = await db.get(
            'SELECT id FROM categories WHERE letter_code = ? AND id != ?',
            [letter_code, id]
        );

        if (existingCategory) {
            return res.status(409).json({ error: 'Letter code already exists' });
        }

        const result = await db.run(
            'UPDATE categories SET letter_code = ?, name = ?, description = ? WHERE id = ?',
            [letter_code, name, description || '', id]
        );

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }

        // Log the category update activity
        await ActivityLogger.log({
            staffUserId: req.user.id,
            actionType: 'update',
            resourceType: 'category',
            resourceId: parseInt(id),
            actionDetails: {
                letterCode: letter_code,
                name: name,
                description: description || '',
                timestamp: new Date().toISOString()
            },
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            sessionId: req.sessionID,
            success: true
        });

        res.json({ message: 'Category updated successfully' });
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ error: 'Failed to update category' });
    }
});

router.delete('/categories/:id', requireAuth, requirePermission('admin'), async (req, res) => {
    try {
        const { id } = req.params;

        const db = require('../database/init').getInstance();
        
        // Check if category has any rules
        const ruleCount = await db.get(
            'SELECT COUNT(*) as count FROM rules WHERE category_id = ? AND is_active = 1',
            [id]
        );

        if (ruleCount.count > 0) {
            return res.status(400).json({ 
                error: `Cannot delete category: it contains ${ruleCount.count} active rule(s). Please delete or move the rules first.` 
            });
        }

        // Check if category exists
        const category = await db.get('SELECT * FROM categories WHERE id = ?', [id]);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        const result = await db.run('DELETE FROM categories WHERE id = ?', [id]);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }

        // Log the category deletion activity
        await ActivityLogger.log({
            staffUserId: req.user.id,
            actionType: 'delete',
            resourceType: 'category',
            resourceId: parseInt(id),
            actionDetails: {
                deletedLetterCode: category.letter_code,
                deletedName: category.name,
                deletedDescription: category.description,
                timestamp: new Date().toISOString()
            },
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            sessionId: req.sessionID,
            success: true
        });

        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ error: 'Failed to delete category' });
    }
});

// Category reorder endpoint (affects automatic letter codes)
router.post('/categories/reorder', requireAuth, requirePermission('admin'), ActivityLogger.middleware('update', 'category'), async (req, res) => {
    try {
        const { categoryOrder } = req.body; // Array of {id, order_index}
        
        if (!Array.isArray(categoryOrder) || categoryOrder.length === 0) {
            return res.status(400).json({ error: 'Category order array is required' });
        }

        const db = require('../database/init').getInstance();
        
        // Start transaction
        await db.run('BEGIN TRANSACTION');

        try {
            // Update each category's order index
            for (const category of categoryOrder) {
                if (!category.id || typeof category.order_index !== 'number') {
                    throw new Error('Invalid category order data');
                }
                
                await db.run(
                    'UPDATE categories SET order_index = ? WHERE id = ?',
                    [category.order_index, category.id]
                );
            }

            // Commit transaction
            await db.run('COMMIT');

            // Log the reorder activity
            await ActivityLogger.log({
                staffUserId: req.user.id,
                actionType: 'reorder',
                resourceType: 'category',
                actionDetails: {
                    newOrder: categoryOrder,
                    timestamp: new Date().toISOString()
                },
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
                sessionId: req.sessionID,
                success: true
            });

            res.json({ 
                message: 'Categories reordered successfully',
                warning: 'Rule letter codes may be affected by this change. Verify rule codes are still correct.'
            });
        } catch (transactionError) {
            // Rollback on error
            await db.run('ROLLBACK');
            throw transactionError;
        }
    } catch (error) {
        console.error('Error reordering categories:', error);
        res.status(500).json({ error: 'Failed to reorder categories' });
    }
});

// Process scheduled announcements endpoint (to be called by a cron job)
router.post('/process-scheduled-announcements', requireAuth, requirePermission('admin'), async (req, res) => {
    try {
        const db = require('../database/init').getInstance();
        const now = new Date().toISOString();
        
        // Get announcements ready to be published
        const readyAnnouncements = await db.all(`
            SELECT * FROM scheduled_announcements 
            WHERE scheduled_for <= ? AND is_published = 0
            ORDER BY scheduled_for ASC
        `, [now]);
        
        let processedCount = 0;
        const results = [];
        
        for (const announcement of readyAnnouncements) {
            try {
                // Move to active announcements
                const result = await db.run(
                    'INSERT INTO announcements (title, content, priority, is_active) VALUES (?, ?, ?, 1)',
                    [announcement.title, announcement.content, announcement.priority]
                );
                
                // Mark as published in scheduled table
                await db.run(
                    'UPDATE scheduled_announcements SET is_published = 1, published_at = CURRENT_TIMESTAMP WHERE id = ?',
                    [announcement.id]
                );
                
                processedCount++;
                results.push({
                    scheduledId: announcement.id,
                    publishedId: result.id,
                    title: announcement.title,
                    scheduledFor: announcement.scheduled_for
                });
                
                // If auto-expire is set, schedule for deactivation
                if (announcement.auto_expire_hours) {
                    // This could be enhanced with a proper job queue, but for now just note it
                    console.log(`Announcement ${result.id} should auto-expire in ${announcement.auto_expire_hours} hours`);
                }
                
            } catch (error) {
                console.error(`Error processing scheduled announcement ${announcement.id}:`, error);
                results.push({
                    scheduledId: announcement.id,
                    error: error.message,
                    title: announcement.title
                });
            }
        }
        
        res.json({
            message: `Processed ${processedCount} scheduled announcements`,
            processedCount,
            totalFound: readyAnnouncements.length,
            results
        });
        
    } catch (error) {
        console.error('Error processing scheduled announcements:', error);
        res.status(500).json({ error: 'Failed to process scheduled announcements' });
    }
});

// Get scheduled announcements separately
router.get('/scheduled-announcements', requireAuth, requirePermission('moderator'), async (req, res) => {
    try {
        const db = require('../database/init').getInstance();
        const scheduledAnnouncements = await db.all(`
            SELECT s.*, u.steam_username as created_by_username
            FROM scheduled_announcements s
            LEFT JOIN staff_users u ON s.created_by = u.id
            WHERE s.is_published = 0
            ORDER BY s.scheduled_for ASC
        `);
        
        res.json(scheduledAnnouncements);
    } catch (error) {
        console.error('Error fetching scheduled announcements:', error);
        res.status(500).json({ error: 'Failed to fetch scheduled announcements' });
    }
});

// Manual trigger for a specific scheduled announcement
router.post('/scheduled-announcements/:id/publish-now', requireAuth, requirePermission('moderator'), async (req, res) => {
    try {
        const { id } = req.params;
        const db = require('../database/init').getInstance();
        
        const scheduledAnnouncement = await db.get(
            'SELECT * FROM scheduled_announcements WHERE id = ? AND is_published = 0',
            [id]
        );
        
        if (!scheduledAnnouncement) {
            return res.status(404).json({ error: 'Scheduled announcement not found or already published' });
        }
        
        // Move to active announcements
        const result = await db.run(
            'INSERT INTO announcements (title, content, priority, is_active) VALUES (?, ?, ?, 1)',
            [scheduledAnnouncement.title, scheduledAnnouncement.content, scheduledAnnouncement.priority]
        );
        
        // Mark as published
        await db.run(
            'UPDATE scheduled_announcements SET is_published = 1, published_at = CURRENT_TIMESTAMP WHERE id = ?',
            [id]
        );
        
        res.json({
            message: 'Scheduled announcement published successfully',
            scheduledId: parseInt(id),
            publishedId: result.id,
            title: scheduledAnnouncement.title
        });
        
    } catch (error) {
        console.error('Error publishing scheduled announcement:', error);
        res.status(500).json({ error: 'Failed to publish scheduled announcement' });
    }
});

module.exports = router; 