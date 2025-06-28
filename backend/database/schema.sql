-- DigitalDeltaGaming PrisonRP Rules System Database Schema

-- Categories table for rule sections (A, B, C, etc.)
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    letter_code TEXT NOT NULL UNIQUE,
    color VARCHAR(7) DEFAULT '#3498db',
    is_active BOOLEAN DEFAULT 1,
    order_index INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Rules table with hierarchical structure
CREATE TABLE IF NOT EXISTS rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    parent_rule_id INTEGER NULL, -- For sub-rules
    title TEXT DEFAULT '',
    content TEXT NOT NULL,
    rule_number INTEGER NOT NULL,
    sub_number INTEGER NULL, -- For sub-rules (1.1, 1.2, etc.)
    revision_letter TEXT DEFAULT 'a', -- For revisions (a, b, c, etc.)
    rule_type TEXT DEFAULT 'main', -- 'main', 'sub', 'revision'
    is_active BOOLEAN DEFAULT 1, -- Only active rules shown to public
    order_index INTEGER NOT NULL,
    images TEXT DEFAULT '[]', -- JSON array of image objects
    -- Approval workflow fields
    status TEXT DEFAULT 'approved', -- 'draft', 'pending_approval', 'approved', 'rejected'
    submitted_by INTEGER, -- Staff user who created/submitted this rule
    reviewed_by INTEGER, -- Staff user who approved/rejected this rule
    review_notes TEXT, -- Comments from reviewer
    submitted_at DATETIME, -- When submitted for approval
    reviewed_at DATETIME, -- When reviewed
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_rule_id) REFERENCES rules(id) ON DELETE CASCADE,
    FOREIGN KEY (submitted_by) REFERENCES staff_users(id),
    FOREIGN KEY (reviewed_by) REFERENCES staff_users(id)
);

-- Rule codes table for search optimization
CREATE TABLE IF NOT EXISTS rule_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rule_id INTEGER NOT NULL,
    full_code TEXT NOT NULL UNIQUE, -- e.g., "A.1", "B.2.1", etc.
    truncated_description TEXT NOT NULL, -- For search results
    searchable_content TEXT NOT NULL, -- Full text for search indexing
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rule_id) REFERENCES rules(id) ON DELETE CASCADE
);

-- Rule changes tracking for recent updates
CREATE TABLE IF NOT EXISTS rule_changes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rule_id INTEGER NOT NULL,
    change_type TEXT NOT NULL, -- 'created', 'updated', 'deleted'
    old_content TEXT,
    new_content TEXT,
    change_description TEXT,
    is_major BOOLEAN DEFAULT 0, -- Major vs minor changes
    staff_user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rule_id) REFERENCES rules(id) ON DELETE CASCADE,
    FOREIGN KEY (staff_user_id) REFERENCES staff_users(id)
);

-- Rule cross-references table for linking related rules
CREATE TABLE IF NOT EXISTS rule_cross_references (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_rule_id INTEGER NOT NULL, -- The rule that references another
    target_rule_id INTEGER NOT NULL, -- The rule being referenced
    reference_type TEXT DEFAULT 'related', -- 'related', 'supersedes', 'superseded_by', 'clarifies', 'conflicts_with'
    reference_context TEXT, -- Optional description of how they're related
    is_bidirectional BOOLEAN DEFAULT 1, -- Whether the relationship goes both ways
    created_by INTEGER NOT NULL, -- Staff user who created this cross-reference
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_rule_id) REFERENCES rules(id) ON DELETE CASCADE,
    FOREIGN KEY (target_rule_id) REFERENCES rules(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES staff_users(id),
    UNIQUE(source_rule_id, target_rule_id, reference_type) -- Prevent duplicate relationships
);

-- Announcements/MOTD table
CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    priority INTEGER DEFAULT 1, -- Higher number = higher priority
    is_active BOOLEAN DEFAULT 1,
    -- Approval workflow fields
    status TEXT DEFAULT 'approved', -- 'draft', 'pending_approval', 'approved', 'rejected'
    submitted_by INTEGER, -- Staff user who created/submitted this announcement
    reviewed_by INTEGER, -- Staff user who approved/rejected this announcement
    review_notes TEXT, -- Comments from reviewer
    submitted_at DATETIME, -- When submitted for approval
    reviewed_at DATETIME, -- When reviewed
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (submitted_by) REFERENCES staff_users(id),
    FOREIGN KEY (reviewed_by) REFERENCES staff_users(id)
);

-- Media files table
CREATE TABLE IF NOT EXISTS media (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rule_id INTEGER NULL, -- Can be null for general media
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_type TEXT NOT NULL, -- 'image' or 'video'
    mime_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rule_id) REFERENCES rules(id) ON DELETE SET NULL
);

-- Uploaded images table for rich text editor
CREATE TABLE IF NOT EXISTS uploaded_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    thumbnail_filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    uploaded_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES staff_users(id)
);

-- Staff users table for authentication
CREATE TABLE IF NOT EXISTS staff_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    steam_id TEXT, -- Removed NOT NULL constraint to allow Discord-only users
    steam_username TEXT,
    discord_id TEXT UNIQUE, -- Discord ID must be unique for authentication
    discord_username TEXT,
    discord_discriminator TEXT,
    discord_avatar TEXT,
    discord_roles TEXT DEFAULT '[]', -- JSON array of Discord role IDs
    permission_level TEXT NOT NULL DEFAULT 'editor', -- 'owner', 'admin', 'moderator', 'editor'
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table for staff authentication
CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_token TEXT NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES staff_users(id) ON DELETE CASCADE
);

-- Search history table (optional)
CREATE TABLE IF NOT EXISTS search_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    search_term TEXT NOT NULL,
    results_count INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Enhanced staff activity logging table
CREATE TABLE IF NOT EXISTS staff_activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    staff_user_id INTEGER NOT NULL,
    action_type TEXT NOT NULL, -- 'login', 'logout', 'create', 'update', 'delete', 'upload', 'download', 'access'
    resource_type TEXT NOT NULL, -- 'rule', 'category', 'announcement', 'user', 'image', 'dashboard', 'system'
    resource_id INTEGER, -- ID of the affected resource (can be null for system actions)
    action_details TEXT, -- JSON string with detailed action info
    ip_address TEXT,
    user_agent TEXT,
    session_id TEXT,
    success BOOLEAN DEFAULT 1, -- Whether the action was successful
    error_message TEXT, -- Error details if action failed
    duration_ms INTEGER, -- How long the action took (for performance monitoring)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_user_id) REFERENCES staff_users(id) ON DELETE CASCADE
);

-- Enhanced permissions table for granular access control
CREATE TABLE IF NOT EXISTS staff_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    staff_user_id INTEGER NOT NULL,
    permission_type TEXT NOT NULL, -- 'category_access', 'feature_access', 'time_restriction'
    permission_value TEXT NOT NULL, -- Category ID, feature name, or time range
    granted_by INTEGER NOT NULL, -- Who granted this permission
    granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME, -- Optional expiration
    is_active BOOLEAN DEFAULT 1,
    FOREIGN KEY (staff_user_id) REFERENCES staff_users(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES staff_users(id)
);

-- Discord role mappings table - maps Discord roles to permission levels
CREATE TABLE IF NOT EXISTS discord_role_mappings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    discord_role_id TEXT NOT NULL UNIQUE,
    discord_role_name TEXT NOT NULL,
    permission_level TEXT NOT NULL, -- 'owner', 'admin', 'moderator', 'editor'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Discord bot settings table
CREATE TABLE IF NOT EXISTS discord_bot_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    bot_token_hash TEXT NOT NULL, -- Store hashed version for security
    permission_sync_enabled BOOLEAN DEFAULT 1,
    auto_role_assignment BOOLEAN DEFAULT 1,
    log_channel_id TEXT, -- Channel for logging auth events
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Discord authentication logs
CREATE TABLE IF NOT EXISTS discord_auth_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    discord_id TEXT NOT NULL,
    discord_username TEXT NOT NULL,
    action_type TEXT NOT NULL, -- 'login', 'logout', 'permission_check', 'role_sync'
    success BOOLEAN DEFAULT 1,
    roles_at_time TEXT, -- JSON array of roles at time of action
    permission_level_granted TEXT,
    ip_address TEXT,
    user_agent TEXT,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Scheduled announcements table
CREATE TABLE IF NOT EXISTS scheduled_announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    priority INTEGER DEFAULT 1,
    scheduled_for DATETIME NOT NULL,
    created_by INTEGER NOT NULL,
    auto_expire_hours INTEGER, -- Auto-deactivate after X hours
    is_published BOOLEAN DEFAULT 0, -- Whether it has been published
    published_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES staff_users(id)
);

-- Bulk operations tracking
CREATE TABLE IF NOT EXISTS bulk_operations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    operation_type TEXT NOT NULL, -- 'import', 'export', 'mass_update', 'mass_delete'
    operation_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    initiated_by INTEGER NOT NULL,
    total_items INTEGER,
    processed_items INTEGER DEFAULT 0,
    failed_items INTEGER DEFAULT 0,
    operation_data TEXT, -- JSON with operation details
    error_log TEXT, -- Errors encountered during operation
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (initiated_by) REFERENCES staff_users(id)
);

-- Discord Integration Tables
CREATE TABLE IF NOT EXISTS discord_settings (
    id INTEGER PRIMARY KEY,
    announcement_webhook_url TEXT,
    rules_webhook_url TEXT,
    announcements_enabled INTEGER DEFAULT 0,
    rules_enabled INTEGER DEFAULT 0,
    emergency_role_id TEXT,
    default_channel_type VARCHAR(50) DEFAULT 'announcements',
    embed_color VARCHAR(7) DEFAULT '#677bae',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS discord_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    announcement_id INTEGER,
    rule_id INTEGER,
    message_type VARCHAR(50) NOT NULL, -- 'announcement', 'rule_change', etc.
    discord_message_id TEXT NOT NULL,
    webhook_url TEXT NOT NULL,
    sent_by INTEGER NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (announcement_id) REFERENCES announcements(id),
    FOREIGN KEY (rule_id) REFERENCES rules(id),
    FOREIGN KEY (sent_by) REFERENCES staff_users(id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_categories_letter_code ON categories(letter_code);
CREATE INDEX IF NOT EXISTS idx_categories_order ON categories(order_index);

CREATE INDEX IF NOT EXISTS idx_rules_category ON rules(category_id);
CREATE INDEX IF NOT EXISTS idx_rules_parent ON rules(parent_rule_id);
CREATE INDEX IF NOT EXISTS idx_rules_active ON rules(is_active);
CREATE INDEX IF NOT EXISTS idx_rules_order ON rules(order_index);

CREATE INDEX IF NOT EXISTS idx_rule_codes_code ON rule_codes(full_code);
CREATE INDEX IF NOT EXISTS idx_rule_codes_search ON rule_codes(searchable_content);

CREATE INDEX IF NOT EXISTS idx_rule_changes_rule ON rule_changes(rule_id);
CREATE INDEX IF NOT EXISTS idx_rule_changes_date ON rule_changes(created_at);

-- Indexes for rule cross-references
CREATE INDEX IF NOT EXISTS idx_rule_cross_refs_source ON rule_cross_references(source_rule_id);
CREATE INDEX IF NOT EXISTS idx_rule_cross_refs_target ON rule_cross_references(target_rule_id);
CREATE INDEX IF NOT EXISTS idx_rule_cross_refs_type ON rule_cross_references(reference_type);
CREATE INDEX IF NOT EXISTS idx_rule_cross_refs_created_by ON rule_cross_references(created_by);

CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_priority ON announcements(priority);
CREATE INDEX IF NOT EXISTS idx_announcements_status ON announcements(status);
CREATE INDEX IF NOT EXISTS idx_announcements_submitted_by ON announcements(submitted_by);

CREATE INDEX IF NOT EXISTS idx_media_rule ON media(rule_id);
CREATE INDEX IF NOT EXISTS idx_media_type ON media(file_type);

CREATE INDEX IF NOT EXISTS idx_uploaded_images_user ON uploaded_images(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_uploaded_images_date ON uploaded_images(created_at);

CREATE INDEX IF NOT EXISTS idx_staff_steam ON staff_users(steam_id);
CREATE INDEX IF NOT EXISTS idx_staff_active ON staff_users(is_active);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- Enhanced indexes for activity logs and performance
CREATE INDEX IF NOT EXISTS idx_staff_activity_user ON staff_activity_logs(staff_user_id);
CREATE INDEX IF NOT EXISTS idx_staff_activity_type ON staff_activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_staff_activity_resource ON staff_activity_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_staff_activity_date ON staff_activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_staff_activity_session ON staff_activity_logs(session_id);

CREATE INDEX IF NOT EXISTS idx_staff_permissions_user ON staff_permissions(staff_user_id);
CREATE INDEX IF NOT EXISTS idx_staff_permissions_type ON staff_permissions(permission_type);
CREATE INDEX IF NOT EXISTS idx_staff_permissions_active ON staff_permissions(is_active);

-- Discord table indexes
CREATE INDEX IF NOT EXISTS idx_discord_role_mappings_role ON discord_role_mappings(discord_role_id);
CREATE INDEX IF NOT EXISTS idx_discord_auth_logs_user ON discord_auth_logs(discord_id);
CREATE INDEX IF NOT EXISTS idx_discord_auth_logs_date ON discord_auth_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_scheduled_announcements_date ON scheduled_announcements(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_announcements_published ON scheduled_announcements(is_published);

CREATE INDEX IF NOT EXISTS idx_bulk_operations_status ON bulk_operations(operation_status);
CREATE INDEX IF NOT EXISTS idx_bulk_operations_user ON bulk_operations(initiated_by);

-- Enhanced rules indexes for approval workflow
CREATE INDEX IF NOT EXISTS idx_rules_status ON rules(status);
CREATE INDEX IF NOT EXISTS idx_rules_submitted_by ON rules(submitted_by); 