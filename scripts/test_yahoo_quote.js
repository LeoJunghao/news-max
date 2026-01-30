
const urls = [
    'https://query1.finance.yahoo.com/v7/finance/quote?symbols=WTX%26',
    'https://query1.finance.yahoo.com/v7/finance/quote?symbols=WTX=F'
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
