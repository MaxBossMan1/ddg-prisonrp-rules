-- DigitalDeltaGaming PrisonRP Rules System Database Schema

-- Categories table for rule sections (A, B, C, etc.)
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    letter_code TEXT NOT NULL UNIQUE,
    order_index INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Rules table with hierarchical structure
CREATE TABLE IF NOT EXISTS rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    parent_rule_id INTEGER NULL, -- For sub-rules
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    rule_number INTEGER NOT NULL,
    sub_number INTEGER NULL, -- For sub-rules (1.1, 1.2, etc.)
    revision_letter TEXT DEFAULT 'a', -- For revisions (a, b, c, etc.)
    rule_type TEXT DEFAULT 'main', -- 'main', 'sub', 'revision'
    is_active BOOLEAN DEFAULT 1, -- Only active rules shown to public
    order_index INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_rule_id) REFERENCES rules(id) ON DELETE CASCADE
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

-- Announcements/MOTD table
CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    priority INTEGER DEFAULT 1, -- Higher number = higher priority
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

-- Staff users table for authentication
CREATE TABLE IF NOT EXISTS staff_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    steam_id TEXT NOT NULL UNIQUE,
    steam_username TEXT NOT NULL,
    permission_level TEXT NOT NULL DEFAULT 'editor', -- 'admin', 'moderator', 'editor'
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
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

CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_priority ON announcements(priority);

CREATE INDEX IF NOT EXISTS idx_media_rule ON media(rule_id);
CREATE INDEX IF NOT EXISTS idx_media_type ON media(file_type);

CREATE INDEX IF NOT EXISTS idx_staff_steam ON staff_users(steam_id);
CREATE INDEX IF NOT EXISTS idx_staff_active ON staff_users(is_active);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at); 