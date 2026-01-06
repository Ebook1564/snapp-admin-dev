// src/app/api/tickets/route.ts
import { NextRequest, NextResponse } from "next/server";
import pool from "../../../lib/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const category = formData.get("category") as string;
    const description = formData.get("description") as string;
    const attachment = formData.get("attachment") as File | null;
    const attachment_filename = formData.get("attachment_filename") as string;

    // Validation
    if (!category || !description) {
      return NextResponse.json(
        { success: false, error: "Category and description are required" },
        { status: 400 }
      );
    }

    // Handle file upload
    let final_filename: string | null = null;
    let final_filetype: string | null = null;
    let final_filesize: number | null = null;

    if (attachment && attachment_filename !== "null") {
      const extension = path.extname(attachment_filename).slice(1).toLowerCase();
      const allowedExtensions = ["pdf", "jpg", "jpeg", "png"];

      if (!allowedExtensions.includes(extension)) {
        return NextResponse.json(
          { success: false, error: "Only PDF, JPG, PNG files allowed" },
          { status: 400 }
        );
      }

      if (attachment.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: "File size must be under 10MB" },
          { status: 400 }
        );
      }

      // Save file
      const uniqueId = randomUUID();
      final_filename = `${uniqueId}_${attachment_filename}`;
      final_filetype = extension;
      final_filesize = Number(attachment.size);

      const uploadsDir = path.join(process.cwd(), "public", "uploads", "tickets");
      const filePath = path.join(uploadsDir, final_filename);

      await mkdir(uploadsDir, { recursive: true });
      const buffer = Buffer.from(await attachment.arrayBuffer());
      await writeFile(filePath, buffer);
    }

    // Save to database
    const query = `
      INSERT INTO ticket_raise (category, description, attachment_filename, 
                               attachment_filetype, attachment_filesize, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [category, description, final_filename, final_filetype, final_filesize, "open"];
    const result = await pool.query(query, values);

    return NextResponse.json(
      { success: true, data: result.rows[0] },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("POST /api/tickets error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create ticket" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const statusFilter = searchParams.get("status") || "";
    const search = searchParams.get("search") || "";

    const offset = (page - 1) * limit;

    // Build conditions
    let conditions: string[] = [];
    let params: any[] = [];

    if (statusFilter && statusFilter !== "all") {
      conditions.push(`status = $${params.length + 1}`);
      params.push(statusFilter);
    }

    if (search.trim()) {
      conditions.push(`(
        LOWER(category) LIKE $${params.length + 1} OR 
        LOWER(description) LIKE $${params.length + 1}
      )`);
      params.push(`%${search.toLowerCase()}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM ticket_raise 
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Fetch tickets
    const ticketsQuery = `
      SELECT id, category, description, attachment_filename, 
             attachment_filetype, attachment_filesize, status, created_at
      FROM ticket_raise 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    params.push(limit, offset);
    const ticketsResult = await pool.query(ticketsQuery, params);

    return NextResponse.json({
      success: true,
      data: {
        tickets: ticketsResult.rows,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error("GET /api/tickets error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tickets" },
      { status: 500 }
    );
  }
}
