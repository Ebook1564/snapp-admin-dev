// src/app/api/passwords/route.ts
import { NextRequest, NextResponse } from "next/server";
import pool from "../../../lib/db";

// GET - Fetch all saved passwords
export async function GET(_request: NextRequest) {

  try {
    const query = `
      SELECT id, email, password, created_at
      FROM saved_passwords
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query);
    
    return NextResponse.json(
      { success: true, data: result.rows },
      { status: 200 }
    );
    } catch (error: unknown) {
      console.error("GET /api/passwords error:", error);
      const errorMessage = error instanceof Error ? error.message : "";
      
      // If table doesn't exist, return empty array
      if (errorMessage.includes("does not exist")) {
        return NextResponse.json(
          { success: true, data: [] },
          { status: 200 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: "Failed to fetch passwords" },
        { status: 500 }
      );
    }

}

// POST - Save a new password
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check if email exists in usertable
    const userCheckQuery = `
      SELECT id, useremail
      FROM usertable
      WHERE LOWER(useremail) = LOWER($1)
      LIMIT 1
    `;
    
    const userCheckResult = await pool.query(userCheckQuery, [email]);
    
    if (userCheckResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "This email does not exist in the user database. Only registered users can have passwords saved." },
        { status: 404 }
      );
    }

    // Check if table exists, if not create it
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS saved_passwords (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) NOT NULL,
          password TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } catch (createError: unknown) {
      const errorMessage = createError instanceof Error ? createError.message : "";
      // Table might already exist, continue
      if (!errorMessage.includes("already exists")) {
        console.error("Error creating table:", createError);
      }
    }


    // Check if email already exists in saved_passwords (prevent duplicates)
    const duplicateCheckQuery = `
      SELECT id FROM saved_passwords
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
    `;
    
    const duplicateCheckResult = await pool.query(duplicateCheckQuery, [email]);
    
    if (duplicateCheckResult.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: "This email already has a saved password. Please use a different email or update the existing one." },
        { status: 409 }
      );
    }

    const query = `
      INSERT INTO saved_passwords (email, password)
      VALUES ($1, $2)
      RETURNING id, email, password, created_at
    `;
    
    const result = await pool.query(query, [email, password]);
    
    return NextResponse.json(
      { success: true, data: result.rows[0] },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("POST /api/passwords error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to save password";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }

}



