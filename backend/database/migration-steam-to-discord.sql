-- Migration script: Steam to Discord Authentication
-- This script converts the existing Steam-based authentication to Discord-based authentication

-- Step 1: Add new Discord columns to staff_users table
ALTER TABLE staff_users ADD COLUMN discord_id TEXT;
ALTER TABLE staff_users ADD COLUMN discord_username TEXT;
ALTER TABLE staff_users ADD COLUMN discord_discriminator TEXT;
ALTER TABLE staff_users ADD COLUMN discord_avatar TEXT;
ALTER TABLE staff_users ADD COLUMN discord_roles TEXT DEFAULT '[]'; -- JSON array of Discord role IDs

-- Step 2: Create a backup of existing data (optional, for safety)
CREATE TABLE IF NOT EXISTS staff_users_backup AS SELECT * FROM staff_users;

-- Step 3: Update indexes
-- Remove old Steam index
DROP INDEX IF EXISTS idx_staff_steam;

-- Add new Discord index
CREATE INDEX IF NOT EXISTS idx_staff_discord ON staff_users(discord_id);

-- Step 4: Add Discord-specific tables

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

-- Indexes for Discord tables
CREATE INDEX IF NOT EXISTS idx_discord_role_mappings_role ON discord_role_mappings(discord_role_id);
CREATE INDEX IF NOT EXISTS idx_discord_auth_logs_user ON discord_auth_logs(discord_id);
CREATE INDEX IF NOT EXISTS idx_discord_auth_logs_date ON discord_auth_logs(created_at);

-- Step 5: Insert default role mappings (customize these based on your Discord server roles)
-- You'll need to update these with your actual Discord role IDs
INSERT OR IGNORE INTO discord_role_mappings (discord_role_id, discord_role_name, permission_level) VALUES
('REPLACE_WITH_OWNER_ROLE_ID', 'Server Owner', 'owner'),
('REPLACE_WITH_ADMIN_ROLE_ID', 'Administrator', 'admin'),
('REPLACE_WITH_MOD_ROLE_ID', 'Moderator', 'moderator'),
('REPLACE_WITH_EDITOR_ROLE_ID', 'Staff', 'editor');

-- Step 6: Update column constraints (this will require recreating the table in SQLite)
-- Note: In production, you might want to do this more carefully with a proper migration

-- For now, we'll keep both Steam and Discord columns for compatibility
-- Later, after confirming migration is successful, you can remove Steam columns with:
-- ALTER TABLE staff_users DROP COLUMN steam_id;
-- ALTER TABLE staff_users DROP COLUMN steam_username;

PRAGMA user_version = 2; -- Update schema version 