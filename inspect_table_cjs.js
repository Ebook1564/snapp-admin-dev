
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Basic env parser since dotenv might be having issues
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...rest] = line.split('=');
    if (key && rest.length > 0) {
        let value = rest.join('=').trim();
        if (value.includes('#')) {
            value = value.split('#')[0].trim();
        }
        env[key.trim()] = value;
    }
});

const pool = new Pool({
    host: env.DB_HOST,
    port: parseInt(env.DB_PORT || "5432", 10),
    database: env.DB_NAME,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false },
});

async function inspectTable() {
    try {
        console.log('--- Columns & Types ---');
        const columns = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'userdatatable'
        `);
        console.table(columns.rows);

        console.log('\n--- Constraints ---');
        const constraints = await pool.query(`
            SELECT conname, pg_get_constraintdef(c.oid)
            FROM pg_constraint c 
            JOIN pg_namespace n ON n.oid = c.connamespace 
            WHERE c.conrelid = 'public.userdatatable'::regclass
        `);
        console.table(constraints.rows);

        console.log('\n--- Sequence Check ---');
        const seq = await pool.query(`
            SELECT pg_get_serial_sequence('gamecollection', 'uid') as seq_name
        `);
        console.log('Sequence for uid:', seq.rows[0]);

        console.log('\n--- Migration ---');
        try {
            await pool.query(`
                ALTER TABLE userdatatable 
                ADD COLUMN IF NOT EXISTS settlement_status VARCHAR(20) DEFAULT 'pending'
            `);
            console.log('Column settlement_status ensured.');
        } catch (mErr) {
            console.error('Migration error:', mErr.message);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

inspectTable();
