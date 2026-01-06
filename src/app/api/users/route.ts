// src/app/api/users/route.ts
import { NextResponse } from "next/server";
import pool from "../../../lib/db";

export async function GET() {
  try {
    // First, try to ensure columns exist
    try {
      await pool.query(`
        SELECT status, admin_comment FROM usertable LIMIT 1
      `);
    } catch (columnError: any) {
      // If columns don't exist, try to add them automatically
      if (columnError?.message?.includes('column') && columnError?.message?.includes('does not exist')) {
        console.log("Columns missing, attempting to add them automatically...");
        try {
          // Add status column
          await pool.query(`
            ALTER TABLE usertable 
            ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'interested'
          `);
          await pool.query(`
            UPDATE usertable SET status = 'interested' WHERE status IS NULL
          `);
          await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_usertable_status ON usertable(status)
          `);
          
          // Add admin_comment column
          await pool.query(`
            ALTER TABLE usertable 
            ADD COLUMN IF NOT EXISTS admin_comment TEXT DEFAULT ''
          `);
          console.log("Columns added successfully");
        } catch (migrationError: any) {
          console.error("Failed to add columns automatically:", migrationError);
          // Continue to return error
        }
      }
    }

    const result = await pool.query(
      `SELECT id,
              username,
              useremail,
              phonenumber,
              countrycode,
              countryname,
              producturl,
              COALESCE(status, 'interested') as status,
              COALESCE(admin_comment, '') as admin_comment
       FROM usertable
       ORDER BY id DESC`
    );

    return NextResponse.json(
      { success: true, data: result.rows },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("API /api/users GET error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Database query failed" },
      { status: 500 }
    );
  }
}
