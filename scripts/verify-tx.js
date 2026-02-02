
// Native fetch is available in Node 18+

async function getYahooQuote(symbol) {
    try {
        console.log(`Fetching Yahoo: ${symbol}...`);
        const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`);
        if (!res.ok) {
            console.log(`Yahoo ${symbol} failed: ${res.status}`);
            return null;
        }
        const data = await res.json();
        const meta = data.chart?.result?.[0]?.meta;
        console.log(`[DEBUG] ${symbol} Meta:`, JSON.stringify(meta, null, 2));
        const price = meta?.regularMarketPrice || 0;
        console.log(`Yahoo ${symbol} Price: ${price}`);
        return price;
    } catch (e) {
        console.error(`Yahoo error for ${symbol}:`, e.message);
        return null;
    }
}

async function getCNBCPrice(symbol) {
    try {
        console.log(`Fetching CNBC: ${symbol}...`);
        const res = await fetch(`https://quote.cnbc.com/quote-html-webservice/quote.htm?partnerId=2&requestMethod=quick&exthrs=1&noform=1&fund=1&output=json&symbols=${symbol}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        if (!res.ok) {
            console.log(`CNBC ${symbol} failed: ${res.status}`);
            return null;
        }
        const text = await res.text();
        const data = JSON.parse(text);
        const quote = data.QuickQuoteResult?.QuickQuote;

        // Handle array or single object
        const target = Array.isArray(quote) ? quote[0] : quote;

        // Debug full response if needed
        // console.log(`[DEBUG] CNBC ${symbol} Data:`, JSON.stringify(target, null, 2));

        const last = target?.last ? parseFloat(target.last) : 0;
        console.log(`CNBC ${symbol} Price: ${last}`);
        return last;
    } catch (e) {
        console.error(`CNBC error for ${symbol}:`, e.message);
        return null;
    }
}

async function run() {
    console.log('--- Testing Taiwan Futures Symbols ---');

    // Yahoo Tests
    await getYahooQuote('EWT'); // Control

    // CNBC Tests
    console.log('--- CNBC Tests ---');
    await getCNBCPrice('TW.F');
    await getCNBCPrice('TWN');  // SGX
    await getCNBCPrice('STW');  // SGX
    await getCNBCPrice('TX');
    await getCNBCPrice('TXF');
    await getCNBCPrice('.TWII'); // Index
}

run();
