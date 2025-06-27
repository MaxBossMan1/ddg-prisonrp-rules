#!/usr/bin/env node

/**
 * DigitalDeltaGaming Discord Role Setup Script
 * 
 * This script sets up the specific Discord roles and hardcoded owners for DDG.
 */

require('dotenv').config();
const Database = require('../database/init');
const { getInstance: getDiscordBot } = require('../services/discordBot');
const fs = require('fs');
const path = require('path');

// DDG-specific configuration
const DDG_CONFIG = {
    guildId: '929440166991527946',
    owners: [
        { discordId: '616691120407052291', username: 'maxbossman1' },
        { discordId: '303675233359888384', username: 'Rexxor' }
    ],
    roles: [
        // Admin roles
        { roleId: '1241190526296920065', roleName: 'Administrator', permissionLevel: 'admin' },
        { roleId: '929440167012491336', roleName: 'Admin Role 2', permissionLevel: 'admin' },
        // Moderator roles  
        { roleId: '929440167012491334', roleName: 'Moderator', permissionLevel: 'moderator' },
        { roleId: '972142128752910346', roleName: 'Moderator Role 2', permissionLevel: 'moderator' },
        // Editor roles
        { roleId: '929440166991527955', roleName: 'Editor', permissionLevel: 'editor' }
    ]
};

async function initializeSystem() {
    try {
        console.log('🚀 Initializing DDG Discord system...');
        
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
                    try {
                        await db.run(statement);
                    } catch (error) {
                        // Ignore errors for existing tables/columns
                        if (!error.message.includes('duplicate column name') && 
                            !error.message.includes('already exists')) {
                            console.warn('Migration warning:', error.message);
                        }
                    }
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

async function setupRoleMappings(db) {
    console.log('\n🎭 Setting up Discord role mappings...');
    
    try {
        // Clear existing mappings
        await db.run('DELETE FROM discord_role_mappings');
        console.log('   🗑️ Cleared existing role mappings');
        
        // Add role mappings
        for (const role of DDG_CONFIG.roles) {
            await db.run(`
                INSERT INTO discord_role_mappings 
                (discord_role_id, discord_role_name, permission_level)
                VALUES (?, ?, ?)
            `, [role.roleId, role.roleName, role.permissionLevel]);
            
            console.log(`   ✅ Added ${role.roleName} → ${role.permissionLevel}`);
        }
        
        console.log('\n✅ Role mappings configured successfully!');
        
    } catch (error) {
        console.error('❌ Failed to setup role mappings:', error);
        throw error;
    }
}

async function setupHardcodedOwners(db, bot) {
    console.log('\n👑 Setting up hardcoded owners...');
    
    try {
        for (const owner of DDG_CONFIG.owners) {
            // Check if user already exists
            const existingUser = await db.get(
                'SELECT * FROM staff_users WHERE discord_id = ?',
                [owner.discordId]
            );
            
            let username = owner.username;
            
            // Try to get real username from Discord if bot is available
            if (bot && bot.isReady()) {
                try {
                    const discordUser = await bot.client.users.fetch(owner.discordId);
                    username = discordUser.username;
                    console.log(`   🔍 Found Discord user: ${username}`);
                } catch (error) {
                    console.warn(`   ⚠️ Could not fetch Discord user ${owner.discordId}: ${error.message}`);
                }
            }
            
            if (existingUser) {
                // Update existing user to owner
                await db.run(`
                    UPDATE staff_users 
                    SET permission_level = 'owner', 
                        discord_username = ?,
                        is_active = 1,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE discord_id = ?
                `, [username, owner.discordId]);
                
                console.log(`   🔄 Updated existing user ${username} to owner`);
            } else {
                // Create new owner user
                await db.run(`
                    INSERT INTO staff_users 
                    (discord_id, discord_username, permission_level, is_active, created_at, last_login)
                    VALUES (?, ?, 'owner', 1, CURRENT_TIMESTAMP, NULL)
                `, [owner.discordId, username]);
                
                console.log(`   ✅ Created new owner user: ${username}`);
            }
            
            // Log the owner setup
            if (bot && bot.isReady()) {
                await bot.logAuthEvent(owner.discordId, 'owner_setup', true, {
                    permissionLevel: 'owner',
                    setupType: 'hardcoded'
                });
            }
        }
        
        console.log('\n✅ Hardcoded owners configured successfully!');
        
    } catch (error) {
        console.error('❌ Failed to setup hardcoded owners:', error);
        throw error;
    }
}

async function testConfiguration(db, bot) {
    console.log('\n🧪 Testing configuration...');
    
    try {
        // Test role mappings
        const roleMappings = await db.all('SELECT * FROM discord_role_mappings');
        console.log(`   📋 Role mappings: ${roleMappings.length} configured`);
        
        roleMappings.forEach(mapping => {
            console.log(`      • ${mapping.discord_role_name} (${mapping.discord_role_id}) → ${mapping.permission_level}`);
        });
        
        // Test owners
        const owners = await db.all('SELECT * FROM staff_users WHERE permission_level = "owner"');
        console.log(`   👑 Owners: ${owners.length} configured`);
        
        owners.forEach(owner => {
            console.log(`      • ${owner.discord_username} (${owner.discord_id})`);
        });
        
        // Test Discord bot connection
        if (bot && bot.isReady()) {
            console.log('   🤖 Discord bot: Connected and ready');
            
            // Test role detection for each owner
            for (const owner of DDG_CONFIG.owners) {
                try {
                    const roles = await bot.getUserRoles(owner.discordId);
                    console.log(`      • ${owner.discordId} has ${roles.length} Discord roles`);
                } catch (error) {
                    console.warn(`      ⚠️ Could not check roles for ${owner.discordId}: ${error.message}`);
                }
            }
        } else {
            console.warn('   ⚠️ Discord bot: Not connected');
        }
        
        console.log('\n✅ Configuration test completed!');
        
    } catch (error) {
        console.error('❌ Configuration test failed:', error);
        throw error;
    }
}

async function displaySummary() {
    console.log('\n📊 DDG Discord Configuration Summary');
    console.log('=====================================');
    console.log(`🏰 Guild ID: ${DDG_CONFIG.guildId}`);
    console.log(`👑 Hardcoded Owners: ${DDG_CONFIG.owners.length}`);
    console.log(`🎭 Role Mappings: ${DDG_CONFIG.roles.length}`);
    console.log('');
    console.log('🎯 Next Steps:');
    console.log('1. Update DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET in .env');
    console.log('2. Start the server: npm run dev');
    console.log('3. Test login: http://localhost:3000/staff/staff-dashboard-2025/dashboard');
    console.log('');
    console.log('🔧 Management Commands:');
    console.log('• node scripts/manage-discord-roles.js list');
    console.log('• node scripts/manage-discord-roles.js test DISCORD_ID');
    console.log('');
}

async function main() {
    console.log('🎮 DigitalDeltaGaming Discord Setup');
    console.log('===================================');
    
    try {
        const { db, bot } = await initializeSystem();
        
        await setupRoleMappings(db);
        await setupHardcodedOwners(db, bot);
        await testConfiguration(db, bot);
        
        displaySummary();
        
        console.log('🎉 DDG Discord setup completed successfully!');
        
    } catch (error) {
        console.error('❌ Setup failed:', error);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

if (require.main === module) {
    main().catch(error => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });
}

module.exports = { DDG_CONFIG, setupRoleMappings, setupHardcodedOwners }; 