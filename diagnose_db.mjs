import pool from './src/lib/db.ts';

async function diagnose() {
    try {
        console.log("--- Checking table structure for 'gamecollection' ---");
        const columns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'gamecollection'
      ORDER BY ordinal_position;
    `);

        if (columns.rows.length === 0) {
            console.log("Table 'gamecollection' not found or has no columns.");
        } else {
            console.log("Columns found:");
            columns.rows.forEach(col => {
                console.log(` - ${col.column_name} (${col.data_type})`);
            });
        }

        console.log("\n--- Fetching sample row ---");
        const sample = await pool.query(`SELECT * FROM gamecollection LIMIT 1`);
        if (sample.rows.length === 0) {
            console.log("No data found in 'gamecollection'.");
        } else {
            console.log("Sample row JSON:");
            console.log(JSON.stringify(sample.rows[0], null, 2));
        }

        process.exit(0);
    } catch (err) {
        console.error("Diagnosis failed:", err);
        process.exit(1);
    }
}

diagnose();
