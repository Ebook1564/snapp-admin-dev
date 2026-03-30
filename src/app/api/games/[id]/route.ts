// src/app/api/games/[id]/route.ts
import { NextResponse } from "next/server";
import pool from "../../../../lib/db";

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = await params;
        const result = await pool.query(
            `SELECT uid, title, thumb, categories, description, embedurl, orientation FROM gamecollection WHERE uid = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { success: false, error: "Game not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { success: true, data: result.rows[0] },
            { status: 200 }
        );
    } catch (error: unknown) {
        console.error("API /api/games/[id] GET error:", error);
        const message = error instanceof Error ? error.message : "Database query failed";
        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        );
    }

}

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        // Dynamically build the update query
        // Filter out id/uid and ensure only valid columns are updated
        const validColumns = ['title', 'thumb', 'categories', 'description', 'embedurl', 'orientation'];
        const fields = Object.keys(body).filter(key => validColumns.includes(key));

        if (fields.length === 0) {
            return NextResponse.json(
                { success: false, error: "No valid fields to update" },
                { status: 400 }
            );
        }

        const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
        const values = fields.map(field => body[field]);

        const result = await pool.query(
            `UPDATE gamecollection SET ${setClause} WHERE uid = $1 RETURNING *`,
            [id, ...values]
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { success: false, error: "Game not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { success: true, data: result.rows[0] },
            { status: 200 }
        );
    } catch (error: unknown) {
        console.error("API /api/games/[id] PATCH error:", error);
        const message = error instanceof Error ? error.message : "Failed to update game";
        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        );
    }

}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = await params;
        const result = await pool.query(
            `DELETE FROM gamecollection WHERE uid = $1 RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { success: false, error: "Game not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { success: true, message: "Game deleted successfully" },
            { status: 200 }
        );
    } catch (error: unknown) {
        console.error("API /api/games/[id] DELETE error:", error);
        const message = error instanceof Error ? error.message : "Failed to delete game";
        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        );
    }

}
