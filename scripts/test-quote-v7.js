// script to test Yahoo Quote API v7 response
const symbols = ['BTC-USD', 'NVDA', '2330.TW'];

async function run() {
    console.log('Fetching Quote v7 for:', symbols);
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(',')}`;

    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!res.ok) {
            console.error(`Status ${res.status}`);
            console.log(await res.text());
            return;
        }

        const json = await res.json();
        const results = json.quoteResponse?.result || [];

        results.forEach(q => {
            console.log(`\nSymbol: ${q.symbol}`);
            console.log(`  Price: ${q.regularMarketPrice}`);
            console.log(`  52W High: ${q.fiftyTwoWeekHigh}`);
            console.log(`  52W Low:  ${q.fiftyTwoWeekLow}`);
            console.log(`  Market Cap: ${q.marketCap}`);
        });

    } catch (e) {
        console.error(e);
    }
}

run();
