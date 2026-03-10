// src/app/api/users/[id]/route.ts
import { NextResponse } from "next/server";
import pool from "../../../../lib/db";

export async function GET(
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
       WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: result.rows[0] },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("API /api/users/[id] GET error:", error);
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
    const {
      useremail,
      today_revenue,
      yesterday_revenue,
      last_7d_revenue,
      this_month_revenue,
      last_28d_revenue,
      settlement_status,
    } = body;

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const fields = [
      { name: "useremail", value: useremail },
      { name: "today_revenue", value: today_revenue },
      { name: "yesterday_revenue", value: yesterday_revenue },
      { name: "last_7d_revenue", value: last_7d_revenue },
      { name: "this_month_revenue", value: this_month_revenue },
      { name: "last_28d_revenue", value: last_28d_revenue },
      { name: "settlement_status", value: settlement_status },
    ];

    fields.forEach((field) => {
      if (field.value !== undefined) {
        updates.push(`${field.name} = $${paramIndex}`);
        values.push(field.value);
        paramIndex++;
      }
    });

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: "No fields to update" },
        { status: 400 }
      );
    }

    values.push(userId);
    const updateQuery = `
      UPDATE userdatatable
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(updateQuery, values);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: result.rows[0] },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("API /api/users/[id] PATCH error:", error);
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

    const deleteResult = await pool.query(
      `DELETE FROM userdatatable WHERE id = $1 RETURNING id`,
      [userId]
    );

    if (deleteResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Record deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("API /api/users/[id] DELETE error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Database delete failed" },
      { status: 500 }
    );
  }
}

