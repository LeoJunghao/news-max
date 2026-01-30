
async function searchJMBullion() {
    console.log("Searching JM Bullion HTML deeply...");
    const res = await fetch('https://www.jmbullion.com/gold-fear-greed-index/', {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        }
    });
    const html = await res.text();

    // Look for "Current" or "Index" or numbers
    const term = "Fear & Greed Index";
    const idx = html.indexOf(term);
    if (idx !== -1) {
        console.log(`Found '${term}' at index ${idx}. Context:`);
        console.log(html.substring(idx - 100, idx + 300));
    } else {
        console.log(`'${term}' not found.`);
    }

    // Look for "gauge"
    const gaugeIdx = html.indexOf("gauge");
    if (gaugeIdx !== -1) {
        console.log(`Found 'gauge' at index ${gaugeIdx}. Context:`);
        console.log(html.substring(gaugeIdx - 100, gaugeIdx + 300));
    }
}

async function main() {
    await searchJMBullion();
}

main();
