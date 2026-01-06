
import { config } from 'dotenv';
import path from 'path';
import pg from 'pg';

// Load env from .env.local
config({ path: path.resolve(process.cwd(), '.env.local') });

const { Pool } = pg;

const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || "5432", 10),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false },
});

async function inspectTable() {
    try {
        console.log('--- Columns & Types ---');
        const columns = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'gamecollection'
        `);
        console.table(columns.rows);

        console.log('\n--- Constraints ---');
        const constraints = await pool.query(`
            SELECT conname, pg_get_constraintdef(c.oid)
            FROM pg_constraint c 
            JOIN pg_namespace n ON n.oid = c.connamespace 
            WHERE c.conrelid = 'public.gamecollection'::regclass
        `);
        console.table(constraints.rows);

        console.log('\n--- Sequence Check ---');
        // Check if uid has a sequence attached
        const seq = await pool.query(`
            SELECT pg_get_serial_sequence('gamecollection', 'uid') as seq_name
        `);
        console.log('Sequence for uid:', seq.rows[0]);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

inspectTable();
