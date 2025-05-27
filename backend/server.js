require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const path = require('path');

// Import database
const Database = require('./database/init');

// Import routes
const rulesRoutes = require('./routes/rules');
const searchRoutes = require('./routes/search');
// const authRoutes = require('./routes/auth');
// const staffRoutes = require('./routes/staff');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database
let db;

async function initializeServer() {
    try {
        // Initialize database
        const database = new Database(process.env.DATABASE_PATH || './database/ddg_prisonrp.db');
        db = await database.initialize();
        
        // Make database available to routes
        app.locals.db = database;

        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Failed to initialize database:', error);
        process.exit(1);
    }
}

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
}));

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Basic health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// API Routes
app.use('/api/rules', rulesRoutes);
app.use('/api/search', searchRoutes);
// app.use('/auth', authRoutes);
// app.use('/staff', staffRoutes);

// Basic API endpoints for testing
app.get('/api/categories', async (req, res) => {
    try {
        const query = `
            SELECT 
                c.*,
                COUNT(r.id) as rule_count
            FROM categories c
            LEFT JOIN rules r ON c.id = r.category_id AND r.is_active = 1 AND r.parent_rule_id IS NULL
            GROUP BY c.id
            ORDER BY c.order_index ASC
        `;
        const categories = await app.locals.db.all(query);
        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/announcements', async (req, res) => {
    try {
        const announcements = await app.locals.db.all(
            'SELECT * FROM announcements WHERE is_active = 1 ORDER BY priority DESC, created_at DESC'
        );
        res.json(announcements);
    } catch (error) {
        console.error('Error fetching announcements:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down server...');
    if (db) {
        await app.locals.db.close();
    }
    process.exit(0);
});

// Start server
initializeServer().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    });
}).catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
}); 