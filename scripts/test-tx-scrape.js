
// using native fetch

async function testTXScrape() {
    const url = 'https://tw.stock.yahoo.com/future/WTX&';
    console.log(`Fetching ${url}...`);

    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.0.0 Safari/537.36'
            }
        });

        if (!res.ok) {
            console.error('Failed to fetch page');
            return;
        }

        const text = await res.text();
        console.log('Page fetched. Length:', text.length);

        // 1. Get Price
        // Regex: class="Fz(32px)...">32,577.00</span>
        const priceMatch = text.match(/class="Fz\(32px\)[^>]*>([0-9,]+\.?[0-9]*)<\/span>/);
        const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0;
        console.log('Price:', price);

        if (priceMatch) {
            const context = text.substring(priceMatch.index, priceMatch.index + 1500);

            // 2. Try to find Change Amount directly
            // Usually looks like: <span class="... C($c-trend-up) ...">▲32.00</span>
            // Or just >32.00</span> near the price.
            // Let's print a small chunk around the price to inspect manually first
            console.log('\n--- Context Preview ---');
            console.log(context.substring(0, 500));
            console.log('-----------------------\n');

            // Existing logic for percent
            // Matches >+1.23%</span> or >-1.23%</span> or >(0.65%)</span>
            const pctMatch = context.match(/>\(?([+\-]?[0-9,]+\.?[0-9]*)%\)?<\/span>/);
            const changePercent = pctMatch ? parseFloat(pctMatch[1].replace(/,/g, '')) : 0;
            console.log('Change Percent:', changePercent);

            // Proposed logic for Change Amount
            // It usually appears BEFORE the percentage.
            // <span ...>▲123.00</span> ... <span ...>(+0.50%)</span>

            // Let's look for the number before the % match?
            // Or look for patterns like >▲123</span> or >▼456</span>

            // Strategy: Look for "32.00" or "-32.00" inside spans in the context
            const changeMatch = context.match(/>([▲▼]?)?([+\-]?[0-9,]+\.?[0-9]*)<\/span>/g);
            if (changeMatch) {
                console.log('Potential Change Matches:', changeMatch.slice(0, 5));
            }

            // Refined Regex for Change:
            // Often has class "Fz(20px)" or similar, and color class.
            // <span class="Fz(20px) Fw(b) Lh(1.2) Led(2px) D(f) Ai(c) C($c-trend-up)">▲152.00</span>

            const realChangeMatch = context.match(/>([▲▼])?([0-9,]+\.?[0-9]*)<\/span>/);
            if (realChangeMatch) {
                console.log('Detected Change Str:', realChangeMatch[0]);
                let val = parseFloat(realChangeMatch[2].replace(/,/g, ''));
                if (realChangeMatch[1] === '▼') val = -val;
                if (realChangeMatch[1] === '▲') val = val; // positive

                // If no arrow, maybe it has +/- sign?
                if (!realChangeMatch[1]) {
                    // check for sign in number
                }
                console.log('Derived Change:', val);
            }
        }

    } catch (e) {
        console.error(e);
    }
}

testTXScrape();
