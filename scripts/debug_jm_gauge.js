
async function checkJMGaugeIframe() {
    console.log("Checking JM Bullion Gauge Iframe...");
    const url = 'https://cdn.jmbullion.com/fearandgreed/gauge.html';
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)'
        }
    });

    if (!res.ok) {
        console.log(`Failed to fetch iframe: ${res.status}`);
        return;
    }

    const html = await res.text();
    console.log(`Iframe HTML Length: ${html.length}`);

    // Check if the score is embedded in the HTML directly
    // Usually in a JS variable or HTML element

    // Look for numbers in context of "score", "value", etc.
    const patterns = [
        /id="fng-score"[^>]*>(\d+)/i,
        /class="[^"]*score[^"]*"[^>]*>(\d+)/i,
        /var\s+value\s*=\s*(\d+)/i,
        /data:.*\[.*(\d{2,3}).*\]/ // Highcharts series data
    ];

    let found = false;
    for (const p of patterns) {
        const match = html.match(p);
        if (match) {
            console.log(`Found match with ${p}: ${match[1]}`);
            found = true;
        }
    }

    if (!found) {
        console.log("No obvious score found. Dumping generic numbers from script tags...");
        const scripts = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
        if (scripts) {
            scripts.forEach(s => {
                const nums = s.match(/\d{2,3}/g);
                if (nums && nums.length < 10) { // Only print if not too noisy
                    console.log(`Potential numbers in script: ${nums.join(', ')}`);
                }
            });
        }
    }
}

checkJMGaugeIframe();
