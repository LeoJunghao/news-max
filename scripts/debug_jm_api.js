
async function checkJMApiCall() {
    console.log("Checking JM Bullion API calls...");
    // Often these charts load data from a JSON endpoint.
    // Let's guess some common patterns based on "highcharts" usage.

    // Try https://cdn.jmbullion.com/fearandgreed/data.json
    // or similar

    const endpoints = [
        'https://cdn.jmbullion.com/fearandgreed/data.json',
        'https://cdn.jmbullion.com/fearandgreed/current.json',
        'https://www.jmbullion.com/fearandgreed/data.json',
        'https://www.jmbullion.com/api/fearandgreed'
    ];

    for (const url of endpoints) {
        try {
            const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            if (res.ok) {
                console.log(`[SUCCESS] Found data at: ${url}`);
                const json = await res.json();
                console.log(JSON.stringify(json).substring(0, 200));
            } else {
                console.log(`[FAILED] ${url} : ${res.status}`);
            }
        } catch (e) {
            console.log(`[ERROR] ${url}`);
        }
    }
}
checkJMApiCall();
