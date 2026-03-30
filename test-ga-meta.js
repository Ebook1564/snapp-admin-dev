const { BetaAnalyticsDataClient } = require('@google-analytics/data');
require('dotenv').config({ path: '.env.local' });

const propertyId = '526103418';
const gaClient = new BetaAnalyticsDataClient({
    credentials: {
        client_email: process.env.GA_CLIENT_EMAIL,
        private_key: process.env.GA_PRIVATE_KEY ? process.env.GA_PRIVATE_KEY.replace(/\\n/g, '\n') : '',
    },
});

async function listCustomDimensions() {
    try {
        const [response] = await gaClient.getMetadata({
            name: `properties/${propertyId}/metadata`,
        });

        console.log('Available custom user dimensions:');
        response.dimensions.filter(d => d.apiName.startsWith('custom')).forEach(d => console.log(d.apiName));
    } catch (error) {
        console.error('Error fetching metadata:', error.message);
    }
}

listCustomDimensions();
