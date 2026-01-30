
async function deepSearchJMGeneric() {
    console.log("Deep searching JM Bullion Generic...");
    const res = await fetch('https://www.jmbullion.com/fear-greed-index/', {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    });

    const html = await res.text();
    const term = "Fear & Greed Index";
    let idx = html.indexOf(term);
    let count = 0;
    while (idx !== -1 && count < 5) {
        console.log(`\n--- Match ${count + 1} ---`);
        console.log(html.substring(idx - 100, idx + 300));
        idx = html.indexOf(term, idx + 1);
        count++;
    }

    // Check for "score"
    // Often: <div class="score">45</div>
    console.log("\n--- Searching for score-like elements ---");
    const scoreRegex = /class="[^"]*score[^"]*"[^>]*>(\d+)/gi;
    let match;
    while ((match = scoreRegex.exec(html)) !== null) {
        console.log(`Found score candidate: ${match[1]} (context: ${html.substring(match.index - 50, match.index + 50)})`);
    }

    // Check for "meter"
    const meterIdx = html.indexOf("meter");
    if (meterIdx !== -1) {
        console.log("\n--- Meter context ---");
        console.log(html.substring(meterIdx - 100, meterIdx + 300));
    }
}
deepSearchJMGeneric();
