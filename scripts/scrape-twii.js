
async function scrapeTWII() {
    const url = 'https://tw.stock.yahoo.com/quote/^TWII'; // Desktop page
    // Or mobile: https://tw.stock.yahoo.com/quote/^TWII
    console.log(`Scraping ${url}...`);

    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.0.0 Safari/537.36'
            }
        });
        const text = await res.text();

        // Yahoo TW usually puts price in Fz(32px) or similar classes.
        // It's dynamic, but let's see if regex works like in getTX.

        // Price
        // class="Fz(32px) Fw(b) Lh(1) Mend(16px) D(f) Ai(c) C($c-trend-down)"
        // or C($c-trend-up)

        // Find the main price
        const priceMatch = text.match(/class="Fz\(32px\)[^>]*>([0-9,]+\.?[0-9]*)<\/span>/);
        if (priceMatch) {
            console.log('Price found:', priceMatch[1]);
        } else {
            console.log('Price NOT found');
        }

        // Find change and percent
        // Look for context around price
        if (priceMatch) {
            const context = text.substring(priceMatch.index, priceMatch.index + 2000);

            // Try to find "(2.80%)"
            // >-912.27</span> ... >-2.80%</span>

            const pctRegex = />([+\-]?[0-9,]+\.?[0-9]*)%<\/span>/;
            const match = context.match(pctRegex);
            if (match) {
                console.log('Percent found:', match[1]);
            } else {
                console.log('Percent regex 1 failed');
                // Try with parenthesis
                const match2 = context.match(/>\(([+\-]?[0-9,]+\.?[0-9]*)%\)<\/span>/);
                if (match2) console.log('Percent found (paren):', match2[1]);
            }
        }

    } catch (e) {
        console.error('Error:', e);
    }
}

scrapeTWII();
