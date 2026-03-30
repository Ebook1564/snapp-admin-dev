import { NextResponse } from 'next/server';
import { gaClient } from '@/lib/ga-client';

export async function GET() {
    try {
        const [response] = await gaClient.getMetadata({
            name: `properties/${process.env.GA_PROPERTY_ID}/metadata`,
        });

        return NextResponse.json(response.dimensions?.filter((d: any) => d.apiName.includes('custom')) || []);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
