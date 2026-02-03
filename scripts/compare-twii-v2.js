
async function compareTWII() {
    const symbol = '%5ETWII'; // Encoded
    const chartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
    const quoteUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`;

    console.log(`Checking ${symbol}...`);

    try {
        // 1. Chart API
        const chartRes = await fetch(chartUrl);
        const chartData = await chartRes.json();
        const meta = chartData.chart?.result?.[0]?.meta;

        let chartPrice = 0, chartPrev = 0, chartChange = 0, chartPct = 0;
        if (meta) {
            chartPrice = meta.regularMarketPrice;
            chartPrev = meta.chartPreviousClose;
            chartChange = chartPrice - chartPrev;
            chartPct = chartPrev ? (chartChange / chartPrev) * 100 : 0;
        }

        console.log(`\n[Chart API v8]`);
        console.log(`Price: ${chartPrice}`);
        console.log(`Prev:  ${chartPrev}`);
        console.log(`Percent: ${chartPct.toFixed(3)}%`);


        // 2. Quote API
        const quoteRes = await fetch(quoteUrl);
        if (!quoteRes.ok) {
            console.log(`\n[Quote API v7] Failed: ${quoteRes.status}`);
        } else {
            const quoteData = await quoteRes.json();
            const quote = quoteData.quoteResponse?.result?.[0];

            if (quote) {
                console.log(`\n[Quote API v7]`);
                console.log(`Price: ${quote.regularMarketPrice}`);
                console.log(`Prev:  ${quote.regularMarketPreviousClose}`);
                console.log(`Change: ${quote.regularMarketChange}`);
                console.log(`Percent: ${quote.regularMarketChangePercent}%`);
            } else {
                console.log('\n[Quote API v7] No data found in result');
            }
        }

    } catch (e) {
        console.error('Error:', e);
    }
}

compareTWII();
