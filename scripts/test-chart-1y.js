// script to test computing 52-week high/low from Chart API v8
const symbols = ['BTC-USD', 'NVDA', '2330.TW'];

async function run() {
    console.log('Testing "Computed 52-Week" Strategy (Chart API v8 1y)...');

    for (const s of symbols) {
        // Fetch 52 weeks, weekly interval (lightweight)
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${s}?interval=1wk&range=1y`;
        console.log(`\nFetching ${s}...`);

        try {
            const res = await fetch(url);
            if (!res.ok) {
                console.log(`Failed: ${res.status}`);
                continue;
            }
            const json = await res.json();
            const result = json.chart?.result?.[0];

            if (!result) {
                console.log('No result');
                continue;
            }

            const quotes = result.indicators?.quote?.[0];
            const highs = quotes.high || [];
            const lows = quotes.low || [];

            // Filter out nulls
            const validHighs = highs.filter(v => v != null);
            const validLows = lows.filter(v => v != null);

            const fiftyTwoWeekHigh = Math.max(...validHighs);
            const fiftyTwoWeekLow = Math.min(...validLows);
            const currentPrice = result.meta?.regularMarketPrice;

            console.log(`  Price: ${currentPrice}`);
            console.log(`  Calc 52W High: ${fiftyTwoWeekHigh.toFixed(2)}`);
            console.log(`  Calc 52W Low:  ${fiftyTwoWeekLow.toFixed(2)}`);

            // Check if meta had it?
            console.log(`  Meta 52W High: ${result.meta.fiftyTwoWeekHigh || 'N/A'}`);

        } catch (e) {
            console.error(e.message);
        }
    }
}

run();
