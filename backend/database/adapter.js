const fs = require('fs');
const path = require('path');

class DatabaseAdapter {
    constructor() {
        this.db = null;
        this.dbType = process.env.DATABASE_TYPE || 'sqlite';
        
        if (this.dbType === 'postgres') {
            this.pg = require('pg');
        } else {
            this.sqlite3 = require('sqlite3').verbose();
        }
    }

    async initialize() {
        try {
            if (this.dbType === 'postgres') {
                await this.initializePostgreSQL();
            } else {
                await this.initializeSQLite();
            }

            await this.createTables();
            await this.runMigrations();
            await this.insertDefaultData();

            console.log(`Database (${this.dbType}) initialized successfully`);
            return this.db;
        } catch (error) {
            console.error('Database initialization failed:', error);
            throw error;
        }
    }

    async initializePostgreSQL() {
        const connectionString = process.env.DATABASE_URL || 
            `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
        
        this.db = new this.pg.Pool({
            connectionString,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });

        // Test connection
        await this.db.query('SELECT NOW()');
        console.log('Connected to PostgreSQL database');
    }

    async initializeSQLite() {
        const dbPath = process.env.DATABASE_PATH || './database/ddg_prisonrp.db';
        const dbDir = path.dirname(dbPath);
        
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }

        this.db = new this.sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err.message);
                throw err;
            }
            console.log('Connected to SQLite database:', dbPath);
        });

        // Enable foreign keys for SQLite
        await this.run('PRAGMA foreign_keys = ON');
    }

    async createTables() {
        let schemaPath;
        
        if (this.dbType === 'postgres') {
            schemaPath = path.join(__dirname, 'schema-postgres.sql');
        } else {
            schemaPath = path.join(__dirname, 'schema.sql');
        }
        
        const schema = fs.readFileSync(schemaPath, 'utf8');
        const statements = schema.split(';').filter(stmt => stmt.trim());
        
        for (const statement of statements) {
            if (statement.trim()) {
                await this.run(statement);
            }
        }
        
        console.log('Database tables created successfully');
    }

    async runMigrations() {
        try {
            if (this.dbType === 'postgres') {
                await this.runPostgreSQLMigrations();
            } else {
                await this.runSQLiteMigrations();
            }
        } catch (error) {
            console.error('Migration error:', error);
            // Don't throw here, let the app continue
        }
    }

    async runSQLiteMigrations() {
        try {
            // Migration: Add color column to categories if it doesn't exist
            try {
                await this.run('ALTER TABLE categories ADD COLUMN color VARCHAR(7) DEFAULT "#3498db"');
                console.log('Migration: Added color column to categories');
            } catch (error) {
                if (error.message.includes('duplicate column name')) {
                    console.log('Color column already exists in categories table');
                } else {
                    console.error('Unexpected error adding color column:', error.message);
                }
            }

            // Migration: Add is_active column to categories if it doesn't exist
            try {
                await this.run('ALTER TABLE categories ADD COLUMN is_active BOOLEAN DEFAULT 1');
                console.log('Migration: Added is_active column to categories');
            } catch (error) {
                if (error.message.includes('duplicate column name')) {
                    console.log('is_active column already exists in categories table');
                } else {
                    console.error('Unexpected error adding is_active column:', error.message);
                }
            }

            // Migration: Add action_type column to discord_messages if it doesn't exist
            try {
                await this.run('ALTER TABLE discord_messages ADD COLUMN action_type TEXT');
                console.log('Migration: Added action_type column to discord_messages');
            } catch (error) {
                if (error.message.includes('duplicate column name')) {
                    console.log('action_type column already exists in discord_messages table');
                } else {
                    console.error('Unexpected error adding action_type column:', error.message);
                }
            }

            // Migration: Add UNIQUE constraint to discord_id column in staff_users
            try {
                // Check current table structure
                const tableInfo = await this.all('PRAGMA table_info(staff_users)');
                const discordIdColumn = tableInfo.find(col => col.name === 'discord_id');
                
                // Check if UNIQUE constraint already exists using reliable methods
                let hasUniqueConstraint = false;
                
                if (discordIdColumn) {
                    // Method 1: Check for unique indexes on discord_id
                    const indexes = await this.all('PRAGMA index_list(staff_users)');
                    for (const index of indexes) {
                        if (index.unique === 1) {
                            const indexInfo = await this.all(`PRAGMA index_info(${index.name})`);
                            if (indexInfo.some(col => col.name === 'discord_id')) {
                                hasUniqueConstraint = true;
                                console.log('discord_id UNIQUE constraint already exists (via unique index) in staff_users table');
                                break;
                            }
                        }
                    }
                    
                    // Method 2: Check table schema for UNIQUE constraints in CREATE TABLE statement
                    if (!hasUniqueConstraint) {
                        try {
                            const schemaResult = await this.all(
                                "SELECT sql FROM sqlite_master WHERE type='table' AND name='staff_users'"
                            );
                            
                            if (schemaResult.length > 0 && schemaResult[0].sql) {
                                const createTableSql = schemaResult[0].sql.toUpperCase();
                                // Check if discord_id column has UNIQUE constraint in the table definition
                                if (createTableSql.includes('DISCORD_ID') && 
                                    (createTableSql.includes('DISCORD_ID TEXT UNIQUE') || 
                                     createTableSql.includes('DISCORD_ID UNIQUE') ||
                                     createTableSql.includes('UNIQUE(DISCORD_ID)') ||
                                     createTableSql.includes('UNIQUE (DISCORD_ID)'))) {
                                    hasUniqueConstraint = true;
                                    console.log('discord_id UNIQUE constraint already exists (via table schema) in staff_users table');
                                }
                            }
                        } catch (schemaError) {
                            console.warn('Could not check table schema for UNIQUE constraints:', schemaError.message);
                            // If schema check fails, we'll err on the side of caution and assume no constraint exists
                            // This is safer than the previous test insertion method
                        }
                    }
                } else {
                    // If discord_id column doesn't exist, we definitely need to run the migration
                    console.log('discord_id column does not exist, migration needed');
                }

                // Run migration if needed
                const needsMigration = !hasUniqueConstraint;
                
                if (needsMigration) {
                    console.log('🔄 Adding UNIQUE constraint to discord_id column...');
                    
                    // Step 1: Check for duplicates and warn (only if discord_id column exists)
                    if (discordIdColumn) {
                        const duplicates = await this.all(`
                            SELECT discord_id, COUNT(*) as count 
                            FROM staff_users 
                            WHERE discord_id IS NOT NULL AND discord_id != ''
                            GROUP BY discord_id 
                            HAVING COUNT(*) > 1
                        `);
                        
                        if (duplicates.length > 0) {
                            console.warn('⚠️  Found duplicate discord_id values:', duplicates);
                            console.log('🧹 Removing duplicates (keeping oldest entry for each discord_id)...');
                            
                            // Remove duplicates, keeping the oldest (smallest id) for each discord_id
                            await this.run(`
                                DELETE FROM staff_users 
                                WHERE id NOT IN (
                                    SELECT MIN(id) 
                                    FROM staff_users 
                                    WHERE discord_id IS NOT NULL AND discord_id != ''
                                    GROUP BY discord_id
                                ) AND discord_id IS NOT NULL AND discord_id != ''
                            `);
                        }
                    }

                    // Step 2: Create backup
                    await this.run('CREATE TABLE IF NOT EXISTS staff_users_backup_discord_unique AS SELECT * FROM staff_users');

                    // Step 3: Create new table with UNIQUE constraint
                    await this.run(`
                        CREATE TABLE staff_users_new (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            steam_id TEXT,
                            steam_username TEXT,
                            discord_id TEXT UNIQUE,
                            discord_username TEXT,
                            discord_discriminator TEXT,
                            discord_avatar TEXT,
                            discord_roles TEXT DEFAULT '[]',
                            permission_level TEXT NOT NULL DEFAULT 'editor',
                            is_active BOOLEAN DEFAULT 1,
                            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                            last_login DATETIME,
                            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                        )
                    `);

                    // Step 4: Copy data - handle missing columns gracefully
                    const columnNames = tableInfo.map(col => col.name);
                    const availableColumns = [
                        'id', 'steam_id', 'steam_username', 'discord_id', 'discord_username',
                        'discord_discriminator', 'discord_avatar', 'discord_roles',
                        'permission_level', 'is_active', 'created_at', 'last_login', 'updated_at'
                    ].filter(col => columnNames.includes(col));
                    
                    const selectColumns = availableColumns.join(', ');
                    const insertColumns = availableColumns.join(', ');
                    
                    await this.run(`
                        INSERT INTO staff_users_new (${insertColumns})
                        SELECT ${selectColumns}
                        FROM staff_users
                    `);

                    // Step 5: Replace table
                    await this.run('DROP TABLE staff_users');
                    await this.run('ALTER TABLE staff_users_new RENAME TO staff_users');

                    // Step 6: Recreate indexes
                    await this.run('CREATE INDEX IF NOT EXISTS idx_staff_steam ON staff_users(steam_id)');
                    await this.run('CREATE INDEX IF NOT EXISTS idx_staff_active ON staff_users(is_active)');
                    await this.run('CREATE INDEX IF NOT EXISTS idx_staff_discord ON staff_users(discord_id)');

                    if (discordIdColumn) {
                        console.log('✅ Migration: Added UNIQUE constraint to discord_id column');
                    } else {
                        console.log('✅ Migration: Added discord_id column with UNIQUE constraint');
                    }
                }
            } catch (error) {
                console.error('Error adding UNIQUE constraint to discord_id:', error.message);
            }
        } catch (error) {
            console.error('SQLite migration error:', error);
        }
    }

    async runPostgreSQLMigrations() {
        try {
            // For PostgreSQL, we use IF NOT EXISTS in the schema, so no additional migrations needed for now
            console.log('PostgreSQL migrations completed (using schema-based approach)');
        } catch (error) {
            console.error('PostgreSQL migration error:', error);
        }
    }

    async insertDefaultData() {
        try {
            // Check if categories already exist
            const existingCategories = await this.get('SELECT COUNT(*) as count FROM categories');
            
            if (existingCategories.count === 0) {
                const defaultCategories = [
                    { name: 'General Server Rules', description: 'Basic rules that apply to all players', letter_code: 'A', order_index: 1 },
                    { name: 'PrisonRP Specific Rules', description: 'Rules specific to the prison roleplay environment', letter_code: 'B', order_index: 2 },
                    { name: 'Guard Guidelines', description: 'Rules and guidelines for prison guards', letter_code: 'C', order_index: 3 },
                    { name: 'Prisoner Guidelines', description: 'Rules and guidelines for prisoners', letter_code: 'D', order_index: 4 },
                    { name: 'Warden Protocols', description: 'Rules and protocols for wardens', letter_code: 'E', order_index: 5 },
                    { name: 'Economy & Contraband Rules', description: 'Rules regarding prison economy and contraband', letter_code: 'F', order_index: 6 },
                    { name: 'Staff Information', description: 'Information about server staff and reporting', letter_code: 'G', order_index: 7 }
                ];

                for (const category of defaultCategories) {
                    await this.run(
                        'INSERT INTO categories (name, description, letter_code, order_index) VALUES (?, ?, ?, ?)',
                        [category.name, category.description, category.letter_code, category.order_index]
                    );
                }

                console.log('Default categories inserted');
            }

            // Check if announcements exist
            const existingAnnouncements = await this.get('SELECT COUNT(*) as count FROM announcements');
            
            if (existingAnnouncements.count === 0) {
                await this.run(
                    'INSERT INTO announcements (title, content, priority) VALUES (?, ?, ?)',
                    [
                        'Welcome to DigitalDeltaGaming PrisonRP!',
                        'Welcome to our PrisonRP server! Please read all rules carefully before playing. Have fun and follow the rules!',
                        5
                    ]
                );

                console.log('Default announcement inserted');
            }

            // Check if staff users exist
            const existingStaff = await this.get('SELECT COUNT(*) as count FROM staff_users');
            
            if (existingStaff.count === 0) {
                await this.run(
                    'INSERT INTO staff_users (steam_id, steam_username, permission_level) VALUES (?, ?, ?)',
                    ['76561198000000000', 'Demo Admin', 'admin']
                );

                await this.run(
                    'INSERT INTO staff_users (steam_id, steam_username, permission_level) VALUES (?, ?, ?)',
                    ['76561198000000001', 'Demo Moderator', 'moderator']
                );

                console.log('Default staff users inserted (demo accounts)');
            }

        } catch (error) {
            console.error('Error inserting default data:', error);
            throw error;
        }
    }

    // Promisify database methods
    run(sql, params = []) {
        if (this.dbType === 'postgres') {
            return this.runPostgreSQL(sql, params);
        } else {
            return this.runSQLite(sql, params);
        }
    }

    get(sql, params = []) {
        if (this.dbType === 'postgres') {
            return this.getPostgreSQL(sql, params);
        } else {
            return this.getSQLite(sql, params);
        }
    }

    all(sql, params = []) {
        if (this.dbType === 'postgres') {
            return this.allPostgreSQL(sql, params);
        } else {
            return this.allSQLite(sql, params);
        }
    }

    async runPostgreSQL(sql, params = []) {
        const client = await this.db.connect();
        try {
            // Check if this is an INSERT statement that needs RETURNING id
            const trimmedSql = sql.trim().toUpperCase();
            let queryResult;
            
            if (trimmedSql.startsWith('INSERT') && !trimmedSql.includes('RETURNING')) {
                // Add RETURNING id to INSERT statements
                let modifiedSql = sql.trim();
                if (modifiedSql.endsWith(';')) {
                    modifiedSql = modifiedSql.slice(0, -1);
                }
                modifiedSql += ' RETURNING id';
                queryResult = await client.query(modifiedSql, params);
            } else {
                queryResult = await client.query(sql, params);
            }
            
            return { 
                id: queryResult.rows[0]?.id || null, 
                changes: queryResult.rowCount || 0 
            };
        } finally {
            client.release();
        }
    }

    async getPostgreSQL(sql, params = []) {
        const client = await this.db.connect();
        try {
            const result = await client.query(sql, params);
            return result.rows[0] || null;
        } finally {
            client.release();
        }
    }

    async allPostgreSQL(sql, params = []) {
        const client = await this.db.connect();
        try {
            const result = await client.query(sql, params);
            return result.rows;
        } finally {
            client.release();
        }
    }

    runSQLite(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    getSQLite(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    allSQLite(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    close() {
        return new Promise((resolve, reject) => {
            if (this.dbType === 'postgres') {
                this.db.end().then(resolve).catch(reject);
            } else if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log('Database connection closed');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }
}

module.exports = DatabaseAdapter;