const express = require('express');
const { requireAuth, requirePermission } = require('./auth');
const ActivityLogger = require('../middleware/activityLogger');
const axios = require('axios');
const router = express.Router();

// Dynamic URL configuration - Auto-detect environment
const getDynamicUrls = () => {
  const serverIp = process.env.SERVER_IP || '34.132.234.56';
  const isLocal = process.env.NODE_ENV === 'development' || process.env.LOCAL_DEV === 'true';
  
  if (isLocal) {
    return {
      frontend: 'http://localhost:3000',
      backend: 'http://localhost:3001'
    };
  } else {
    return {
      frontend: `http://${serverIp}:3000`,
      backend: `http://${serverIp}:3001`
    };
  }
};

const dynamicUrls = getDynamicUrls();

console.log('🔧 Discord Dynamic URLs:', {
  NODE_ENV: process.env.NODE_ENV,
  LOCAL_DEV: process.env.LOCAL_DEV,
  dynamicUrls
});

// Activity logging middleware for all Discord routes
router.use(ActivityLogger.middleware('access', 'discord'));

// Discord settings management
router.get('/settings', requireAuth, requirePermission('admin'), async (req, res) => {
    try {
        const db = require('../database/init').getInstance();
        
        // Get Discord settings from database
        const settings = await db.get(`
            SELECT * FROM discord_settings 
            WHERE id = 1
        `);

        // Return bot-based Discord settings
        if (settings) {
            res.json({
                announcementChannelId: settings.announcement_channel_id || '',
                rulesChannelId: settings.rules_channel_id || '',
                staffNotificationChannelId: settings.staff_notification_channel_id || '',
                announcementsEnabled: settings.announcements_enabled === 1,
                rulesEnabled: settings.rules_enabled === 1,
                ruleApprovalNotificationsEnabled: settings.rule_approval_notifications_enabled === 1,
                emergencyRoleId: settings.emergency_role_id || '',
                staffRoleId: settings.staff_role_id || '',
                embedColor: settings.embed_color || '#677bae'
            });
        } else {
            res.json({
                announcementChannelId: '',
                rulesChannelId: '',
                staffNotificationChannelId: '',
                announcementsEnabled: false,
                rulesEnabled: false,
                ruleApprovalNotificationsEnabled: false,
                emergencyRoleId: '',
                staffRoleId: '',
                embedColor: '#677bae'
            });
        }
    } catch (error) {
        console.error('Error fetching Discord settings:', error);
        res.status(500).json({ error: 'Failed to fetch Discord settings' });
    }
});

router.put('/settings', requireAuth, requirePermission('admin'), async (req, res) => {
    try {
        const {
            announcementChannelId,
            rulesChannelId,
            staffNotificationChannelId,
            announcementsEnabled,
            rulesEnabled,
            ruleApprovalNotificationsEnabled,
            emergencyRoleId,
            staffRoleId,
            embedColor
        } = req.body;

        const db = require('../database/init').getInstance();

        // Validate channel IDs if provided
        const { getInstance: getDiscordBot } = require('../services/discordBot');
        const discordBot = getDiscordBot();
        
        if (discordBot && discordBot.isReady()) {
            // Validate announcement channel
            if (announcementChannelId) {
                try {
                    const channel = await discordBot.client.channels.fetch(announcementChannelId);
                    if (!channel) {
                        return res.status(400).json({ error: 'Announcement channel not found' });
                    }
                    const permissions = channel.permissionsFor(discordBot.client.user);
                    if (!permissions.has('SendMessages')) {
                        return res.status(400).json({ error: 'Bot does not have permission to send messages in the announcement channel' });
                    }
                } catch (error) {
                    return res.status(400).json({ error: `Invalid announcement channel: ${error.message}` });
                }
            }

            // Validate rules channel
            if (rulesChannelId) {
                try {
                    const channel = await discordBot.client.channels.fetch(rulesChannelId);
                    if (!channel) {
                        return res.status(400).json({ error: 'Rules channel not found' });
                    }
                    const permissions = channel.permissionsFor(discordBot.client.user);
                    if (!permissions.has('SendMessages')) {
                        return res.status(400).json({ error: 'Bot does not have permission to send messages in the rules channel' });
                    }
                } catch (error) {
                    return res.status(400).json({ error: `Invalid rules channel: ${error.message}` });
                }
            }

            // Validate staff notification channel
            if (staffNotificationChannelId) {
                try {
                    const channel = await discordBot.client.channels.fetch(staffNotificationChannelId);
                    if (!channel) {
                        return res.status(400).json({ error: 'Staff notification channel not found' });
                    }
                    const permissions = channel.permissionsFor(discordBot.client.user);
                    if (!permissions.has('SendMessages')) {
                        return res.status(400).json({ error: 'Bot does not have permission to send messages in the staff notification channel' });
                    }
                } catch (error) {
                    return res.status(400).json({ error: `Invalid staff notification channel: ${error.message}` });
                }
            }
        } else if ((announcementChannelId || rulesChannelId || staffNotificationChannelId)) {
            return res.status(400).json({ error: 'Discord bot is not connected. Cannot validate channels.' });
        }

        // Update or insert settings
        await db.run(`
            INSERT OR REPLACE INTO discord_settings (
                id, announcement_channel_id, rules_channel_id, staff_notification_channel_id,
                announcements_enabled, rules_enabled, rule_approval_notifications_enabled,
                emergency_role_id, staff_role_id, embed_color, updated_at
            ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [
            announcementChannelId || null,
            rulesChannelId || null,
            staffNotificationChannelId || null,
            announcementsEnabled ? 1 : 0,
            rulesEnabled ? 1 : 0,
            ruleApprovalNotificationsEnabled ? 1 : 0,
            emergencyRoleId || null,
            staffRoleId || null,
            embedColor || '#677bae'
        ]);

        // Log the settings update
        await ActivityLogger.log({
            staffUserId: req.user.id,
            actionType: 'update',
            resourceType: 'discord_settings',
            actionDetails: {
                hasAnnouncementChannel: !!announcementChannelId,
                hasRulesChannel: !!rulesChannelId,
                hasStaffNotificationChannel: !!staffNotificationChannelId,
                announcementsEnabled,
                rulesEnabled,
                ruleApprovalNotificationsEnabled,
                timestamp: new Date().toISOString()
            },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            sessionId: req.sessionID,
            success: true
        });

        res.json({ message: 'Discord settings updated successfully' });
    } catch (error) {
        console.error('Error updating Discord settings:', error);
        res.status(500).json({ error: 'Failed to update Discord settings' });
    }
});

// Get available Discord channels
router.get('/channels', requireAuth, requirePermission('admin'), async (req, res) => {
    try {
        const { getInstance: getDiscordBot } = require('../services/discordBot');
        const discordBot = getDiscordBot();

        if (!discordBot || !discordBot.isReady()) {
            return res.status(503).json({ error: 'Discord bot not connected' });
        }

        const channels = await discordBot.getGuildChannels();
        res.json({ channels });
    } catch (error) {
        console.error('Error fetching Discord channels:', error);
        res.status(500).json({ error: 'Failed to fetch Discord channels' });
    }
});

// Test Discord bot integration
router.post('/test', requireAuth, requirePermission('admin'), async (req, res) => {
    try {
        const { type, channelId } = req.body; // type: 'announcements', 'rules', or 'staff-notifications'
        
        if (!type || !['announcements', 'rules', 'staff-notifications'].includes(type)) {
            return res.status(400).json({ error: 'Invalid test type' });
        }

        const db = require('../database/init').getInstance();
        const settings = await db.get('SELECT * FROM discord_settings WHERE id = 1');

        if (!settings) {
            return res.status(404).json({ error: 'Discord settings not configured' });
        }

        // Test bot channel access
        const { getInstance: getDiscordBot } = require('../services/discordBot');
        const discordBot = getDiscordBot();

        if (!discordBot || !discordBot.isReady()) {
            return res.status(503).json({ error: 'Discord bot not connected' });
        }

        let testChannelId;
        if (type === 'announcements') {
            testChannelId = channelId || settings.announcement_channel_id;
        } else if (type === 'rules') {
            testChannelId = channelId || settings.rules_channel_id;
        } else if (type === 'staff-notifications') {
            testChannelId = channelId || settings.staff_notification_channel_id;
        }
        
        if (!testChannelId) {
            return res.status(400).json({ error: `${type.replace('-', ' ')} channel not configured` });
        }

        const result = await discordBot.testChannelAccess(testChannelId, type);

        if (result.success) {
            res.json({ 
                message: `Test message sent successfully to #${result.channelName}!`,
                messageId: result.messageId
            });
        } else {
            res.status(500).json({ 
                error: 'Failed to send test message',
                details: result.error
            });
        }
    } catch (error) {
        console.error('Error testing Discord integration:', error);
        res.status(500).json({ error: 'Failed to test Discord integration' });
    }
});

// Send announcement to Discord
router.post('/announcements/:id/send', requireAuth, requirePermission('moderator'), async (req, res) => {
    try {
        const { id } = req.params;
        const { forceResend = false } = req.body;

        const db = require('../database/init').getInstance();
        
        // Get announcement
        const announcement = await db.get(
            'SELECT * FROM announcements WHERE id = ?',
            [id]
        );

        if (!announcement) {
            return res.status(404).json({ error: 'Announcement not found' });
        }

        // Get Discord settings
        const settings = await db.get('SELECT * FROM discord_settings WHERE id = 1');
        
        if (!settings || !settings.announcements_enabled || !settings.announcement_webhook_url) {
            return res.status(400).json({ error: 'Discord announcements not configured or disabled' });
        }

        // Check if already sent (unless force resend)
        if (!forceResend) {
            const existingSend = await db.get(
                'SELECT * FROM discord_messages WHERE announcement_id = ? AND message_type = "announcement"',
                [id]
            );

            if (existingSend) {
                return res.status(409).json({ 
                    error: 'Announcement already sent to Discord',
                    sentAt: existingSend.sent_at,
                    messageId: existingSend.discord_message_id
                });
            }
        }

        // Create Discord embed
        const embed = createAnnouncementEmbed(announcement, settings);
        
        // Add role mention for high priority announcements
        let content = '';
        if (announcement.priority >= 4 && settings.emergency_role_id) {
            content = `<@&${settings.emergency_role_id}>`;
        }

        // Send to Discord using bot or webhook
        let result;
        const useBotMode = settings.use_bot_instead_of_webhooks === 1;

        if (useBotMode) {
            // Use Discord bot
            const { getInstance: getDiscordBot } = require('../services/discordBot');
            const discordBot = getDiscordBot();

            if (!discordBot || !discordBot.isReady()) {
                return res.status(503).json({ error: 'Discord bot not connected' });
            }

            if (!settings.announcement_channel_id) {
                return res.status(400).json({ error: 'Announcement channel not configured' });
            }

            result = await discordBot.sendAnnouncementToChannel(
                settings.announcement_channel_id,
                announcement,
                settings,
                req.user.username
            );
        } else {
            // Use webhook (legacy mode)
            if (!settings.announcement_webhook_url) {
                return res.status(400).json({ error: 'Announcement webhook not configured' });
            }

            const embed = createAnnouncementEmbed(announcement, settings);
            
            result = await sendDiscordWebhook(settings.announcement_webhook_url, {
                content,
                embeds: [embed]
            });
        }

        if (result.success) {
            // Record the Discord message
            await db.run(`
                INSERT OR REPLACE INTO discord_messages (
                    announcement_id, message_type, discord_message_id,
                    discord_channel_id, webhook_url, delivery_method, sent_by, sent_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `, [
                id, 
                'announcement', 
                result.messageId,
                useBotMode ? settings.announcement_channel_id : null,
                useBotMode ? null : settings.announcement_webhook_url,
                useBotMode ? 'bot' : 'webhook',
                req.user.id
            ]);

            // Log the activity
            await ActivityLogger.log({
                staffUserId: req.user.id,
                actionType: 'send',
                resourceType: 'discord_announcement',
                resourceId: id,
                actionDetails: {
                    announcementTitle: announcement.title,
                    priority: announcement.priority,
                    discordMessageId: result.messageId,
                    deliveryMethod: useBotMode ? 'bot' : 'webhook',
                    channelId: useBotMode ? settings.announcement_channel_id : null,
                    forceResend,
                    timestamp: new Date().toISOString()
                },
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
                sessionId: req.sessionID,
                success: true
            });

            res.json({ 
                message: 'Announcement sent to Discord successfully!',
                messageId: result.messageId,
                method: useBotMode ? 'bot' : 'webhook',
                sentAt: new Date().toISOString()
            });
        } else {
            res.status(500).json({ 
                error: 'Failed to send announcement to Discord',
                details: result.error,
                method: useBotMode ? 'bot' : 'webhook'
            });
        }
    } catch (error) {
        console.error('Error sending announcement to Discord:', error);
        res.status(500).json({ error: 'Failed to send announcement to Discord' });
    }
});

// Get Discord message history
router.get('/messages', requireAuth, requirePermission('moderator'), async (req, res) => {
    try {
        const { limit = 50, offset = 0, filter } = req.query;

        const db = require('../database/init').getInstance();
        
        let query = `
            SELECT 
                dm.*,
                a.title as announcement_title,
                r.full_code as rule_code,
                r.title as rule_title,
                c.name as rule_category_name,
                su.steam_username as sender_username
            FROM discord_messages dm
            LEFT JOIN announcements a ON dm.announcement_id = a.id
            LEFT JOIN rules r ON dm.rule_id = r.id
            LEFT JOIN categories c ON r.category_id = c.id
            LEFT JOIN staff_users su ON dm.sent_by = su.id
        `;
        
        let params = [];
        
        if (filter && filter !== 'all') {
            if (filter === 'announcements') {
                query += ' WHERE dm.message_type = "announcement"';
            } else if (filter === 'rules') {
                query += ' WHERE dm.message_type = "rule"';
            }
        }
        
        query += ' ORDER BY dm.sent_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const messages = await db.all(query, params);

        // Process messages to add computed fields
        const processedMessages = messages.map(message => ({
            ...message,
            title: message.announcement_title || 
                   (message.rule_code ? `${message.rule_code}${message.rule_title ? ` - ${message.rule_title}` : ''}` : null),
            content: message.announcement_title ? null : message.rule_title, // For rules, show title as content
            delivery_status: 'sent', // All messages in DB were successfully sent
            created_at: message.sent_at
        }));

        res.json(processedMessages);
    } catch (error) {
        console.error('Error fetching Discord messages:', error);
        res.status(500).json({ error: 'Failed to fetch Discord messages' });
    }
});

// Send rule update to Discord
router.post('/rules/:id/send', requireAuth, requirePermission('moderator'), async (req, res) => {
    try {
        const { id } = req.params;
        const { action = 'update', forceResend = false } = req.body; // action can be 'create', 'update', 'delete'

        const db = require('../database/init').getInstance();
        
        // Get rule with category information
        const rule = await db.get(`
            SELECT r.*, c.name as category_name, c.letter_code as category_letter_code
            FROM rules r
            LEFT JOIN categories c ON r.category_id = c.id
            WHERE r.id = ?
        `, [id]);

        if (!rule) {
            return res.status(404).json({ error: 'Rule not found' });
        }

        // Get Discord settings
        const settings = await db.get('SELECT * FROM discord_settings WHERE id = 1');
        
        if (!settings || !settings.rules_enabled || !settings.rules_webhook_url) {
            return res.status(400).json({ error: 'Discord rules notifications not configured or disabled' });
        }

        // Only send approved rules to Discord
        if (rule.status && rule.status !== 'approved') {
            return res.status(400).json({ error: 'Only approved rules can be sent to Discord' });
        }

        // Check if already sent (unless force resend)
        if (!forceResend && action !== 'delete') {
            const existingSend = await db.get(
                'SELECT * FROM discord_messages WHERE rule_id = ? AND message_type = "rule"',
                [id]
            );

            if (existingSend) {
                return res.status(409).json({ 
                    error: 'Rule update already sent to Discord',
                    sentAt: existingSend.sent_at,
                    messageId: existingSend.discord_message_id
                });
            }
        }

        // Create Discord embed
        const embed = createRuleEmbed(rule, settings, action);

        // Send to Discord using bot or webhook
        let result;
        const useBotMode = settings.use_bot_instead_of_webhooks === 1;

        if (useBotMode) {
            // Use Discord bot
            const { getInstance: getDiscordBot } = require('../services/discordBot');
            const discordBot = getDiscordBot();

            if (!discordBot || !discordBot.isReady()) {
                return res.status(503).json({ error: 'Discord bot not connected' });
            }

            if (!settings.rules_channel_id) {
                return res.status(400).json({ error: 'Rules channel not configured' });
            }

            result = await discordBot.sendRuleToChannel(
                settings.rules_channel_id,
                rule,
                settings,
                action,
                req.user.username
            );
        } else {
            // Use webhook (legacy mode)
            if (!settings.rules_webhook_url) {
                return res.status(400).json({ error: 'Rules webhook not configured' });
            }

            const embed = createRuleEmbed(rule, settings, action);

            result = await sendDiscordWebhook(settings.rules_webhook_url, {
                embeds: [embed]
            });
        }

        if (result.success) {
            // Record the Discord message (only for create/update, not delete)
            if (action !== 'delete') {
                await db.run(`
                    INSERT OR REPLACE INTO discord_messages (
                        rule_id, message_type, discord_message_id,
                        discord_channel_id, webhook_url, delivery_method, 
                        sent_by, sent_at, action_type
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
                `, [
                    id, 
                    'rule', 
                    result.messageId,
                    useBotMode ? settings.rules_channel_id : null,
                    useBotMode ? null : settings.rules_webhook_url,
                    useBotMode ? 'bot' : 'webhook',
                    req.user.id, 
                    action
                ]);
            }

            // Log the activity
            await ActivityLogger.log({
                staffUserId: req.user.id,
                actionType: 'send',
                resourceType: 'discord_rule',
                resourceId: id,
                actionDetails: {
                    ruleCode: rule.full_code,
                    ruleTitle: rule.title,
                    action: action,
                    discordMessageId: result.messageId,
                    deliveryMethod: useBotMode ? 'bot' : 'webhook',
                    channelId: useBotMode ? settings.rules_channel_id : null,
                    forceResend,
                    timestamp: new Date().toISOString()
                },
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
                sessionId: req.sessionID,
                success: true
            });

            res.json({ 
                message: `Rule ${action} notification sent to Discord successfully!`,
                messageId: result.messageId,
                method: useBotMode ? 'bot' : 'webhook',
                sentAt: new Date().toISOString()
            });
        } else {
            res.status(500).json({ 
                error: 'Failed to send rule notification to Discord',
                details: result.error,
                method: useBotMode ? 'bot' : 'webhook'
            });
        }
    } catch (error) {
        console.error('Error sending rule to Discord:', error);
        res.status(500).json({ error: 'Failed to send rule notification to Discord' });
    }
});

// Helper functions
function isValidDiscordWebhookUrl(url) {
    const webhookRegex = /^https:\/\/(discord|discordapp)\.com\/api\/webhooks\/\d+\/[\w-]+$/;
    return webhookRegex.test(url);
}

async function sendDiscordWebhook(webhookUrl, payload) {
    try {
        console.log('Sending Discord webhook to:', webhookUrl.substring(0, 50) + '...');
        console.log('Payload:', JSON.stringify(payload, null, 2));
        
        const response = await axios.post(webhookUrl, payload, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 10000 // 10 second timeout
        });

        console.log('Discord webhook response status:', response.status);
        console.log('Discord webhook response data:', response.data);

        // Discord webhook success is indicated by 2xx status codes
        // The response may or may not contain an id field depending on the webhook configuration
        if (response.status >= 200 && response.status < 300) {
            const result = {
                success: true,
                messageId: response.data?.id || `webhook_${Date.now()}`, // Generate fallback ID if Discord doesn't provide one
                response: response.data
            };
            console.log('Discord webhook success:', result);
            return result;
        } else {
            const result = {
                success: false,
                error: `HTTP ${response.status}: ${response.statusText}`,
                status: response.status
            };
            console.log('Discord webhook failed (non-2xx status):', result);
            return result;
        }
    } catch (error) {
        console.error('Discord webhook error:', error.response?.data || error.message);
        console.error('Full error object:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message,
            status: error.response?.status
        };
    }
}

function createAnnouncementEmbed(announcement, settings) {
    // Priority colors
    const priorityColors = {
        5: 0xFF0000, // Red - Emergency
        4: 0xFF8C00, // Orange - Critical  
        3: 0xFFD700, // Gold - High
        2: 0x00FF00, // Green - Normal
        1: 0x808080  // Gray - Low
    };

    const priorityLabels = {
        5: '🚨 EMERGENCY',
        4: '⚠️ CRITICAL', 
        3: '📢 HIGH PRIORITY',
        2: '📋 ANNOUNCEMENT',
        1: '💬 INFO'
    };

    const color = priorityColors[announcement.priority] || parseInt(settings.embed_color.replace('#', ''), 16);
    const homepageUrl = dynamicUrls.frontend; // Link to homepage where announcements are displayed

    return {
        title: announcement.title,
        description: announcement.content.length > 2000 
            ? announcement.content.substring(0, 1997) + '...'
            : announcement.content,
        color: color,
        url: homepageUrl, // Make the title clickable to go to homepage
        timestamp: new Date().toISOString(),
        fields: [
            {
                name: '🏷️ Priority',
                value: priorityLabels[announcement.priority] || 'UNKNOWN',
                inline: true
            },
            {
                name: '📅 Created',
                value: new Date(announcement.created_at).toLocaleDateString(),
                inline: true
            },
            {
                name: '🔗 View Announcement',
                value: `[Visit DDG PrisonRP Homepage](${homepageUrl})`,
                inline: false
            }
        ],
        footer: {
            text: 'DigitalDeltaGaming PrisonRP Staff System',
            icon_url: 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/fe/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg'
        }
    };
}

function createRuleEmbed(rule, settings, action) {
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
    const color = config.color;
    
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
                ruleUrl = `${dynamicUrls.frontend}/rules/${category}/${ruleNumber}/${subRuleNumber}`;
            } else {
                // Main rule like "C.7" -> /rules/C/7
                ruleUrl = `${dynamicUrls.frontend}/rules/${category}/${ruleNumber}`;
            }
        } else {
            // Fallback if format is unexpected
            ruleUrl = `${dynamicUrls.frontend}/rules/${rule.full_code}`;
        }
    } else {
        // Fallback to rule ID if no full_code
        ruleUrl = `${dynamicUrls.frontend}/rules/id-${rule.id}`;
    }

    return {
        title: `${config.icon} ${config.title}: ${rule.full_code || `Rule #${rule.id}`}`,
        description: rule.title ? `**${rule.title}**\n\n${rule.content.length > 1800 ? rule.content.substring(0, 1797) + '...' : rule.content}` : (rule.content.length > 2000 ? rule.content.substring(0, 1997) + '...' : rule.content),
        color: color,
        url: ruleUrl, // Direct link to the rule page
        timestamp: new Date().toISOString(),
        fields: [
            {
                name: '📋 Rule Code',
                value: rule.full_code || 'Unknown',
                inline: true
            },
            {
                name: '📂 Category',
                value: `${rule.category_letter_code} - ${rule.category_name}` || 'Unknown',
                inline: true
            },
            {
                name: '📅 Date',
                value: action === 'create' ? new Date(rule.created_at).toLocaleDateString() : new Date().toLocaleDateString(),
                inline: true
            },
            {
                name: '🔗 View Rule',
                value: `[Click here to view ${rule.full_code || `Rule #${rule.id}`}](${ruleUrl})`,
                inline: false
            }
        ],
        footer: {
            text: 'DigitalDeltaGaming PrisonRP Staff System',
            icon_url: 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/fe/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg'
        }
    };
}

module.exports = router; 