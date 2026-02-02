// script to test Yahoo Quote API v6/v8 response as fallback
const symbols = ['BTC-USD', 'NVDA', '2330.TW'];

async function run() {
    console.log('Testing Alternative Endpoints...');

    // v6 often works without crumb
    const urlV6 = `https://query1.finance.yahoo.com/v6/finance/quote?symbols=${symbols.join(',')}`;

    console.log(`Fetching ${urlV6}...`);

    try {
        const res = await fetch(urlV6, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!res.ok) {
            console.error(`V6 Status ${res.status}`);
            console.log(await res.text());
        } else {
            const json = await res.json();
            const results = json.quoteResponse?.result || [];
            console.log('\n--- V6 RESULTS ---');
            results.forEach(q => {
                console.log(`\nSymbol: ${q.symbol}`);
                console.log(`  Price: ${q.regularMarketPrice}`);
                console.log(`  52W High: ${q.fiftyTwoWeekHigh}`);
                console.log(`  52W Low:  ${q.fiftyTwoWeekLow}`);
            });
            return; // Success
        }

    } catch (e) {
        console.error('V6 Error:', e.message);
    }
}

run();
