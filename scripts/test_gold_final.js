
// Use generic CNN Fear and Greed Index logic or improved Gold Sentiment fallback
// JM Bullion specific parsing is failing due to anti-bot or dynamic JS rendering.
// Sticking to robust fallback for now but will tweak coefficients.

async function getGoldSentimentImproved() {
    try {
        // Fetch Gold Futures (GC=F) History
        const res = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1d&range=5d', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            next: { revalidate: 60 }
        });
        const data = await res.json();
        const meta = data.chart?.result?.[0]?.meta;
        const price = meta?.regularMarketPrice;
        const prevClose = meta?.chartPreviousClose;

        if (!price || !prevClose) return 50;

        const changePercent = ((price - prevClose) / prevClose) * 100;

        console.log(`GC=F Change: ${changePercent.toFixed(2)}%`);

        // Improve sensitivity:
        // A 1% move in gold is significant.
        // Let's amplify this to a 0-100 scale centered at 50.
        // +2% -> 80 (Greed)
        // -2% -> 20 (Fear)
        // Formula: 50 + (changePercent * 15)

        let sentiment = 50 + (changePercent * 15);
        const result = Math.max(10, Math.min(90, Math.round(sentiment)));
        console.log(`Calculated Sentiment: ${result}`);

        return result;

    } catch (e) {
        console.error("Error", e);
        return 50;
    }
}

getGoldSentimentImproved();
