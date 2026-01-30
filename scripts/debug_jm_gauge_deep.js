
// If the HTML itself doesn't contain the data, it must be fetching it.
// Let's check the iframe source for XHR requests or script includes
// The iframe is: https://cdn.jmbullion.com/fearandgreed/gauge.html

// Let's fetch the iframe and print the script tags to see where it gets data
async function analyzeJMGauge() {
    console.log("Analyzing Gauge Iframe Scripts...");
    const url = 'https://cdn.jmbullion.com/fearandgreed/gauge.html';
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await res.text();

    // Print all <script src="...">
    const srcs = html.match(/src="[^"]+"/g);
    if (srcs) {
        console.log("External Scripts:");
        srcs.forEach(s => console.log(s));
    }

    // Print inline scripts
    const inlines = html.match(/<script>([\s\S]*?)<\/script>/gi);
    if (inlines) {
        console.log("Inline Scripts:");
        inlines.forEach(s => console.log(s.substring(0, 200))); // Truncate
    }
}
analyzeJMGauge();
