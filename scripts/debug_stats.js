
// ... (previous helper functions) ...

async function checkJMBullionContent() {
    console.log("Checking JM Bullion Content...");
    const res = await fetch('https://www.jmbullion.com/gold-fear-greed-index/', {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    });
    const html = await res.text();
    console.log(`Title tag: ${html.match(/<title>(.*?)<\/title>/)?.[1]}`);

    // Check for specific keywords
    if (html.includes("Fear")) console.log("Contains word 'Fear'");
    if (html.includes("Greed")) console.log("Contains word 'Greed'");
    if (html.includes("index")) console.log("Contains word 'index'");

    // Dump 500 chars from middle just in case
    console.log("Snippet (middle):", html.substring(html.length / 2, html.length / 2 + 500));
}

async function checkTXChangePercent() {
    console.log("Checking TX Change Percent...");
    const res = await fetch('https://tw.stock.yahoo.com/future/WTX&', {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    });
    const text = await res.text();

    // Look for percent change
    // Usually nearby the price. The price is in Fz(32px).
    // The change is usually in Fz(20px) or similar.

    // Let's find all spans with %
    const regex = />([+\-]?[0-9,]+\.?[0-9]*)%<\/span>/g;
    let match;
    let count = 0;
    while ((match = regex.exec(text)) !== null) {
        console.log(`Found potential percentage: ${match[1]}%`);
        count++;
        if (count > 5) break;
    }
}

(async () => {
    await checkJMBullionContent();
    await checkTXChangePercent();
})();
