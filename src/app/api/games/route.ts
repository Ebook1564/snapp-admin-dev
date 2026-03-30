// src/app/api/games/route.ts
import { NextResponse } from "next/server";
import pool from "../../../lib/db";

export async function GET() {
    try {
        const result = await pool.query(
            `SELECT uid, title, thumb, categories, description, embedurl, orientation FROM gamecollection ORDER BY uid DESC`
        );

        return NextResponse.json(
            { success: true, data: result.rows },
            { status: 200 }
        );
    } catch (error: unknown) {
        console.error("API /api/games GET error:", error);
        const message = error instanceof Error ? error.message : "Database query failed";
        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        );
    }

}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log("API /api/games POST received:", body);
        const {
            title,
            thumb,
            categories,
            description,
            embedurl,
            orientation,
        } = body;

        const result = await pool.query(
            `INSERT INTO gamecollection (
        title, thumb, categories, description, embedurl, orientation
      ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [
                title,
                thumb,
                categories || [],
                description,
                embedurl,
                orientation || 'portrait',
            ]
        );

        return NextResponse.json(
            { success: true, data: result.rows[0] },
            { status: 201 }
        );
    } catch (error: unknown) {
        console.error("API /api/games POST error:", error);
        const message = error instanceof Error ? error.message : "Failed to create game";
        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        );
    }

}
