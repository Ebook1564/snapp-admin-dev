-- Migration: Add status and admin_comment columns to usertable
-- Date: 2025-01-01
-- Description: Adds status and admin_comment columns to track user status and admin comments

-- Add status column with default value 'ongoing'
ALTER TABLE usertable 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'interested';

-- Add admin_comment column for admin notes
ALTER TABLE usertable 
ADD COLUMN IF NOT EXISTS admin_comment TEXT DEFAULT '';

-- Create index on status for better query performance
CREATE INDEX IF NOT EXISTS idx_usertable_status ON usertable(status);

-- Update existing rows to have 'ongoing' status if they don't have one
UPDATE usertable 
SET status = 'interested' 
WHERE status IS NULL;

-- Comments for documentation
COMMENT ON COLUMN usertable.status IS 'User status: ongoing, Hold, Declined';
COMMENT ON COLUMN usertable.admin_comment IS 'Admin comments/notes about the user, only visible to admins';

