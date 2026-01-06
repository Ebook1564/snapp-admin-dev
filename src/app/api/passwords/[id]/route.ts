// src/app/api/passwords/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import pool from "../../../../lib/db";

// DELETE - Delete a saved password
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle both Promise and direct params (for Next.js compatibility)
    const resolvedParams = params instanceof Promise ? await params : params;
    const id = parseInt(resolvedParams.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid password ID" },
        { status: 400 }
      );
    }

    const query = `
      DELETE FROM saved_passwords
      WHERE id = $1
      RETURNING id
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Password not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { success: true, message: "Password deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("DELETE /api/passwords/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete password" },
      { status: 500 }
    );
  }
}

