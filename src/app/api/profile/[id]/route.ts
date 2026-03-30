import { NextResponse } from "next/server";
import pool from "../../../../lib/db";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: userId } = await params;


        if (!userId) {
            return NextResponse.json(
                { success: false, error: "Profile ID is required" },
                { status: 400 }
            );
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
              COALESCE(admin_comment, '') as admin_comment,
              createdat
       FROM usertable
       WHERE id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { success: false, error: "Profile not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { success: true, data: result.rows[0] },
            { status: 200 }
        );
    } catch (error: unknown) {
        console.error("API /api/profile/[id] GET error:", error);
        const message = error instanceof Error ? error.message : "Database query failed";
        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        );
    }

}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: userId } = await params;


        if (!userId) {
            return NextResponse.json(
                { success: false, error: "Profile ID is required" },
                { status: 400 }
            );
        }

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

        const updates: string[] = [];
        const values: unknown[] = [];

        let paramIndex = 1;

        const fields = [
            { name: "username", value: username },
            { name: "useremail", value: useremail },
            { name: "phonenumber", value: phonenumber },
            { name: "countrycode", value: countrycode },
            { name: "countryname", value: countryname },
            { name: "producturl", value: producturl },
            { name: "status", value: status },
            { name: "admin_comment", value: admin_comment },
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
      UPDATE usertable
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

        const result = await pool.query(updateQuery, values);

        if (result.rows.length === 0) {
            return NextResponse.json(
                { success: false, error: "Profile not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { success: true, data: result.rows[0] },
            { status: 200 }
        );
    } catch (error: unknown) {
        console.error("API /api/profile/[id] PATCH error:", error);
        const message = error instanceof Error ? error.message : "Database update failed";
        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        );
    }

}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: userId } = await params;


        if (!userId) {
            return NextResponse.json(
                { success: false, error: "Profile ID is required" },
                { status: 400 }
            );
        }

        const deleteResult = await pool.query(
            `DELETE FROM usertable WHERE id = $1 RETURNING id`,
            [userId]
        );

        if (deleteResult.rows.length === 0) {
            return NextResponse.json(
                { success: false, error: "Profile not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { success: true, message: "Profile deleted successfully" },
            { status: 200 }
        );
    } catch (error: unknown) {
        console.error("API /api/profile/[id] DELETE error:", error);
        const message = error instanceof Error ? error.message : "Database delete failed";
        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        );
    }

}
