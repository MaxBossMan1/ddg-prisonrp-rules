#!/usr/bin/env node

/**
 * Staff User Management Script
 * 
 * This script helps add staff users to the database.
 * Usage: node scripts/add-staff.js <steam_id> <username> <permission_level>
 * 
 * Example: node scripts/add-staff.js 76561198123456789 "John Doe" admin
 */

require('dotenv').config();

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

async function addStaffUser(steamId, username, permissionLevel) {
    if (!steamId || !username || !permissionLevel) {
        console.error('Usage: node add-staff.js <steam_id> <username> <permission_level>');
        console.error('Permission levels: owner, admin, moderator, editor');
        process.exit(1);
    }

    if (!['owner', 'admin', 'moderator', 'editor'].includes(permissionLevel)) {
        console.error('Invalid permission level. Use: owner, admin, moderator, or editor');
        process.exit(1);
    }

    try {
        const Database = require('../database/init');
        const db = new Database('./database/ddg_prisonrp.db');
        await db.initialize();

        // Check if user already exists
        const existingUser = await db.get(
            'SELECT * FROM staff_users WHERE steam_id = ?',
            [steamId]
        );

        if (existingUser) {
            if (existingUser.is_active) {
                console.log('❌ User already exists and is active');
                console.log(`   Steam ID: ${steamId}`);
                console.log(`   Username: ${existingUser.steam_username}`);
                console.log(`   Permission: ${existingUser.permission_level}`);
                console.log(`   Staff Dashboard: ${dynamicUrls.backend}/staff/${process.env.STAFF_SECRET_URL || 'staff-dashboard-2025'}`);
                await db.close();
                return;
            } else {
                // Reactivate inactive user
                await db.run(
                    'UPDATE staff_users SET steam_username = ?, permission_level = ?, is_active = 1, updated_at = CURRENT_TIMESTAMP WHERE steam_id = ?',
                    [username, permissionLevel, steamId]
                );
                console.log('✅ Reactivated existing user:');
            }
        } else {
            // Create new user
            await db.run(
                'INSERT INTO staff_users (steam_id, steam_username, permission_level, is_active) VALUES (?, ?, ?, 1)',
                [steamId, username, permissionLevel]
            );
            console.log('✅ Created new staff user:');
        }

        console.log(`   Steam ID: ${steamId}`);
        console.log(`   Username: ${username}`);
        console.log(`   Permission Level: ${permissionLevel}`);
        console.log(`   Staff Dashboard: ${dynamicUrls.backend}/staff/${process.env.STAFF_SECRET_URL || 'staff-dashboard-2025'}`);

        await db.close();
    } catch (error) {
        console.error('❌ Error adding staff user:', error);
        process.exit(1);
    }
}

async function listStaffUsers() {
    try {
        const database = new Database(process.env.DATABASE_PATH || './database/ddg_prisonrp.db');
        await database.initialize();

        const users = await database.all(`
            SELECT steam_id, steam_username, permission_level, is_active, created_at, last_login
            FROM staff_users 
            ORDER BY created_at DESC
        `);

        console.log('\n📋 Current Staff Users:');
        console.log('─'.repeat(80));
        
        if (users.length === 0) {
            console.log('No staff users found.');
        } else {
            users.forEach((user, index) => {
                const status = user.is_active ? '✅ Active' : '❌ Inactive';
                const lastLogin = user.last_login ? new Date(user.last_login).toLocaleString() : 'Never';
                
                console.log(`${index + 1}. ${user.steam_username}`);
                console.log(`   Steam ID: ${user.steam_id}`);
                console.log(`   Permission: ${user.permission_level}`);
                console.log(`   Status: ${status}`);
                console.log(`   Last Login: ${lastLogin}`);
                console.log('─'.repeat(40));
            });
        }

        await database.close();
    } catch (error) {
        console.error('Error listing staff users:', error);
        process.exit(1);
    }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === 'list') {
    listStaffUsers();
} else if (args.length === 3) {
    const [steamId, username, permissionLevel] = args;
    addStaffUser(steamId, username, permissionLevel);
} else {
    console.log('DigitalDeltaGaming Staff Management Script');
    console.log('==========================================');
    console.log('');
    console.log('Add a staff user:');
    console.log('  node scripts/add-staff.js <steam_id> <username> <permission_level>');
    console.log('');
    console.log('List all staff users:');
    console.log('  node scripts/add-staff.js list');
    console.log('');
    console.log('Permission levels: owner, admin, moderator, editor');
    console.log('');
    console.log('Example:');
    console.log('  node scripts/add-staff.js 76561198123456789 "John Doe" admin');
} 