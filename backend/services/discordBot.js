const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const Database = require('../database/init');

// DDG-specific hardcoded owners
const DDG_HARDCODED_OWNERS = [
    '616691120407052291', // maxbossman1
    '303675233359888384'  // Rexxor
];

// DDG-specific hardcoded role mappings
const DDG_HARDCODED_ROLES = {
    // Admin roles
    '1241190526296920065': 'admin', // Administrator  
    '929440167012491336': 'admin',  // Admin Role 2
    // Moderator roles
    '929440167012491334': 'moderator', // Moderator
    '972142128752910346': 'moderator', // Moderator Role 2
    // Editor roles
    '929440166991527955': 'editor'   // Editor
};

class DiscordBotService {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.guildId = process.env.DISCORD_GUILD_ID;
        this.botToken = process.env.DISCORD_BOT_TOKEN;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }

    async initialize() {
        if (!this.botToken) {
            console.error('🚨 Discord Bot Token not provided. Role checking will be disabled.');
            return false;
        }

        if (!this.guildId) {
            console.error('🚨 Discord Guild ID not provided. Role checking will be disabled.');
            return false;
        }

        try {
            this.client = new Client({
                intents: [
                    GatewayIntentBits.Guilds,
                    GatewayIntentBits.GuildMembers
                ]
            });

            this.client.on('ready', () => {
                console.log('🤖 Discord Bot connected successfully!');
                console.log(`   Logged in as: ${this.client.user.tag}`);
                console.log(`   Connected to guild: ${this.guildId}`);
                this.isConnected = true;
                this.reconnectAttempts = 0;
            });

            this.client.on('error', (error) => {
                console.error('🚨 Discord Bot error:', error);
                this.isConnected = false;
            });

            this.client.on('disconnect', () => {
                console.warn('⚠️ Discord Bot disconnected');
                this.isConnected = false;
                this.handleReconnect();
            });

            await this.client.login(this.botToken);
            return true;
        } catch (error) {
            console.error('🚨 Failed to initialize Discord Bot:', error);
            return false;
        }
    }

    async handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`🔄 Attempting to reconnect Discord Bot (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            
            setTimeout(async () => {
                try {
                    await this.initialize();
                } catch (error) {
                    console.error('🚨 Discord Bot reconnection failed:', error);
                }
            }, 5000 * this.reconnectAttempts); // Exponential backoff
        } else {
            console.error('🚨 Max Discord Bot reconnection attempts reached. Manual restart required.');
        }
    }

    async getUserRoles(discordId) {
        if (!this.isConnected || !this.client) {
            console.warn('⚠️ Discord Bot not connected. Cannot check user roles.');
            return [];
        }

        try {
            const guild = await this.client.guilds.fetch(this.guildId);
            const member = await guild.members.fetch(discordId);
            
            if (!member) {
                console.log(`User ${discordId} not found in guild ${this.guildId}`);
                return [];
            }

            // Get role IDs and names
            const roles = member.roles.cache.map(role => ({
                id: role.id,
                name: role.name,
                color: role.hexColor,
                position: role.position
            }));

            console.log(`🔍 User ${member.user.username} roles:`, roles.map(r => r.name));
            return roles;
        } catch (error) {
            console.error('🚨 Error fetching user roles:', error);
            return [];
        }
    }

    async determinePermissionLevel(discordId) {
        try {
            // Check for hardcoded owners first
            if (DDG_HARDCODED_OWNERS.includes(discordId)) {
                console.log(`👑 User ${discordId} is a hardcoded owner`);
                
                await this.logAuthEvent(discordId, 'permission_check', true, {
                    permissionLevel: 'owner',
                    grantedByRule: 'hardcoded_owner'
                });
                
                return 'owner';
            }

            const roles = await this.getUserRoles(discordId);
            const roleIds = roles.map(r => r.id);

            // Check hardcoded roles first (priority order: admin > moderator > editor)
            const permissionOrder = ['admin', 'moderator', 'editor'];
            
            for (const permission of permissionOrder) {
                for (const roleId of roleIds) {
                    if (DDG_HARDCODED_ROLES[roleId] === permission) {
                        const roleName = roles.find(r => r.id === roleId)?.name || `Role ${roleId}`;
                        console.log(`✅ User ${discordId} granted ${permission} permission via hardcoded role ${roleName}`);
                        
                        // Log the permission check
                        await this.logAuthEvent(discordId, 'permission_check', true, {
                            roles: roleIds,
                            permissionLevel: permission,
                            grantedByRole: roleName,
                            grantedByRuleType: 'hardcoded'
                        });
                        
                        return permission;
                    }
                }
            }

            console.log(`❌ User ${discordId} has no matching hardcoded roles for staff permissions`);
            
            // Log the failed permission check
            await this.logAuthEvent(discordId, 'permission_check', false, {
                roles: roleIds,
                reason: 'No matching hardcoded staff roles found'
            });
            
            return null;
        } catch (error) {
            console.error('🚨 Error determining permission level:', error);
            return null;
        }
    }

    async syncUserRoles(discordId) {
        try {
            const roles = await this.getUserRoles(discordId);
            const roleIds = roles.map(r => r.id);
            const permissionLevel = await this.determinePermissionLevel(discordId);

            const db = Database.getInstance();
            if (!db) {
                console.error('🚨 Database not available for role sync');
                return false;
            }

            // Update user's roles and permission level in database
            await db.run(`
                UPDATE staff_users 
                SET discord_roles = ?, permission_level = ?, updated_at = CURRENT_TIMESTAMP
                WHERE discord_id = ?
            `, [JSON.stringify(roleIds), permissionLevel || 'none', discordId]);

            console.log(`🔄 Synced roles for user ${discordId}: ${roles.map(r => r.name).join(', ')}`);
            
            await this.logAuthEvent(discordId, 'role_sync', true, {
                roles: roleIds,
                permissionLevel: permissionLevel
            });

            return true;
        } catch (error) {
            console.error('🚨 Error syncing user roles:', error);
            return false;
        }
    }

    async logAuthEvent(discordId, actionType, success, details = {}) {
        try {
            const db = Database.getInstance();
            if (!db) return;

            // Get user info if available
            let discordUsername = 'Unknown';
            if (this.isConnected && this.client) {
                try {
                    const user = await this.client.users.fetch(discordId);
                    discordUsername = user.username;
                } catch (e) {
                    // Ignore error, keep default username
                }
            }

            await db.run(`
                INSERT INTO discord_auth_logs 
                (discord_id, discord_username, action_type, success, roles_at_time, 
                 permission_level_granted, error_message, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `, [
                discordId,
                discordUsername,
                actionType,
                success ? 1 : 0,
                details.roles ? JSON.stringify(details.roles) : null,
                details.permissionLevel || null,
                details.reason || details.error || null
            ]);
        } catch (error) {
            console.error('🚨 Error logging auth event:', error);
        }
    }

    async sendAuthNotification(discordId, action, success, details = {}) {
        try {
            const db = Database.getInstance();
            if (!db) return;

            // Get log channel from settings
            const botSettings = await db.get('SELECT log_channel_id FROM discord_bot_settings WHERE guild_id = ?', [this.guildId]);
            
            if (!botSettings || !botSettings.log_channel_id || !this.isConnected) {
                return; // No log channel configured or bot not connected
            }

            const channel = await this.client.channels.fetch(botSettings.log_channel_id);
            if (!channel) return;

            const user = await this.client.users.fetch(discordId);
            const embed = new EmbedBuilder()
                .setTitle(`Staff Authentication: ${action}`)
                .setDescription(`User: ${user.username} (${discordId})`)
                .setColor(success ? 0x00FF00 : 0xFF0000)
                .setTimestamp()
                .addFields([
                    { name: 'Action', value: action, inline: true },
                    { name: 'Success', value: success ? 'Yes' : 'No', inline: true },
                    { name: 'Permission Level', value: details.permissionLevel || 'None', inline: true }
                ]);

            if (details.roles && details.roles.length > 0) {
                embed.addFields([
                    { name: 'Roles', value: details.roles.join(', '), inline: false }
                ]);
            }

            await channel.send({ embeds: [embed] });
        } catch (error) {
            console.error('🚨 Error sending auth notification:', error);
        }
    }

    async sendAnnouncementToChannel(channelId, announcement, settings, sentByUsername) {
        try {
            if (!this.isConnected || !this.client) {
                throw new Error('Discord bot not connected');
            }

            const channel = await this.client.channels.fetch(channelId);
            if (!channel) {
                throw new Error(`Channel ${channelId} not found`);
            }

            // Priority colors and labels
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

            const color = priorityColors[announcement.priority] || parseInt(settings.embed_color?.replace('#', '') || '677bae', 16);

            const embed = new EmbedBuilder()
                .setTitle(announcement.title)
                .setDescription(announcement.content.length > 2000 
                    ? announcement.content.substring(0, 1997) + '...'
                    : announcement.content)
                .setColor(color)
                .setTimestamp()
                .addFields([
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
                        name: '👤 Sent By',
                        value: sentByUsername || 'System',
                        inline: true
                    }
                ])
                .setFooter({
                    text: 'DigitalDeltaGaming PrisonRP Staff System',
                    iconURL: 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/fe/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg'
                });

            // Add role mention for high priority announcements
            let content = '';
            if (announcement.priority >= 4 && settings.emergency_role_id) {
                content = `<@&${settings.emergency_role_id}>`;
            }

            const message = await channel.send({ 
                content: content || undefined,
                embeds: [embed] 
            });

            return {
                success: true,
                messageId: message.id,
                channelId: channel.id
            };
        } catch (error) {
            console.error('🚨 Error sending announcement to Discord channel:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async sendRuleToChannel(channelId, rule, settings, action = 'update', sentByUsername, previousContent = null) {
        try {
            if (!this.isConnected || !this.client) {
                throw new Error('Discord bot not connected');
            }

            const channel = await this.client.channels.fetch(channelId);
            if (!channel) {
                throw new Error(`Channel ${channelId} not found`);
            }

            // Get dynamic URLs
            const getDynamicUrls = () => {
                const baseUrl = process.env.NODE_ENV === 'production' 
                    ? (process.env.FRONTEND_URL || 'https://ddg-motd.web.app')
                    : 'http://localhost:3000';
                
                return {
                    frontend: baseUrl
                };
            };
            const dynamicUrls = getDynamicUrls();

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
                approved: {
                    color: 0x2ecc71, // Bright Green
                    icon: '✅',
                    title: 'Rule Approved'
                },
                rejected: {
                    color: 0x95a5a6, // Gray
                    icon: '❌',
                    title: 'Rule Rejected'
                },
                delete: {
                    color: 0xe74c3c, // Red
                    icon: '🗑️',
                    title: 'Rule Deleted'
                }
            };

            const config = actionConfig[action] || actionConfig.update;

            // Determine author - prefer rule creator over current user
            let authorName = 'System';
            if (rule.created_by_username) {
                authorName = rule.created_by_username;
            } else if (sentByUsername && sentByUsername !== 'System') {
                authorName = sentByUsername;
            }

            const embed = new EmbedBuilder()
                .setTitle(`${config.icon} ${config.title}: ${rule.full_code || `Rule #${rule.id}`}`)
                .setDescription(rule.title ? `**${rule.title}**\n\n${rule.content.substring(0, 200)}...` : rule.content.substring(0, 300) + '...')
                .setColor(config.color)
                .setURL(ruleUrl) // Make the title clickable
                .setTimestamp()
                .addFields([
                    {
                        name: '📋 Category',
                        value: `${rule.category_letter_code || 'N/A'} - ${rule.category_name || 'Uncategorized'}`,
                        inline: true
                    },
                    {
                        name: '👤 Author',
                        value: authorName,
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
                ])
                .setFooter({
                    text: 'DDG PrisonRP Rules System'
                });

            // Add change information for updates
            if (action === 'update' && previousContent && previousContent !== rule.content) {
                // Simple change detection - could be enhanced with more sophisticated diff
                const changeInfo = `📝 **What Changed:**\nRule content has been updated. [View full rule](${ruleUrl}) for complete details.`;
                
                // Add change field
                embed.addFields([
                    {
                        name: '🔄 Changes Made',
                        value: changeInfo,
                        inline: false
                    }
                ]);
            }

            const message = await channel.send({ embeds: [embed] });

            return {
                success: true,
                messageId: message.id,
                channelId: channel.id
            };
        } catch (error) {
            console.error('🚨 Error sending rule to Discord channel:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getGuildChannels() {
        try {
            if (!this.isConnected || !this.client) {
                throw new Error('Discord bot not connected');
            }

            const guild = await this.client.guilds.fetch(this.guildId);
            if (!guild) {
                throw new Error(`Guild ${this.guildId} not found`);
            }

            const channels = await guild.channels.fetch();
            
            // Filter to text channels only and format for frontend
            const textChannels = channels
                .filter(channel => channel.type === 0) // TEXT channel type
                .map(channel => ({
                    id: channel.id,
                    name: channel.name,
                    parentId: channel.parentId,
                    parentName: channel.parent?.name || null,
                    position: channel.position
                }))
                .sort((a, b) => a.position - b.position);

            return textChannels;
        } catch (error) {
            console.error('🚨 Error fetching guild channels:', error);
            throw error;
        }
    }

    async testChannelAccess(channelId, testType = 'general') {
        try {
            if (!this.isConnected || !this.client) {
                throw new Error('Discord bot not connected');
            }

            const channel = await this.client.channels.fetch(channelId);
            if (!channel) {
                throw new Error(`Channel ${channelId} not found`);
            }

            // Check if bot has permission to send messages
            const permissions = channel.permissionsFor(this.client.user);
            if (!permissions.has('SendMessages')) {
                throw new Error(`Bot does not have permission to send messages in #${channel.name}`);
            }

            // Create test embed based on test type
            let embed;
            if (testType === 'announcements') {
                embed = new EmbedBuilder()
                    .setTitle('📢 DDG PrisonRP Announcements Test')
                    .setDescription('This is a test message for the announcements channel.\n\nBot integration is working correctly!')
                    .setColor(0x3498db)
                    .setTimestamp()
                    .setFooter({
                        text: 'DDG PrisonRP Staff System Test'
                    });
            } else if (testType === 'rules') {
                embed = new EmbedBuilder()
                    .setTitle('📋 DDG PrisonRP Rules Test')
                    .setDescription('This is a test message for the rules channel.\n\nBot integration is working correctly!')
                    .setColor(0x9b59b6)
                    .setTimestamp()
                    .setFooter({
                        text: 'DDG PrisonRP Staff System Test'
                    });
            } else if (testType === 'staff-notifications') {
                embed = new EmbedBuilder()
                    .setTitle('🔔 DDG PrisonRP Staff Notifications Test')
                    .setDescription('This is a test message for staff notifications.\n\nThis channel will receive notifications when rules need approval.')
                    .setColor(0xe67e22)
                    .setTimestamp()
                    .setFooter({
                        text: 'DDG PrisonRP Staff System Test'
                    });
            } else {
                embed = new EmbedBuilder()
                    .setTitle('🧪 DDG PrisonRP Bot Test')
                    .setDescription('This is a test message from the DDG PrisonRP staff system.\n\nBot integration is working correctly!')
                    .setColor(0x677bae)
                    .setTimestamp()
                    .setFooter({
                        text: 'DDG PrisonRP Staff System Test'
                    });
            }

            const message = await channel.send({ embeds: [embed] });

            return {
                success: true,
                messageId: message.id,
                channelName: channel.name
            };
        } catch (error) {
            console.error('🚨 Error testing channel access:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async sendRuleApprovalNotification(staffChannelId, rule, settings, staffRoleId) {
        try {
            if (!this.isConnected || !this.client) {
                throw new Error('Discord bot not connected');
            }

            const channel = await this.client.channels.fetch(staffChannelId);
            if (!channel) {
                throw new Error(`Staff notification channel ${staffChannelId} not found`);
            }

            const embed = new EmbedBuilder()
                .setTitle('🔔 Rule Awaiting Approval')
                .setDescription(`**${rule.title || 'Untitled Rule'}**\n\n${rule.content.substring(0, 300)}${rule.content.length > 300 ? '...' : ''}`)
                .setColor(0xe67e22) // Orange color for notifications
                .setTimestamp()
                .addFields([
                    {
                        name: '📋 Category',
                        value: `${rule.category_letter_code || 'N/A'} - ${rule.category_name || 'Uncategorized'}`,
                        inline: true
                    },
                    {
                        name: '👤 Created By',
                        value: rule.created_by_username || 'Unknown',
                        inline: true
                    },
                    {
                        name: '📅 Created',
                        value: new Date(rule.created_at).toLocaleDateString(),
                        inline: true
                    }
                ])
                .setFooter({
                    text: 'DDG PrisonRP Staff System - Rule Approval Needed'
                });

            // Add staff role mention if provided
            let content = '';
            if (staffRoleId) {
                content = `<@&${staffRoleId}> A new rule needs your review and approval!`;
            }

            const message = await channel.send({ 
                content: content || undefined,
                embeds: [embed] 
            });

            return {
                success: true,
                messageId: message.id,
                channelId: channel.id
            };
        } catch (error) {
            console.error('🚨 Error sending rule approval notification:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async updateRoleMappings(mappings) {
        try {
            const db = Database.getInstance();
            if (!db) {
                console.error('🚨 Database not available for updating role mappings');
                return false;
            }

            // Clear existing mappings
            await db.run('DELETE FROM discord_role_mappings');

            // Insert new mappings
            for (const mapping of mappings) {
                await db.run(`
                    INSERT INTO discord_role_mappings 
                    (discord_role_id, discord_role_name, permission_level)
                    VALUES (?, ?, ?)
                `, [mapping.roleId, mapping.roleName, mapping.permissionLevel]);
            }

            console.log('✅ Discord role mappings updated successfully');
            return true;
        } catch (error) {
            console.error('🚨 Error updating role mappings:', error);
            return false;
        }
    }

    isReady() {
        return this.isConnected && this.client && this.client.isReady();
    }

    async destroy() {
        if (this.client) {
            await this.client.destroy();
            this.isConnected = false;
            console.log('🤖 Discord Bot disconnected');
        }
    }
}

// Export singleton instance
let discordBotInstance = null;

module.exports = {
    getInstance: () => {
        if (!discordBotInstance) {
            discordBotInstance = new DiscordBotService();
        }
        return discordBotInstance;
    },
    DiscordBotService,
    DDG_HARDCODED_OWNERS
}; 