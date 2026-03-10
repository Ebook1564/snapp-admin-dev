import pool from "./src/lib/db.js"; // This might need adjustment if run from root

async function migrate() {
    try {
        console.log("Checking if settlement_status exists...");
        const check = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'userdatatable' AND column_name = 'settlement_status'
        `);

        if (check.rows.length === 0) {
            console.log("Adding settlement_status column...");
            await pool.query(`
                ALTER TABLE userdatatable 
                ADD COLUMN settlement_status VARCHAR(20) DEFAULT 'pending'
            `);
            console.log("Column added successfully.");
        } else {
            console.log("Column settlement_status already exists.");
        }
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrate();
