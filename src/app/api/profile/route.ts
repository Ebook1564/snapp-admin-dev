import { NextResponse } from "next/server";
import pool from "../../../lib/db";

export async function GET() {
    try {
        const result = await pool.query(
            `SELECT id,
              username,
              useremail,
              phonenumber,
              countrycode,
              countryname,
              producturl,
              COALESCE(status, 'interested') as status,
              COALESCE(admin_comment, '') as admin_comment,
              createdat
       FROM usertable
       ORDER BY id DESC`
        );

        return NextResponse.json(
            { success: true, data: result.rows },
            { status: 200 }
        );
    } catch (error: unknown) {
        console.error("API /api/profile GET error:", error);
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
        const {
            username,
            useremail,
            phonenumber,
            countrycode,
            countryname,
            producturl,
            status,
            admin_comment,
        } = body;

        const result = await pool.query(
            `INSERT INTO usertable (
        username, useremail, phonenumber, countrycode, countryname, producturl, status, admin_comment
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
            [
                username,
                useremail,
                phonenumber,
                countrycode,
                countryname,
                producturl,
                status || "interested",
                admin_comment || "",
            ]
        );

        return NextResponse.json(
            { success: true, data: result.rows[0] },
            { status: 201 }
        );
    } catch (error: unknown) {
        console.error("API /api/profile POST error:", error);
        const message = error instanceof Error ? error.message : "Failed to create profile";
        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        );
    }

}
