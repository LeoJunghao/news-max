
const fs = require('fs');

async function run() {
    const endpoints = [
        'https://www.wantgoo.com/investrue/all-quote-info',
        'https://www.wantgoo.com/investrue/all-quote-info-light'
    ];

    for (const url of endpoints) {
        console.log(`Fetching ${url}...`);
        try {
            const res = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Referer': 'https://www.wantgoo.com/',
                    'X-Requested-With': 'XMLHttpRequest' // Common for AJAX
                }
            });

            if (!res.ok) {
                console.log(`Failed: ${res.status}`);
                continue;
            }

            const json = await res.json();
            console.log(`Success! Response keys:`, Object.keys(json));
            console.log('Sample Data:', JSON.stringify(json, null, 2).substring(0, 1000)); // Log first 1k chars
        } catch (e) {
            console.log('Error:', e.message);
        }
    }
}

run();
