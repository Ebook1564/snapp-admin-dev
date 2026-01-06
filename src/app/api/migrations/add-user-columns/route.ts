// src/app/api/migrations/add-user-columns/route.ts
// API endpoint to automatically add status and admin_comment columns to usertable
import { NextResponse } from "next/server";
import pool from "../../../../lib/db";

export async function POST() {
  try {
    // Check if columns already exist
    const checkColumnsQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'usertable' 
      AND column_name IN ('status', 'admin_comment')
    `;
    const existingColumns = await pool.query(checkColumnsQuery);
    const existingColumnNames = existingColumns.rows.map((row) => row.column_name);

    const queries: string[] = [];
    const results: any[] = [];

    // Add status column if it doesn't exist
    if (!existingColumnNames.includes('status')) {
      queries.push(`
        ALTER TABLE usertable 
        ADD COLUMN status VARCHAR(50) DEFAULT 'interested';
      `);
      queries.push(`
        UPDATE usertable 
        SET status = 'interested' 
        WHERE status IS NULL;
      `);
      queries.push(`
        CREATE INDEX IF NOT EXISTS idx_usertable_status ON usertable(status);
      `);
    }

    // Add admin_comment column if it doesn't exist
    if (!existingColumnNames.includes('admin_comment')) {
      queries.push(`
        ALTER TABLE usertable 
        ADD COLUMN admin_comment TEXT DEFAULT '';
      `);
    }

    // Execute all queries
    for (const query of queries) {
      try {
        const result = await pool.query(query);
        results.push({ query: query.trim().substring(0, 50) + '...', success: true });
      } catch (error: any) {
        results.push({ 
          query: query.trim().substring(0, 50) + '...', 
          success: false, 
          error: error.message 
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Migration completed successfully",
        columnsAdded: {
          status: !existingColumnNames.includes('status'),
          admin_comment: !existingColumnNames.includes('admin_comment'),
        },
        results,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Migration API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Migration failed",
      },
      { status: 500 }
    );
  }
}



