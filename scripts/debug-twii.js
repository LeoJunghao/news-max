
// Use native fetch (Node 18+)
async function testTWII() {
    const symbol = '%5ETWII';
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        const meta = data.chart?.result?.[0]?.meta;

        if (!meta) {
            console.log('No meta data found', JSON.stringify(data, null, 2));
            return;
        }

        const price = meta.regularMarketPrice;
        const prevClose = meta.chartPreviousClose;
        const change = price - prevClose;
        const changePercent = prevClose ? (change / prevClose) * 100 : 0;

        console.log('TWII Data:');
        console.log(`Price: ${price}`);
        console.log(`Prev Close: ${prevClose}`);
        console.log(`Calced Change: ${change}`);
        console.log(`Calced Percent: ${changePercent.toFixed(2)}%`);
        console.log('--- Raw Meta ---');
        console.log(JSON.stringify(meta, null, 2));

    } catch (e) {
        console.error('Error:', e);
    }
}

testTWII();
