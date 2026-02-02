
const fs = require('fs');

async function run() {
    const url = 'https://www.wantgoo.com/investrue/all-quote-info';
    console.log(`Fetching ${url}...`);
    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://www.wantgoo.com/',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        if (!res.ok) {
            console.log(`Failed: ${res.status}`);
            return;
        }

        const json = await res.json(); // Array of objects like { id, close, open... }
        console.log(`Total items: ${json.length}`);

        // Targets from screenshot (approximate)
        // Weighted: ~31417
        // OTC: ~292
        // SGX: ~2530
        // TX (Futures): ~31442
        // TX After: ~31889

        const targets = [
            { name: 'Weighted', price: 31417, tolerance: 5000 },
            { name: 'OTC', price: 292, tolerance: 50 },
            { name: 'SGX', price: 2530, tolerance: 500 },
            { name: 'TX', price: 31442, tolerance: 5000 },
            { name: 'TX_After', price: 31889, tolerance: 5000 }
        ];

        console.log('--- Candidates ---');
        json.forEach(item => {
            const price = item.close || item.deal || 0;

            // Check targets
            targets.forEach(t => {
                if (Math.abs(price - t.price) < t.tolerance) {
                    // Filter noise (we assume IDs are short or meaningful)
                    if (item.id.length < 10) {
                        console.log(`[${t.name}] Match? ID: ${item.id}, Price: ${price}, Vol: ${item.volume}`);
                    }
                }
            });

            // Also check for common IDs explicitly
            const id = item.id.toUpperCase();
            if (['0000', 'IX0001', 'WTX', 'TX', 'MTX', 'TWN', 'STW'].some(k => id.includes(k))) {
                console.log(`[Explicit ID Match] ID: ${item.id}, Price: ${price}`);
            }
        });

    } catch (e) {
        console.log('Error:', e.message);
    }
}

run();
