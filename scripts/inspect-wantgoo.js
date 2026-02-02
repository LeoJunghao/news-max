
const fs = require('fs');

async function run() {
    const url = 'https://www.wantgoo.com/';
    console.log(`Fetching ${url}...`);

    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            }
        });

        if (!res.ok) {
            console.error(`Failed: ${res.status}`);
            return;
        }

        const html = await res.text();
        console.log(`Success! Length: ${html.length}`);

        const scriptRegex = /<script[^>]+src="([^"]+)"/g;
        let match;
        while ((match = scriptRegex.exec(html)) !== null) {
            console.log('Script:', match[1]);
        }

        // Also check if there is any inline script with "investrueid" or "api"
        const inlineScriptRegex = /<script>([\s\S]*?)<\/script>/g;
        while ((match = inlineScriptRegex.exec(html)) !== null) {
            if (match[1].includes('api') || match[1].includes('investrueid')) {
                console.log('Inline Script Match:', match[1].substring(0, 200));
            }
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
}

run();
