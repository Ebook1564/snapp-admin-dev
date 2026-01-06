import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../../lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = decodeURIComponent(params.filename as string);
    console.log('🔍 Requested:', filename);

    // ✅ FIXED: Query for BINARY DATA (bytea column)
    const result = await pool.query(
      `SELECT 
        attachment_filename, 
        attachment_filetype,
        attachment_filesize,
        attachment_data  -- YOUR BYTEA COLUMN (binary file data)
       FROM ticket_raise 
       WHERE attachment_filename = $1 
       LIMIT 1`,
      [filename]
    );

    console.log('🔍 DB rows:', result.rows.length);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'File not found in database' }, { status: 404 });
    }

    const row = result.rows[0];
    console.log('🔍 Found record:', row.attachment_filename);

    // ✅ CRITICAL: Check if binary data exists
    if (!row.attachment_data) {
      console.log('❌ No binary data in attachment_data column');
      return NextResponse.json({ error: 'No file data in database' }, { status: 404 });
    }

    // ✅ Convert PostgreSQL bytea (hex string) to Buffer
    let fileBuffer: Buffer;
    
    // Handle different bytea formats
    if (typeof row.attachment_data === 'string') {
      if (row.attachment_data.startsWith('\\x')) {
        // PostgreSQL hex format
        fileBuffer = Buffer.from(row.attachment_data.slice(2), 'hex');
      } else {
        // Raw hex string
        fileBuffer = Buffer.from(row.attachment_data, 'hex');
      }
    } else {
      // Already Buffer
      fileBuffer = Buffer.from(row.attachment_data as any);
    }

    console.log('✅ Binary data loaded:', fileBuffer.length, 'bytes');

    const uint8Array = Uint8Array.from(fileBuffer);
    const contentType = row.attachment_filetype || 'application/octet-stream';

    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${filename}"`,
        'Content-Length': uint8Array.length.toString(),
        'Cache-Control': 'public, max-age=3600',
      },
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
