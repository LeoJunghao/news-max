// Standalone verification script
// Since we cannot require .ts files directly in Node without ts-node,
// we will verify the API Logic directly here to ensure the endpoint works.

async function verify() {
    console.log('Verifying WantGoo API connection...');
    const url = 'https://www.wantgoo.com/investrue/all-quote-info';


    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Referer': 'https://www.wantgoo.com/',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        const data = await res.json();
        const target = data.find(item => item.id === 'WTX&');

        if (target) {
            console.log('✅ Found WTX& (Continuous Futures)');
            console.log(`   Price: ${target.close || target.deal}`);
            console.log(`   Vol:   ${target.volume}`);
            console.log(`   Time:  ${new Date(target.time).toLocaleString()}`);
        } else {
            console.log('❌ WTX& NOT FOUND. Listing top volume candidates:');
            const candidates = data.filter(item => item.id && item.id.startsWith('WTX'));
            console.log(candidates.slice(0, 3));
        }
    } catch (e) {
        console.error('Failed:', e.message);
    }
}

verify();
