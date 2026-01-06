// src/app/api/users/[id]/route.ts
import { NextResponse } from "next/server";
import pool from "../../../../lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle both sync and async params (Next.js 13+ uses async params)
    const resolvedParams = await Promise.resolve(params);
    const userId = resolvedParams?.id;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    // Ensure columns exist before querying
    try {
      await pool.query(`SELECT status, admin_comment FROM usertable WHERE id = $1 LIMIT 1`, [userId]);
    } catch (columnError: any) {
      if (columnError?.message?.includes('column') && columnError?.message?.includes('does not exist')) {
        // Add columns if they don't exist
        await pool.query(`ALTER TABLE usertable ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'interested'`);
        await pool.query(`ALTER TABLE usertable ADD COLUMN IF NOT EXISTS admin_comment TEXT DEFAULT ''`);
        await pool.query(`UPDATE usertable SET status = 'interested' WHERE status IS NULL`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_usertable_status ON usertable(status)`);
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
       WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: result.rows[0] },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("API /api/users/[id] GET error:", error);
    // Check if error is due to missing columns
    if (error?.message?.includes('column') && error?.message?.includes('does not exist')) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Database columns 'status' or 'admin_comment' do not exist. Please run the migration script first." 
        },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { success: false, error: error?.message || "Database query failed" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const userId = resolvedParams?.id;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status, admin_comment } = body;

    // Ensure columns exist before updating
    try {
      await pool.query(`SELECT status, admin_comment FROM usertable WHERE id = $1 LIMIT 1`, [userId]);
    } catch (columnError: any) {
      if (columnError?.message?.includes('column') && columnError?.message?.includes('does not exist')) {
        // Add columns if they don't exist
        await pool.query(`ALTER TABLE usertable ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'interested'`);
        await pool.query(`ALTER TABLE usertable ADD COLUMN IF NOT EXISTS admin_comment TEXT DEFAULT ''`);
        await pool.query(`UPDATE usertable SET status = 'interested' WHERE status IS NULL`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_usertable_status ON usertable(status)`);
      }
    }

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    if (admin_comment !== undefined) {
      updates.push(`admin_comment = $${paramIndex}`);
      values.push(admin_comment);
      paramIndex++;
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: "No fields to update" },
        { status: 400 }
      );
    }

    values.push(userId);
    const updateQuery = `
      UPDATE usertable
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, username, useremail, phonenumber, countrycode, countryname, producturl, 
                COALESCE(status, 'interested') as status, COALESCE(admin_comment, '') as admin_comment
    `;

    const result = await pool.query(updateQuery, values);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: result.rows[0] },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("API /api/users/[id] PATCH error:", error);
    // Check if error is due to missing columns
    if (error?.message?.includes('column') && error?.message?.includes('does not exist')) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Database columns 'status' or 'admin_comment' do not exist. Please run the migration script first." 
        },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { success: false, error: error?.message || "Database update failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const userId = resolvedParams?.id;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    // Use a transaction to ensure atomic deletion
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // First, check if user exists
      const userResult = await client.query(
        `SELECT useremail FROM usertable WHERE id = $1`,
        [userId]
      );

      if (userResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { success: false, error: "User not found" },
          { status: 404 }
        );
      }

      const userEmail = userResult.rows[0].useremail;

      // Delete related records from saved_passwords table
      // Try deleting by user_id first (foreign key constraint suggests this column exists)
      try {
        const deleteByUserId = await client.query(
          `DELETE FROM saved_passwords WHERE user_id = $1`,
          [userId]
        );
        console.log(`Deleted ${deleteByUserId.rowCount} saved_passwords records by user_id`);
      } catch (userIdError: any) {
        // If user_id column doesn't exist, try email-based deletion
        if (userIdError?.message?.includes('column') && userIdError?.message?.includes('does not exist')) {
          try {
            const deleteByEmail = await client.query(
              `DELETE FROM saved_passwords WHERE LOWER(email) = LOWER($1)`,
              [userEmail]
            );
            console.log(`Deleted ${deleteByEmail.rowCount} saved_passwords records by email`);
          } catch (emailError: any) {
            // If saved_passwords table doesn't exist, that's okay - continue
            if (!emailError?.message?.includes('does not exist')) {
              console.warn("Could not delete from saved_passwords by email:", emailError);
              // Don't throw - continue with user deletion
            }
          }
        } else {
          // If it's a different error, try email-based deletion as fallback
          try {
            const deleteByEmail = await client.query(
              `DELETE FROM saved_passwords WHERE LOWER(email) = LOWER($1)`,
              [userEmail]
            );
            console.log(`Deleted ${deleteByEmail.rowCount} saved_passwords records by email (fallback)`);
          } catch (emailError: any) {
            console.warn("Could not delete from saved_passwords:", emailError);
            // Don't throw - continue with user deletion
          }
        }
      }

      // Now delete the user from usertable
      const deleteResult = await client.query(
        `DELETE FROM usertable WHERE id = $1 RETURNING id`,
        [userId]
      );

      if (deleteResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { success: false, error: "User not found" },
          { status: 404 }
        );
      }

      // Commit the transaction
      await client.query('COMMIT');

      return NextResponse.json(
        { success: true, message: "User deleted successfully" },
        { status: 200 }
      );
    } catch (error: any) {
      // Rollback transaction on error
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error("Error rolling back transaction:", rollbackError);
      }
      
      console.error("API /api/users/[id] DELETE error:", error);
      
      // Check if it's a foreign key constraint error
      if (error?.message?.includes('foreign key constraint')) {
        return NextResponse.json(
          { 
            success: false, 
            error: "Cannot delete user. Please delete related records first or contact support." 
          },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: error?.message || "Database delete failed" },
        { status: 500 }
      );
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (error: any) {
    // Handle errors that occur before getting the client (e.g., pool connection errors)
    console.error("API /api/users/[id] DELETE error (outer):", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Database delete failed" },
      { status: 500 }
    );
  }
}

