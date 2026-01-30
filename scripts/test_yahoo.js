
const urls = [
    'https://query1.finance.yahoo.com/v8/finance/chart/WTX=F?interval=1d&range=1d',
    'https://query1.finance.yahoo.com/v8/finance/chart/TX=F?interval=1d&range=1d',
    // Try encoded &
    'https://query1.finance.yahoo.com/v8/finance/chart/WTX%26?interval=1d&range=1d'
];

async function run() {
    for (const url of urls) {
        console.log(`Fetching ${url}`);
        try {
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                const meta = data.chart?.result?.[0]?.meta;
                if (meta) {
                    console.log(`SUCCESS: ${meta.symbol}, Price: ${meta.regularMarketPrice}`);
                } else {
                    console.log(`NO DATA for ${url}`);
                }
            } else {
                console.log(`FAILED ${url}: ${res.status}`);
            }
        } catch (e) {
            console.log(`ERROR ${url}: ${e.message}`);
        }
    }
}

run();
