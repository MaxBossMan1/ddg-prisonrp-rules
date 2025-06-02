require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const passport = require('passport');
const path = require('path');

// Import database
const Database = require('./database/init');

// Import rate limiting middleware
const {
  publicApiLimiter,
  searchLimiter,
  authLimiter,
  staffLimiter,
  uploadLimiter,
  healthLimiter,
  discordTestLimiter,
  globalLimiter
} = require('./middleware/rateLimiting');

// Import routes
const rulesRoutes = require('./routes/rules');
const searchRoutes = require('./routes/search');
const { router: authRoutes } = require('./routes/auth');
const staffRoutes = require('./routes/staff');
const imageRoutes = require('./routes/images');
const discordRoutes = require('./routes/discord');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database
let db;

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

console.log('🔧 Server Dynamic URLs:', {
  NODE_ENV: process.env.NODE_ENV,
  LOCAL_DEV: process.env.LOCAL_DEV,
  dynamicUrls
});

async function initializeServer() {
    try {
        // Initialize database
        const database = new Database(process.env.DATABASE_PATH || './database/ddg_prisonrp.db');
        db = await database.initialize();
        
        // Make database available to routes
        app.locals.db = database;

        // Set database instance for auth routes
        Database.setInstance(database);

        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Failed to initialize database:', error);
        process.exit(1);
    }
}

// Security middleware with dynamic CSP
app.use((req, res, next) => {
    // Disable CSP for staff dashboard routes and uploads
    if (req.path.includes('/staff/') || req.path.includes('/uploads/')) {
        return next();
    }
    
    // Apply helmet for other routes with dynamic URLs
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:", dynamicUrls.frontend, dynamicUrls.backend],
                connectSrc: ["'self'", dynamicUrls.backend],
                fontSrc: ["'self'"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"],
            },
        },
        crossOriginResourcePolicy: { policy: "cross-origin" }
    })(req, res, next);
});

// CORS configuration with dynamic URLs
const allowedOrigins = [
    dynamicUrls.frontend,
    process.env.FRONTEND_URL // Keep for backward compatibility
].filter(Boolean); // Remove any undefined values

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('CORS blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware with increased limits for rich text content
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to false to work with HTTP (not just HTTPS)
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax' // Allow cross-site cookies for different ports
    }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Static file serving for uploads with CORS headers
app.use('/uploads', (req, res, next) => {
    // Add CORS headers for uploads - support multiple origins
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
}, express.static(path.join(__dirname, 'uploads')));

// Additional static serving for images specifically with CORS headers
app.use('/uploads/images', (req, res, next) => {
    // Add CORS headers for images - support multiple origins
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
}, express.static(path.join(__dirname, 'uploads', 'images')));

// Serve static files from public directory
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

// Basic health check endpoint
app.get('/health', healthLimiter, (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        rateLimiting: {
            enabled: process.env.NODE_ENV !== 'development',
            limits: {
                public: '50 requests per minute',
                search: '30 requests per minute',
                auth: '1000 requests per 1 minute (disabled for testing)',
                staff: '150 requests per minute',
                upload: '15 requests per minute',
                health: '50 requests per minute',
                discord: '5 requests per minute',
                global: '75 requests per minute'
            }
        }
    });
});

// Rate limiting status endpoint (for monitoring)
app.get('/api/rate-limit-status', staffLimiter, (req, res) => {
    if (!req.isAuthenticated() || req.user.permission_level < 3) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    
    res.json({
        message: 'Rate limiting is active',
        environment: process.env.NODE_ENV || 'development',
        skipLocalhost: process.env.NODE_ENV === 'development',
        limits: {
            publicApi: { requests: 50, window: '1 minute' },
            search: { requests: 30, window: '1 minute' },
            authentication: { requests: 1000, window: '1 minute (disabled for testing)' },
            staff: { requests: 150, window: '1 minute' },
            upload: { requests: 15, window: '1 minute' },
            health: { requests: 50, window: '1 minute' },
            discord: { requests: 5, window: '1 minute' },
            global: { requests: 75, window: '1 minute' }
        }
    });
});

// Apply global rate limiter to all routes as fallback
app.use(globalLimiter);

// API Routes with specific rate limiting
app.use('/api/rules', publicApiLimiter, rulesRoutes);
app.use('/api/search', searchLimiter, searchRoutes);
app.use('/api/auth', authRoutes);
app.use('/auth', authLimiter, authRoutes); // Direct auth routes for frontend compatibility
app.use('/api/staff', staffLimiter, staffRoutes);
app.use('/api/images', uploadLimiter, imageRoutes);
app.use('/api/discord', discordTestLimiter, discordRoutes);
app.use('/api/analytics', staffLimiter, analyticsRoutes);

// Basic API endpoints for frontend
app.get('/api/categories', publicApiLimiter, async (req, res) => {
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

app.get('/api/announcements', publicApiLimiter, async (req, res) => {
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

// Staff panel routes (secret URL access)
const staffSecretUrl = process.env.STAFF_SECRET_URL || 'staff-management-2024';

app.get(`/staff/${staffSecretUrl}`, (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect(`/staff/${staffSecretUrl}/dashboard`);
    } else {
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Staff Login - DigitalDeltaGaming</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        background: #1a1d23; 
                        color: #ecf0f1; 
                        text-align: center; 
                        padding: 50px; 
                    }
                    .login-container {
                        max-width: 400px;
                        margin: 0 auto;
                        padding: 40px;
                        background: #34495e;
                        border-radius: 8px;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    }
                    .steam-btn {
                        background: #677bae;
                        color: white;
                        padding: 12px 24px;
                        border: none;
                        border-radius: 4px;
                        text-decoration: none;
                        display: inline-block;
                        margin-top: 20px;
                        transition: background 0.3s;
                    }
                    .steam-btn:hover { background: #8a9dc9; }
                </style>
            </head>
            <body>
                <div class="login-container">
                    <h1>Staff Access Portal</h1>
                    <p>Please authenticate with Steam to access the staff management panel.</p>
                    <a href="/auth/steam" class="steam-btn">Login with Steam</a>
                </div>
            </body>
            </html>
        `);
    }
});

app.get(`/staff/${staffSecretUrl}/dashboard`, async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect(`/staff/${staffSecretUrl}`);
    }
    
    // Redirect to React app which will handle the staff dashboard
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/staff/${staffSecretUrl}/dashboard`);
});

app.get('/staff/login-failed', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Access Denied - DigitalDeltaGaming</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    background: #1a1d23; 
                    color: #ecf0f1; 
                    text-align: center; 
                    padding: 50px; 
                }
                .error-container {
                    max-width: 400px;
                    margin: 0 auto;
                    padding: 40px;
                    background: #e74c3c;
                    border-radius: 8px;
                }
            </style>
        </head>
        <body>
            <div class="error-container">
                <h1>Access Denied</h1>
                <p>You are not authorized to access the staff panel. Please contact an administrator if you believe this is an error.</p>
            </div>
        </body>
        </html>
    `);
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
        
        // Start scheduled announcements processor
        startScheduledAnnouncementsProcessor();
    });
}).catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
});

// Scheduled announcements processor
function startScheduledAnnouncementsProcessor() {
    console.log('Starting scheduled announcements processor...');
    
    // Process every minute
    setInterval(async () => {
        try {
            const database = Database.getInstance();
            if (!database) return;
            
            const now = new Date().toISOString();
            
            // Get announcements ready to be published
            const readyAnnouncements = await database.all(`
                SELECT * FROM scheduled_announcements 
                WHERE scheduled_for <= ? AND is_published = 0
                ORDER BY scheduled_for ASC
            `, [now]);
            
            if (readyAnnouncements.length > 0) {
                console.log(`Processing ${readyAnnouncements.length} scheduled announcements...`);
                
                for (const announcement of readyAnnouncements) {
                    try {
                        // Move to active announcements
                        const result = await database.run(
                            'INSERT INTO announcements (title, content, priority, is_active) VALUES (?, ?, ?, 1)',
                            [announcement.title, announcement.content, announcement.priority]
                        );
                        
                        // Mark as published in scheduled table
                        await database.run(
                            'UPDATE scheduled_announcements SET is_published = 1, published_at = CURRENT_TIMESTAMP WHERE id = ?',
                            [announcement.id]
                        );
                        
                        console.log(`✅ Published scheduled announcement: "${announcement.title}" (ID: ${announcement.id} -> ${result.id})`);
                        
                        // Handle auto-expire if set
                        if (announcement.auto_expire_hours) {
                            console.log(`📅 Announcement "${announcement.title}" will auto-expire in ${announcement.auto_expire_hours} hours`);
                            // Note: Auto-expire logic could be implemented here or in a separate job
                        }
                        
                    } catch (error) {
                        console.error(`❌ Error processing scheduled announcement ${announcement.id}:`, error.message);
                    }
                }
            }
            
        } catch (error) {
            console.error('❌ Error in scheduled announcements processor:', error);
        }
    }, 60000); // Check every minute
    
    console.log('✅ Scheduled announcements processor started (checking every minute)');
} 