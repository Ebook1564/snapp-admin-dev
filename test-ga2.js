const { BetaAnalyticsDataClient } = require('@google-analytics/data');

const propertyId = '526103418';
require('dotenv').config({ path: '.env.local' });

const gaClient = new BetaAnalyticsDataClient({
    credentials: {
        client_email: process.env.GA_CLIENT_EMAIL,
        private_key: process.env.GA_PRIVATE_KEY ? process.env.GA_PRIVATE_KEY.replace(/\\n/g, '\n') : '',
    },
});

async function runReport() {
    try {
        const [response] = await gaClient.runReport({
            property: `properties/${propertyId}`,
            dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
            dimensions: [{ name: 'date' }],
            metrics: [
                { name: 'sessions' },
                { name: 'eventCount' }  // impressions
            ],
            dimensionFilter: {
                filter: {
                    fieldName: 'customUser:partnerId',
                    stringFilter: { matchType: 'EXACT', value: 'partner123' }
                }
            }
        });

        console.log('Success:', response);
    } catch (error) {
        console.error('GA Data API Error:', error);
    }
}

runReport();
