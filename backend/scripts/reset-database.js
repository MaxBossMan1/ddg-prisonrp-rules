#!/usr/bin/env node

/**
 * Database Reset Script
 * 
 * This script completely resets the database with the correct Discord schema
 * and adds the hardcoded owner users.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// DDG-specific configuration
const DDG_CONFIG = {
    guildId: '929440166991527946',
    owners: [
        { discordId: '616691120407052291', username: 'maxbossman1' },
        { discordId: '303675233359888384', username: 'owner2' }
    ],
    roles: [
        { roleId: '1241190526296920065', roleName: 'Administrator', permissionLevel: 'admin' },
        { roleId: '929440167012491334', roleName: 'Moderator', permissionLevel: 'moderator' },
        { roleId: '929440166991527955', roleName: 'Editor', permissionLevel: 'editor' }
    ]
};

async function resetDatabase() {
    const dbPath = path.join(__dirname, '..', 'database', 'ddg_prisonrp.db');
    
    console.log('🗑️ Removing existing database...');
    if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
        console.log('   ✅ Database removed');
    }
    
    console.log('🏗️ Creating new database...');
    const db = new sqlite3.Database(dbPath);
    
    // Read and execute schema
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            console.log('📋 Creating tables...');
            
            // Split schema into statements and execute
            const statements = schema.split(';').filter(s => s.trim());
            
            let completedStatements = 0;
            const totalStatements = statements.length;
            
            statements.forEach((statement, index) => {
                if (statement.trim()) {
                    db.run(statement, (err) => {
                        if (err && !err.message.includes('already exists')) {
                            console.error(`Error in statement ${index + 1}:`, err.message);
                        }
                        
                        completedStatements++;
                        
                        // When all schema statements are done, add the data
                        if (completedStatements === totalStatements) {
                            addInitialData(db, resolve, reject);
                        }
                    });
                } else {
                    completedStatements++;
                    if (completedStatements === totalStatements) {
                        addInitialData(db, resolve, reject);
                    }
                }
            });
            
            // Fallback if no statements
            if (totalStatements === 0) {
                addInitialData(db, resolve, reject);
            }
        });
    });
}

function addInitialData(db, resolve, reject) {
    // Add Discord role mappings
    console.log('🎭 Adding Discord role mappings...');
    
    let rolesAdded = 0;
    const totalRoles = DDG_CONFIG.roles.length;
    
    DDG_CONFIG.roles.forEach(role => {
        db.run(`
            INSERT INTO discord_role_mappings 
            (discord_role_id, discord_role_name, permission_level)
            VALUES (?, ?, ?)
        `, [role.roleId, role.roleName, role.permissionLevel], (err) => {
            if (err) {
                console.error('Error adding role mapping:', err);
            } else {
                console.log(`   ✅ Added ${role.roleName} → ${role.permissionLevel}`);
            }
            
            rolesAdded++;
            if (rolesAdded === totalRoles) {
                addOwners(db, resolve, reject);
            }
        });
    });
}

function addOwners(db, resolve, reject) {
    // Add hardcoded owners
    console.log('👑 Adding hardcoded owners...');
    
    let ownersAdded = 0;
    const totalOwners = DDG_CONFIG.owners.length;
    
    DDG_CONFIG.owners.forEach(owner => {
        db.run(`
            INSERT INTO staff_users 
            (discord_id, discord_username, permission_level, is_active, created_at)
            VALUES (?, ?, 'owner', 1, CURRENT_TIMESTAMP)
        `, [owner.discordId, owner.username], (err) => {
            if (err) {
                console.error('Error adding owner:', err);
            } else {
                console.log(`   ✅ Added owner: ${owner.username} (${owner.discordId})`);
            }
            
            ownersAdded++;
            if (ownersAdded === totalOwners) {
                verifySetup(db, resolve, reject);
            }
        });
    });
}

function verifySetup(db, resolve, reject) {
    // Verify setup
    db.get('SELECT COUNT(*) as count FROM staff_users', (err, result) => {
        if (err) {
            console.error('Error verifying users:', err);
            reject(err);
        } else {
            console.log(`\n📊 Database reset complete! ${result.count} users created.`);
            
            db.close((err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        }
    });
}

if (require.main === module) {
    resetDatabase()
        .then(() => {
            console.log('✅ Database reset successful!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Database reset failed:', error);
            process.exit(1);
        });
}

module.exports = { resetDatabase }; 