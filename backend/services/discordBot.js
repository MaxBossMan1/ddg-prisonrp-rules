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