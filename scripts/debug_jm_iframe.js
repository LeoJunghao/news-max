
// Check the iframe source found in recent analysis
async function checkJMIframe() {
    console.log("Checking JM Bullion Iframe Source...");
    const url = 'https://cdn.jmbullion.com/fearandgreed/fearandgreed.html';
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    });

    if (!res.ok) {
        console.log(`Failed to fetch iframe: ${res.status}`);
        return;
    }

    const html = await res.text();
    console.log(`Iframe HTML Length: ${html.length}`);

    // Look for score inside the iframe
    const scoreRegex = /(\d+)/g;
    // Just dump the first 50 numbers found or interesting parts
    console.log("Snippet from iframe:");
    console.log(html.substring(0, 500));

    // Search for "score" or specific ID
    const fngScore = html.match(/id="fng-score"[^>]*>(\d+)/i);
    if (fngScore) console.log(`Found Score in Iframe (id): ${fngScore[1]}`);

    const classScore = html.match(/class="[^"]*score[^"]*"[^>]*>(\d+)/i);
    if (classScore) console.log(`Found Score in Iframe (class): ${classScore[1]}`);

    // Check key value pairs
    const val = html.match(/var\s+value\s*=\s*(\d+)/i);
    if (val) console.log(`Found Value Var: ${val[1]}`);

    // Check specific JM structure
    if (html.includes("needle")) console.log("Found 'needle' (gauge)");
}

checkJMIframe();
