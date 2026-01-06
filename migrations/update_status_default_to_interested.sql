-- Migration: Update status default to 'interested'
-- Date: 2025-01-XX
-- Description: Changes the default status value from 'ongoing' to 'interested' and updates existing NULL values

-- Update the default value for the status column
ALTER TABLE usertable 
ALTER COLUMN status SET DEFAULT 'interested';

-- Update existing rows that have NULL status to 'interested'
UPDATE usertable 
SET status = 'interested' 
WHERE status IS NULL;

-- Update the column comment to include 'interested' as a status option
COMMENT ON COLUMN usertable.status IS 'User status: interested (default), ongoing, Hold, Declined';



