const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

class Database {
    constructor(dbPath) {
        this.dbPath = dbPath;
        this.db = null;
    }

    async initialize() {
        try {
            // Ensure database directory exists
            const dbDir = path.dirname(this.dbPath);
            if (!fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir, { recursive: true });
            }

            // Create database connection
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Error opening database:', err.message);
                    throw err;
                }
                console.log('Connected to SQLite database:', this.dbPath);
            });

            // Enable foreign keys
            await this.run('PRAGMA foreign_keys = ON');

            // Create tables from schema
            await this.createTables();

            // Insert default data
            await this.insertDefaultData();

            console.log('Database initialized successfully');
            return this.db;
        } catch (error) {
            console.error('Database initialization failed:', error);
            throw error;
        }
    }

    async createTables() {
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        // Split schema into individual statements
        const statements = schema.split(';').filter(stmt => stmt.trim());
        
        for (const statement of statements) {
            if (statement.trim()) {
                await this.run(statement);
            }
        }
        
        console.log('Database tables created successfully');
    }

    async insertDefaultData() {
        try {
            // Check if categories already exist
            const existingCategories = await this.get('SELECT COUNT(*) as count FROM categories');
            
            if (existingCategories.count === 0) {
                // Insert default categories
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
                // Insert default announcement
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

        } catch (error) {
            console.error('Error inserting default data:', error);
            throw error;
        }
    }

    // Promisify database methods
    run(sql, params = []) {
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

    get(sql, params = []) {
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

    all(sql, params = []) {
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
            if (this.db) {
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

module.exports = Database; 