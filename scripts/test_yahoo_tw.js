
const urls = [
    'https://tw.stock.yahoo.com/_td-stock/api/resource/FinanceService.FutureQuotes;symbol=WTX%26'
];

async function run() {
    for (const url of urls) {
        console.log(`Fetching ${url}`);
        try {
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                console.log(JSON.stringify(data, null, 2));
            } else {
                console.log(`FAILED ${url}: ${res.status}`);
            }
        } catch (e) {
            console.log(`ERROR ${url}: ${e.message}`);
        }
    }
}

run();
