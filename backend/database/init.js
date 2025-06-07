const DatabaseAdapter = require('./adapter');

class Database {
    static instance = null;

    constructor(config = {}) {
        this.adapter = new DatabaseAdapter();
        this.config = config;
    }

    static getInstance() {
        return Database.instance;
    }

    static setInstance(instance) {
        Database.instance = instance;
    }

    async initialize() {
        try {
            await this.adapter.initialize();
            console.log('Database initialized successfully');
            return this.adapter;
        } catch (error) {
            console.error('Database initialization failed:', error);
            throw error;
        }
    }

    // Proxy methods to the adapter
    run(sql, params = []) {
        return this.adapter.run(sql, params);
    }

    get(sql, params = []) {
        return this.adapter.get(sql, params);
    }

    all(sql, params = []) {
        return this.adapter.all(sql, params);
    }

    close() {
        return this.adapter.close();
    }
}

module.exports = Database; 