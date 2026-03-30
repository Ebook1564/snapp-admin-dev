// src/app/api/tickets/[id]/route.ts - COMPLETE FIXED VERSION
// Handles JSON, FormData, status="pending", all edge cases

import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

// GET - Fetch single ticket (unchanged)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ticketId = parseInt(params.id);
    
    if (isNaN(ticketId)) {
      return NextResponse.json(
        { success: false, error: "Invalid ticket ID" },
        { status: 400 }
      );
    }

    const query = `
      SELECT id, category, description, attachment_filename, 
             attachment_filetype, attachment_filesize, status, 
             created_at, updated_at
      FROM ticket_raise 
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [ticketId]);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Ticket not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error: unknown) {
    console.error("GET error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch ticket";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

interface TicketUpdateBody {
  status?: string;
  description?: string;
  [key: string]: string | undefined;
}


// PUT - ✅ FIXED: Handles JSON/FormData, "pending" status, CURRENT_TIMESTAMP
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ticketId = parseInt(params.id);
    
    if (isNaN(ticketId)) {
      return NextResponse.json(
        { success: false, error: "Invalid ticket ID" },
        { status: 400 }
      );
    }

    // ✅ PARSE ANY BODY TYPE (JSON, FormData, text)
    let body: TicketUpdateBody = {};

    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      body = await request.json();
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      for (const [key, value] of formData.entries()) {
        body[key] = value.toString();  // Convert File to string if needed
      }
    } else {
      // Fallback for plain text/raw
      const text = await request.text();
      if (text.trim()) {
        body = JSON.parse(text);
      }
    }

    console.log("✅ Parsed body:", body);

    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json(
        { success: false, error: "No update data provided" },
        { status: 400 }
      );
    }

    // ✅ Validate status values
    const validStatuses = ["open", "pending", "resolved", "closed"];
    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // ✅ Build dynamic UPDATE query
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;


    if (body.status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      values.push(body.status);
      paramIndex++;
    }

    if (body.description !== undefined && body.description !== '') {
      updates.push(`description = $${paramIndex}`);
      values.push(body.description);
      paramIndex++;
    }

    // ✅ FIXED: CURRENT_TIMESTAMP - NO PARAMETER NEEDED
    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    if (updates.length === 1) {  // Only timestamp = no real changes
      return NextResponse.json(
        { success: false, error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Final query with WHERE id
    const query = `
      UPDATE ticket_raise 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, category, description, attachment_filename, 
                attachment_filetype, attachment_filesize, status, 
                created_at, updated_at
    `;

    values.push(ticketId);
    
    console.log("🔍 Executing:", query);
    console.log("📊 Values:", values);

    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Ticket not found or no changes made" },
        { status: 404 }
      );
    }

    console.log("✅ UPDATED:", result.rows[0]);

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: "Ticket updated successfully!"
    });

  } catch (error: unknown) {
    console.error("❌ PUT /api/tickets/[id] ERROR:", error);
    const message = error instanceof Error ? error.message : "Failed to update ticket";
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to update ticket",
        details: message 
      },
      { status: 500 }
    );
  }
}

