// src/app/api/users/route.ts
import { NextResponse } from "next/server";
import pool from "../../../lib/db";

export async function GET() {
  try {
    const result = await pool.query(
      `SELECT id,
              useremail,
              today_revenue,
              yesterday_revenue,
              last_7d_revenue,
              this_month_revenue,
              last_28d_revenue,
              settlement_status,
              created_at
       FROM userdatatable
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      useremail,
      today_revenue,
      yesterday_revenue,
      last_7d_revenue,
      this_month_revenue,
      last_28d_revenue,
      settlement_status
    } = body;

    const result = await pool.query(
      `INSERT INTO userdatatable (
        useremail, today_revenue, yesterday_revenue, last_7d_revenue, this_month_revenue, last_28d_revenue, settlement_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        useremail,
        today_revenue || 0,
        yesterday_revenue || 0,
        last_7d_revenue || 0,
        this_month_revenue || 0,
        last_28d_revenue || 0,
        settlement_status || 'pending'
      ]
    );

    return NextResponse.json(
      { success: true, data: result.rows[0] },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("API /api/users POST error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create user data entry" },
      { status: 500 }
    );
  }
}
