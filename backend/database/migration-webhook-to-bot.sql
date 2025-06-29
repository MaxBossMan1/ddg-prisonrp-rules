-- Migration: Discord Webhook to Bot Integration
-- This migration adds support for Discord bot-based messaging while maintaining backward compatibility

-- Add new columns to discord_settings
ALTER TABLE discord_settings ADD COLUMN announcement_channel_id TEXT;
ALTER TABLE discord_settings ADD COLUMN rules_channel_id TEXT; 
ALTER TABLE discord_settings ADD COLUMN use_bot_instead_of_webhooks INTEGER DEFAULT 1;

-- Add new columns to discord_messages
ALTER TABLE discord_messages ADD COLUMN discord_channel_id TEXT;
ALTER TABLE discord_messages ADD COLUMN delivery_method VARCHAR(20) DEFAULT 'bot';

-- Make webhook_url nullable for backward compatibility
-- Note: This step depends on your database engine's ALTER TABLE capabilities
-- For SQLite, this requires recreating the table if NOT NULL constraint needs to be removed

-- Update existing webhook_url column to be nullable (if needed)
-- This is a complex operation in SQLite, so we'll handle it in the application migration code

-- Set default delivery method for existing records
UPDATE discord_messages SET delivery_method = 'webhook' WHERE webhook_url IS NOT NULL AND delivery_method IS NULL;
UPDATE discord_messages SET delivery_method = 'bot' WHERE webhook_url IS NULL AND delivery_method IS NULL;

-- Create an index for better performance on channel lookups
CREATE INDEX IF NOT EXISTS idx_discord_messages_channel ON discord_messages(discord_channel_id);
CREATE INDEX IF NOT EXISTS idx_discord_messages_delivery_method ON discord_messages(delivery_method); 