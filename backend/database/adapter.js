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