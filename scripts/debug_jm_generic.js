
async function checkJMBullionGeneric() {
    console.log("Checking JM Bullion (Generic Fear/Greed)...");
    const res = await fetch('https://www.jmbullion.com/fear-greed-index/', {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    });

    if (!res.ok) {
        console.log(`Failed to fetch: ${res.status}`);
        return;
    }

    const html = await res.text();
    console.log(`HTML Length: ${html.length}`);

    // Try finding the score
    const regex = /Current Index.*?(\d+)/i;
    const match = html.match(regex);
    if (match) console.log("Found Score (Text):", match[1]);

    const classMatch = html.match(/class="[^"]*fng-score[^"]*"[^>]*>(\d+)/i);
    if (classMatch) console.log("Found Score (Class):", classMatch[1]);

    const gaugeMatch = html.match(/gauge-value.*?(\d+)/i);
    if (gaugeMatch) console.log("Found Score (Gauge):", gaugeMatch[1]);

    const valueMatch = html.match(/value="(\d+)"/i);
    if (valueMatch) console.log("Found (Value attr):", valueMatch[1]);
}

checkJMBullionGeneric();
