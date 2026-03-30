import { NextResponse } from 'next/server';
import { gaClient } from '@/lib/ga-client';
import pool from '@/lib/db';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const secretParam = searchParams.get('secret');
    const authHeader = request.headers.get('authorization');

    const isValidHeader = authHeader === `Bearer ${process.env.ADMIN_API_SECRET}`;
    const isValidParam = secretParam === process.env.ADMIN_API_SECRET;

    if (!isValidHeader && !isValidParam) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 1. Fetch real revenue data by joining usertable and userdatatable
        // We use usertable for the identity (ID) and join on email for metrics
        const dbResult = await pool.query(
            `SELECT 
                u.id, 
                u.useremail, 
                d.this_month_revenue, 
                d.today_revenue 
             FROM usertable u
             LEFT JOIN userdatatable d ON u.useremail = d.useremail
             WHERE u.id = $1`,
            [id]
        );
        const userData = dbResult.rows[0];

        if (!userData) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // 2. Fetch traffic data from Google Analytics (with fallback)
        let totalSessions = 0;
        let totalImpressions = 0;
        const trend: any[] = [];

        try {
            const [response] = await gaClient.runReport({
                property: `properties/${process.env.GA_PROPERTY_ID}`,
                dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
                dimensions: [{ name: 'date' }],
                metrics: [
                    { name: 'sessions' },
                    { name: 'eventCount' }
                ],
                dimensionFilter: {
                    filter: {
                        fieldName: 'customEvent:partner_uid',
                        stringFilter: {
                            matchType: 'EXACT',
                            value: id
                        }
                    }
                }
            });

            // Parse Google Analytics rows
            response.rows?.forEach((row: any) => {
                const sessions = Number(row.metricValues[0]?.value || 0);
                const impressions = Number(row.metricValues[1]?.value || 0);
                totalSessions += sessions;
                totalImpressions += impressions;
                trend.push({
                    date: row.dimensionValues[0].value,
                    sessions,
                    impressions
                });
            });
        } catch (gaError: any) {
            console.warn('GA4 Fetch Failed (likely due to unregistered custom dimension):', gaError.message);
            // We continue without GA data so the dashboard still shows revenue
        }

        // 3. Combine Data
        const summary = {
            id,
            useremail: userData.useremail,
            totalSessions,
            totalImpressions,
            revenueShare: Number(userData.this_month_revenue || 0),
            todayRevenue: Number(userData.today_revenue || 0),
            trend,
            gaStatus: trend.length > 0 ? 'connected' : 'pending_setup'
        };

        return NextResponse.json(summary);
    } catch (error: any) {
        console.error('General API Error:', error);
        return NextResponse.json({
            error: 'Failed to fetch user data',
            details: error?.message || 'Unknown error'
        }, { status: 500 });
    }
}
