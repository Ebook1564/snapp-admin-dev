import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = decodeURIComponent(params.filename as string);
    console.log('🔍 Searching for:', filename);

    // ✅ FIXED: Search MULTIPLE ways + LIKE pattern
    const result = await pool.query(
      `SELECT attachment_filename, attachment_filetype, attachment_filesize 
       FROM ticket_raise 
       WHERE attachment_filename = $1 
       OR attachment_filename LIKE $2 
       OR attachment_filename LIKE $3
       LIMIT 1`,
      [filename, `%${path.basename(filename)}`, `%${filename.split('_')[0]}%`]
    );

    console.log('🔍 DB found:', result.rows.length, 'rows');

    if (result.rows.length > 0) {
      console.log('✅ DB record found:', result.rows[0]);
    }

    // ✅ Try filesystem ANYWAY (bypass DB check)
    const possiblePaths = [
      path.join(process.cwd(), 'uploads', filename),
      path.join(process.cwd(), 'public/uploads', filename),
      path.join(process.cwd(), 'public', filename),
    ];

    for (const filePath of possiblePaths) {
      console.log('🔍 Checking:', filePath);
      if (fs.existsSync(filePath)) {
        console.log('✅ FILE FOUND at:', filePath);
        const fileBuffer = fs.readFileSync(filePath);
        const uint8Array = Uint8Array.from(fileBuffer);
        
        return new NextResponse(uint8Array, {
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `inline; filename="${path.basename(filename)}"`,
            'Content-Length': uint8Array.length.toString(),
          },
        });
      }
    }

    return NextResponse.json({ 
      error: `File "${filename}" not found`, 
      checkedPaths: possiblePaths 
    }, { status: 404 });

  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
