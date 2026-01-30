
async function run() {
    const url = 'https://tw.stock.yahoo.com/future/WTX&';
    try {
        const res = await fetch(url);
        const text = await res.text();
        // Look for "price" or text around common price indicators.
        // Usually "成交" followed by numbers.
        const idx = text.indexOf("成交");
        if (idx > 0) {
            console.log(text.substring(idx, idx + 200));
            // Also look for class with "price"
            const priceIdx = text.indexOf('class="Fz(32px)'); // Yahoo TW often uses atomic CSS
            if (priceIdx > 0) {
                console.log("Found Fz(32px):", text.substring(priceIdx, priceIdx + 100));
            }
        }
    } catch (e) {
        console.error(e);
    }
}
run();
