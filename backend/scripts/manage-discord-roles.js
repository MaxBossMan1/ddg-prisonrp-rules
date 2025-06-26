#!/usr/bin/env node

/**
 * Discord Role Management Script
 * 
 * This script helps manage Discord role mappings for the staff system.
 * 
 * Usage:
 *   node scripts/manage-discord-roles.js list                    # List current role mappings
 *   node scripts/manage-discord-roles.js add <roleId> <roleName> <permissionLevel>
 *   node scripts/manage-discord-roles.js remove <roleId>
 *   node scripts/manage-discord-roles.js sync                    # Sync all current staff users
 *   node scripts/manage-discord-roles.js test <discordId>        # Test permission check for user
 */

require('dotenv').config();
const Database = require('../database/init');
const { getInstance: getDiscordBot } = require('../services/discordBot');
const fs = require('fs');
const path = require('path');

async function initializeSystem() {
    try {
        // Initialize database
        const database = new Database(process.env.DATABASE_PATH || './database/ddg_prisonrp.db');
        const db = await database.initialize();
        Database.setInstance(database);
        
        // Run migration if needed
        const migrationPath = path.join(__dirname, '..', 'database', 'migration-steam-to-discord.sql');
        if (fs.existsSync(migrationPath)) {
            console.log('🔄 Running Discord migration...');
            const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
            
            // Split by semicolon and execute each statement
            const statements = migrationSQL.split(';').filter(s => s.trim());
            for (const statement of statements) {
                if (statement.trim()) {
                    await db.run(statement);
                }
            }
            console.log('✅ Migration completed');
        }
        
        // Initialize Discord bot
        const discordBot = getDiscordBot();
        await discordBot.initialize();
        
        return { db: database, bot: discordBot };
    } catch (error) {
        console.error('❌ Failed to initialize system:', error);
        process.exit(1);
    }
}

async function listRoleMappings(db) {
    console.log('\n📋 Current Discord Role Mappings:');
    console.log('=====================================');
    
    const mappings = await db.all(`
        SELECT * FROM discord_role_mappings 
        ORDER BY 
            CASE permission_level
                WHEN 'owner' THEN 1
                WHEN 'admin' THEN 2
                WHEN 'moderator' THEN 3
                WHEN 'editor' THEN 4
                ELSE 5
            END
    `);
    
    if (mappings.length === 0) {
        console.log('❌ No role mappings found!');
        console.log('\nTo add role mappings, use:');
        console.log('  node scripts/manage-discord-roles.js add <roleId> <roleName> <permissionLevel>');
        return;
    }
    
    mappings.forEach((mapping, index) => {
        const levelEmoji = {
            'owner': '👑',
            'admin': '🛡️',
            'moderator': '⚖️',
            'editor': '✏️'
        };
        
        console.log(`${index + 1}. ${levelEmoji[mapping.permission_level] || '❓'} ${mapping.discord_role_name}`);
        console.log(`   Role ID: ${mapping.discord_role_id}`);
        console.log(`   Permission: ${mapping.permission_level}`);
        console.log(`   Created: ${mapping.created_at}`);
        console.log('');
    });
    
    console.log('💡 To get Discord role IDs, enable Developer Mode in Discord,');
    console.log('   right-click a role, and select "Copy ID"');
}

async function addRoleMapping(db, roleId, roleName, permissionLevel) {
    const validLevels = ['owner', 'admin', 'moderator', 'editor'];
    
    if (!validLevels.includes(permissionLevel)) {
        console.error(`❌ Invalid permission level: ${permissionLevel}`);
        console.error(`   Valid levels: ${validLevels.join(', ')}`);
        return;
    }
    
    try {
        await db.run(`
            INSERT OR REPLACE INTO discord_role_mappings 
            (discord_role_id, discord_role_name, permission_level)
            VALUES (?, ?, ?)
        `, [roleId, roleName, permissionLevel]);
        
        console.log('✅ Role mapping added successfully!');
        console.log(`   Role: ${roleName} (${roleId})`);
        console.log(`   Permission Level: ${permissionLevel}`);
        
    } catch (error) {
        console.error('❌ Failed to add role mapping:', error);
    }
}

async function removeRoleMapping(db, roleId) {
    try {
        const mapping = await db.get('SELECT * FROM discord_role_mappings WHERE discord_role_id = ?', [roleId]);
        
        if (!mapping) {
            console.error(`❌ Role mapping not found for ID: ${roleId}`);
            return;
        }
        
        await db.run('DELETE FROM discord_role_mappings WHERE discord_role_id = ?', [roleId]);
        
        console.log('✅ Role mapping removed successfully!');
        console.log(`   Removed: ${mapping.discord_role_name} (${mapping.permission_level})`);
        
        // Note about existing users
        console.log('\n⚠️ Note: Existing users will keep their current permissions until');
        console.log('   they log in again or roles are manually synced.');
        
    } catch (error) {
        console.error('❌ Failed to remove role mapping:', error);
    }
}

async function syncAllUsers(db, bot) {
    console.log('🔄 Syncing all staff users with Discord roles...');
    
    const users = await db.all(`
        SELECT id, discord_id, discord_username, permission_level 
        FROM staff_users 
        WHERE discord_id IS NOT NULL AND is_active = 1
    `);
    
    if (users.length === 0) {
        console.log('❌ No Discord users found to sync');
        return;
    }
    
    console.log(`Found ${users.length} users to sync:`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (const user of users) {
        try {
            console.log(`\n🔍 Syncing ${user.discord_username || 'Unknown'} (${user.discord_id})...`);
            
            if (!bot || !bot.isReady()) {
                console.error('❌ Discord bot not available');
                failCount++;
                continue;
            }
            
            const currentPermission = user.permission_level;
            const newPermission = await bot.determinePermissionLevel(user.discord_id);
            
            if (!newPermission) {
                console.log(`   ❌ No matching roles found - user should be deactivated`);
                
                // Optionally deactivate user
                await db.run('UPDATE staff_users SET is_active = 0 WHERE id = ?', [user.id]);
                console.log('   📴 User deactivated');
                failCount++;
                continue;
            }
            
            if (newPermission !== currentPermission) {
                console.log(`   🔄 Permission changed: ${currentPermission} → ${newPermission}`);
                
                await db.run(`
                    UPDATE staff_users 
                    SET permission_level = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `, [newPermission, user.id]);
            } else {
                console.log(`   ✅ Permission unchanged: ${currentPermission}`);
            }
            
            // Sync roles
            await bot.syncUserRoles(user.discord_id);
            successCount++;
            
        } catch (error) {
            console.error(`   ❌ Error syncing user ${user.discord_id}:`, error.message);
            failCount++;
        }
    }
    
    console.log(`\n📊 Sync Results:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   📊 Total: ${users.length}`);
}

async function testUser(db, bot, discordId) {
    console.log(`🧪 Testing permission check for Discord user: ${discordId}`);
    console.log('=' .repeat(50));
    
    try {
        if (!bot || !bot.isReady()) {
            console.error('❌ Discord bot not available');
            return;
        }
        
        // Get user roles
        const roles = await bot.getUserRoles(discordId);
        console.log(`\n👤 User Roles (${roles.length}):`);
        roles.forEach(role => {
            console.log(`   • ${role.name} (${role.id})`);
        });
        
        // Check permission level
        const permissionLevel = await bot.determinePermissionLevel(discordId);
        console.log(`\n🔑 Determined Permission Level: ${permissionLevel || 'None'}`);
        
        // Check database
        const dbUser = await db.get('SELECT * FROM staff_users WHERE discord_id = ?', [discordId]);
        if (dbUser) {
            console.log(`\n💾 Database Record:`);
            console.log(`   Username: ${dbUser.discord_username}`);
            console.log(`   Current Permission: ${dbUser.permission_level}`);
            console.log(`   Active: ${dbUser.is_active ? 'Yes' : 'No'}`);
            console.log(`   Last Login: ${dbUser.last_login || 'Never'}`);
        } else {
            console.log(`\n💾 Database Record: Not found`);
        }
        
        // Show current role mappings
        console.log(`\n🗺️ Current Role Mappings:`);
        const mappings = await db.all('SELECT * FROM discord_role_mappings ORDER BY permission_level');
        mappings.forEach(mapping => {
            const hasRole = roles.some(r => r.id === mapping.discord_role_id);
            console.log(`   ${hasRole ? '✅' : '❌'} ${mapping.discord_role_name} → ${mapping.permission_level}`);
        });
        
    } catch (error) {
        console.error('❌ Error testing user:', error);
    }
}

async function main() {
    const [,, command, ...args] = process.argv;
    
    if (!command) {
        console.log('Discord Role Management Script');
        console.log('=============================');
        console.log('');
        console.log('Available commands:');
        console.log('  list                                   List current role mappings');
        console.log('  add <roleId> <roleName> <permission>   Add role mapping');
        console.log('  remove <roleId>                        Remove role mapping');
        console.log('  sync                                   Sync all staff users');
        console.log('  test <discordId>                       Test user permissions');
        console.log('');
        console.log('Permission levels: owner, admin, moderator, editor');
        console.log('');
        console.log('Examples:');
        console.log('  node scripts/manage-discord-roles.js list');
        console.log('  node scripts/manage-discord-roles.js add 123456789 "Administrator" admin');
        console.log('  node scripts/manage-discord-roles.js test 987654321');
        process.exit(0);
    }
    
    const { db, bot } = await initializeSystem();
    
    try {
        switch (command) {
            case 'list':
                await listRoleMappings(db);
                break;
                
            case 'add':
                const [roleId, roleName, permissionLevel] = args;
                if (!roleId || !roleName || !permissionLevel) {
                    console.error('❌ Usage: add <roleId> <roleName> <permissionLevel>');
                    process.exit(1);
                }
                await addRoleMapping(db, roleId, roleName, permissionLevel);
                break;
                
            case 'remove':
                const [removeRoleId] = args;
                if (!removeRoleId) {
                    console.error('❌ Usage: remove <roleId>');
                    process.exit(1);
                }
                await removeRoleMapping(db, removeRoleId);
                break;
                
            case 'sync':
                await syncAllUsers(db, bot);
                break;
                
            case 'test':
                const [testUserId] = args;
                if (!testUserId) {
                    console.error('❌ Usage: test <discordId>');
                    process.exit(1);
                }
                await testUser(db, bot, testUserId);
                break;
                
            default:
                console.error(`❌ Unknown command: ${command}`);
                console.error('Run without arguments to see available commands');
                process.exit(1);
        }
    } catch (error) {
        console.error('❌ Command failed:', error);
        process.exit(1);
    } finally {
        if (bot) {
            await bot.destroy();
        }
        process.exit(0);
    }
}

if (require.main === module) {
    main().catch(error => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });
} 