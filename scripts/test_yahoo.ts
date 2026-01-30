
const symbols = ['WTX=F', 'TX=F', 'WTX&', 'WTX%26'];

async function testSymbol(symbol: string) {
    try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
        console.log(`Testing ${symbol} at ${url}`);
        const res = await fetch(url);
        if (!res.ok) {
            console.log(`${symbol} failed with status ${res.status}`);
            return;
        }
        const data = await res.json();
        const meta = data.chart?.result?.[0]?.meta;
        if (meta) {
            console.log(`SUCCESS ${symbol}: Price ${meta.regularMarketPrice}, PrevClose ${meta.chartPreviousClose}`);
        } else {
            console.log(`${symbol} returned no data structure`);
        }
    } catch (e) {
        console.error(`Error fetching ${symbol}:`, e);
    }
}

async function run() {
    for (const s of symbols) {
        await testSymbol(s);
    }
}

run();
