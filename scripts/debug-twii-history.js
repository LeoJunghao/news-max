
async function debugTwiiHistory() {
    // interval=1d, range=5d to see recent daily closes
    const url = 'https://query1.finance.yahoo.com/v8/finance/chart/%5ETWII?interval=1d&range=5d';

    try {
        const res = await fetch(url);
        const data = await res.json();
        const result = data.chart?.result?.[0];

        if (!result) return;

        const timestamps = result.timestamp;
        const quotes = result.indicators?.quote?.[0];
        const meta = result.meta;

        console.log('--- Meta ---');
        console.log('Regular Market Price:', meta.regularMarketPrice);
        console.log('Chart Prev Close (Meta):', meta.chartPreviousClose);
        console.log('Previous Close (Meta):', meta.previousClose); // Sometimes exists

        console.log('\n--- History (Last 5) ---');
        timestamps.forEach((ts, i) => {
            const date = new Date(ts * 1000).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
            const close = quotes.close[i];
            console.log(`[${i}] ${date}: Close=${close}`);
        });

    } catch (e) {
        console.error('Error:', e);
    }
}

debugTwiiHistory();
