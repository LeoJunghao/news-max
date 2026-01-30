
// Use fetch to check if the iframe HTML has actual data or if it uses JS to fetch JSON
// Since we failed to find static data, let's assume it fetches JSON.
// The common pattern is relative path `data.json` or `current.json`.

// Let's brute force guess the JSON endpoint relative to the iframe path.
// Base: https://cdn.jmbullion.com/fearandgreed/

async function checkJsonEndpoints() {
    const endpoints = [
        'https://cdn.jmbullion.com/fearandgreed/data.json',
        'https://cdn.jmbullion.com/fearandgreed/current.json',
        'https://cdn.jmbullion.com/fearandgreed/index.json',
        'https://cdn.jmbullion.com/fearandgreed/gauge.json'
    ];

    for (const url of endpoints) {
        try {
            const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            if (res.ok) {
                console.log(`FOUND JSON: ${url}`);
                const json = await res.json();
                console.log(json);
            } else {
                console.log(`Failed: ${url} (${res.status})`);
            }
        } catch (e) {
            console.log(`Error: ${url}`);
        }
    }
}
checkJsonEndpoints();
