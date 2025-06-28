-- Migration: Add UNIQUE constraint to discord_id column
-- This fixes a security issue where multiple users could have the same Discord ID

-- Step 1: Create backup table
CREATE TABLE IF NOT EXISTS staff_users_backup_discord_unique AS SELECT * FROM staff_users;

-- Step 2: Check for duplicate discord_id values before migration
-- This query will show any duplicates that need to be resolved manually
-- SELECT discord_id, COUNT(*) as count FROM staff_users 
-- WHERE discord_id IS NOT NULL AND discord_id != ''
-- GROUP BY discord_id HAVING COUNT(*) > 1;

-- Step 3: Remove any duplicate discord_id entries (keeping the most recent one)
-- WARNING: This will delete duplicate entries. Review duplicates first!
DELETE FROM staff_users 
WHERE id NOT IN (
    SELECT MIN(id) 
    FROM staff_users 
    WHERE discord_id IS NOT NULL AND discord_id != ''
    GROUP BY discord_id
) AND discord_id IS NOT NULL AND discord_id != '';

-- Step 4: Create new table with UNIQUE constraint
CREATE TABLE staff_users_new (
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

-- Step 5: Copy data from old table to new table
INSERT INTO staff_users_new (
    id, steam_id, steam_username, discord_id, discord_username, 
    discord_discriminator, discord_avatar, discord_roles, 
    permission_level, is_active, created_at, last_login, updated_at
)
SELECT 
    id, steam_id, steam_username, discord_id, discord_username,
    discord_discriminator, discord_avatar, discord_roles,
    permission_level, is_active, created_at, last_login, updated_at
FROM staff_users;

-- Step 6: Drop old table and rename new table
DROP TABLE staff_users;
ALTER TABLE staff_users_new RENAME TO staff_users;

-- Step 7: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_staff_steam ON staff_users(steam_id);
CREATE INDEX IF NOT EXISTS idx_staff_active ON staff_users(is_active);
CREATE INDEX IF NOT EXISTS idx_staff_discord ON staff_users(discord_id);

-- Step 8: Update schema version
PRAGMA user_version = 3; -- Increment from previous version

-- Verification: Check that the UNIQUE constraint is working
-- This should return table info showing the constraint
-- PRAGMA table_info(staff_users); 