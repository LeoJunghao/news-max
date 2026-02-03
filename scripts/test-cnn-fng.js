// Native fetch is available in Node 18+
async function testCNN() {
    try {
        console.log('Fetching from CNN API...');
        const res = await fetch('https://production.dataviz.cnn.io/index/fearandgreed/graphdata', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        console.log('Status:', res.status);
        if (res.ok) {
            const data = await res.json();
            console.log('Data:', JSON.stringify(data, null, 2));
        } else {
            console.log('Text:', await res.text());
        }
    } catch (e) {
        console.error('Error:', e);
    }
}

testCNN();
