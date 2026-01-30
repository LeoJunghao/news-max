
async function run() {
    const url = 'https://tw.stock.yahoo.com/future/WTX&';
    console.log(`Fetching ${url}`);
    try {
        const res = await fetch(url);
        const text = await res.text();
        console.log(`Length: ${text.length}`);

        // Try to find price patterns like "23,000" or similar near "成交" or "price".
        // Often in a script tag: "currentPrice":...

        // Search for "regularMarketPrice" which is common in Yahoo JSON blobs embedded in HTML.
        const match = text.match(/"regularMarketPrice":"?([0-9\.]+)"?/);
        if (match) {
            console.log(`Found regularMarketPrice: ${match[1]}`);
        } else {
            console.log("regularMarketPrice not found in JSON");
        }

        // Try searching for the price visually seen on page (e.g., look for <span ...>price</span> patterns if JSON fails)
        // But scraping text is hard without specific selectors.

        // Dump some text to see structure if needed (truncated)
        // console.log(text.substring(0, 5000));
    } catch (e) {
        console.error(e);
    }
}

run();
