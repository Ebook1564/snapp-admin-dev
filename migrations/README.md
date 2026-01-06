# Database Migrations

## Adding Status and Admin Comment Columns to User Table

This migration adds two new columns to the `usertable`:
- `status`: VARCHAR(50) - User status (active, inactive, pending, suspended)
- `admin_comment`: TEXT - Admin comments/notes about the user

### Running the Migration

1. **Using psql (PostgreSQL CLI):**
   ```bash
   psql -h <DB_HOST> -U <DB_USER> -d <DB_NAME> -f migrations/add_user_status_and_comment.sql
   ```

2. **Using a database management tool:**
   - Open the SQL file `migrations/add_user_status_and_comment.sql`
   - Copy and paste the contents into your database management tool (pgAdmin, DBeaver, etc.)
   - Execute the script

3. **Using Node.js/TypeScript:**
   ```typescript
   import pool from './lib/db';
   import fs from 'fs';
   
   const migrationSQL = fs.readFileSync('migrations/add_user_status_and_comment.sql', 'utf8');
   await pool.query(migrationSQL);
   ```

### What the Migration Does

- Adds `status` column with default value 'active'
- Adds `admin_comment` column (empty string by default)
- Creates an index on `status` for better query performance
- Updates existing rows to have 'active' status
- Adds column comments for documentation

### Notes

- The migration uses `IF NOT EXISTS` clauses, so it's safe to run multiple times
- Existing data will not be affected
- Default status for all existing users will be set to 'active'





