import { NextResponse } from 'next/server';
import { gaClient } from '@/lib/ga-client';

export async function GET() {
    try {
        const [response] = await gaClient.getMetadata({
            name: `properties/${process.env.GA_PROPERTY_ID}/metadata`,
        });

        return NextResponse.json(response.dimensions?.filter((d: { apiName?: string | null }) => d.apiName?.includes('custom')) || []);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }

}
