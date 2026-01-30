
const symbols = ['WTX=F', 'WTX%3DF', 'TX']; // TX might be Texas Instruments but worth a check on the name or just skip

async function getYahooQuote(symbol) {
    try {
        console.log(`Fetching ${symbol}...`);
        // Using query2 which sometimes works better or is just an alternative
        const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!res.ok) {
            console.log(`Failed to fetch ${symbol}: ${res.status}`);
            return null;
        }
        const data = await res.json();

        // Debug
        // console.log(JSON.stringify(data, null, 2));

        const meta = data.chart?.result?.[0]?.meta;
        if (!meta) {
            console.log(`No data found for ${symbol}`);
            return null;
        }

        const price = meta.regularMarketPrice;
        console.log(`[SUCCESS] ${symbol} Price: ${price}`);
        return price;
    } catch (e) {
        console.error(`Error ${symbol}`, e.message);
        return null;
    }
}

async function getJMBullion() {
    try {
        console.log("Fetching JM Bullion with headers...");
        const res = await fetch('https://www.jmbullion.com/gold-fear-greed-index/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Pragma': 'no-cache',
                'Cache-Control': 'no-cache'
            }
        });

        if (!res.ok) {
            console.log(`JM Bullion Status: ${res.status}`);
            return;
        }

        const html = await res.text();
        console.log(`JM Bullion HTML Length: ${html.length}`);

        // Try to find the score in the HTML
        // Looking for "Current Gold Fear & Greed Index"
        // Or "fng-score"

        if (html.includes("fng-score")) {
            console.log("Found 'fng-score' in HTML!");
            const match = html.match(/class="fng-score"[^>]*>(\d+)/);
            if (match) console.log("Extracted Score (fng-score):", match[1]);
        }

        if (html.includes("gauge-value")) {
            console.log("Found 'gauge-value'!");
            const match = html.match(/class="gauge-value"[^>]*>(\d+)/);
            if (match) console.log("Extracted Score (gauge-value):", match[1]);
        }

        // Search for just numbers near "Fear & Greed Index"
        const idx = html.indexOf("Fear & Greed Index");
        if (idx !== -1) {
            console.log("Context around 'Fear & Greed Index':");
            console.log(html.substring(idx, idx + 200).replace(/\s+/g, ' '));
        }

    } catch (e) {
        console.error("JM Bullion Error", e.message);
    }
}

// Test Yahoo TW Futures by scraping the webpage directly if API fails
async function scrapeYahooTW() {
    console.log("Scraping Yahoo TW Future page...");
    try {
        const res = await fetch('https://tw.stock.yahoo.com/future/WTX&', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        if (!res.ok) {
            console.log("Yahoo TW Page Status:", res.status);
            return;
        }
        const text = await res.text();
        // Price regex: class="Fz(32px)...">32,577.00</span>
        const priceMatch = text.match(/class="Fz\(32px\)[^>]*>([0-9,]+\.?[0-9]*)<\/span>/);
        if (priceMatch) {
            console.log("Yahoo TW Scrape Success:", priceMatch[1]);
        } else {
            console.log("Yahoo TW Scrape Failed to match price pattern.");
            // Dump a small part to check
            console.log(text.substring(0, 500));
        }
    } catch (e) {
        console.error("Yahoo TW Scrape Error", e);
    }
}

(async () => {
    await getYahooQuote('WTX=F');
    // await getYahooQuote('WTX%3DF');
    // await getYahooQuote('TX');

    await scrapeYahooTW();
    await getJMBullion();
})();
