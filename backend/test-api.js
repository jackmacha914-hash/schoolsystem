const fetch = require('node-fetch');

async function testApi() {
    try {
        // Test the debug endpoint
        const debugUrl = 'http://localhost:5000/api/marks/debug';
        console.log(`Testing ${debugUrl}...`);
        const debugResponse = await fetch(debugUrl);
        const debugData = await debugResponse.text();
        console.log('Debug endpoint response:', debugData);

        // Test the report card endpoint
        const reportCardUrl = 'http://localhost:5000/api/marks/report-card/12345';
        console.log(`\nTesting ${reportCardUrl}...`);
        const response = await fetch(reportCardUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ term: 'Term 1' })
        });
        
        const data = await response.text();
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries([...response.headers.entries()]));
        console.log('Response body:', data);
        
    } catch (error) {
        console.error('Error testing API:', error);
    }
}

testApi();
