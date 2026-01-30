
async function checkJMApi() {
    console.log("Checking JM Bullion API...");
    const url = 'https://www.jmbullion.com/api/fearandgreed';
    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Accept': 'application/json'
            }
        });

        if (!res.ok) {
            console.log(`Failed: ${res.status}`);
            return;
        }

        const data = await res.json();
        console.log("Success! Data:");
        console.log(JSON.stringify(data, null, 2));

    } catch (e) {
        console.error("Error fetching API", e);
    }
}
checkJMApi();
