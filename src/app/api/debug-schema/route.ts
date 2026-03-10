// src/app/api/debug-schema/route.ts
import { NextResponse } from "next/server";
import pool from "../../../lib/db";

export async function GET() {
    try {
        const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'usertable'
      ORDER BY ordinal_position;
    `);

        const rows = await pool.query(`SELECT * FROM usertable LIMIT 1`);

        return NextResponse.json({
            success: true,
            columns: res.rows,
            sampleRow: rows.rows[0]
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message });
    }
}
