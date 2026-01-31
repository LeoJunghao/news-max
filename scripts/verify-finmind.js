const fs = require('fs');
const path = require('path');
const https = require('https');

async function verifyFinMind() {
    console.log("🔍 Restarting FinMind API Verification...");

    let token = process.env.FINMIND_API_TOKEN;
    if (!token) {
        try {
            const content = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8');
            const match = content.match(/^FINMIND_API_TOKEN=(.+)$/m);
            if (match) token = match[1].trim();
        } catch (e) { }
    }

    if (!token) {
        console.error("❌ ERROR: Token not found.");
        return;
    }

    // Test 1: Try the specific Snapshot Endpoint (based on search results)
    // URL: https://api.finmindtrade.com/api/v4/taiwan_futures_snapshot?data_id=TXF
    console.log("\n📡 [Test 1] Connecting to Snapshot Endpoint...");
    console.log("    URL: https://api.finmindtrade.com/api/v4/taiwan_futures_snapshot?data_id=TXF");

    const url1 = 'https://api.finmindtrade.com/api/v4/taiwan_futures_snapshot?data_id=TXF';
    const options = { headers: { 'Authorization': `Bearer ${token}` } };

    const req1 = https.get(url1, options, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
            console.log(`    Status: ${res.statusCode}`);
            try {
                const json = JSON.parse(data);
                if (res.statusCode === 200 && json.msg === 'success') {
                    console.log("    ✅ [Test 1] SUCCESS! This is the correct endpoint.");
                    console.log("    Data Sample:", JSON.stringify(json.data?.[0] || {}, null, 2));
                } else {
                    console.log("    ❌ [Test 1] Failed.");
                    console.log("    Response:", normalizeLength(JSON.stringify(json)));
                }
            } catch (e) { console.log("    ❌ Parse Error"); }

            // Proceed to Test 2 regardless
            test2(token);
        });
    });
    req1.on('error', e => { console.error("    ❌ Network Error", e.message); test2(token); });
}

function test2(token) {
    // Test 2: Try the Data Endpoint (Usage in screenshot)
    console.log("\n📡 [Test 2] Connecting to Generic Data Endpoint with 'TaiwanFuturesTick' (Credential Check)...");
    // Using a known valid dataset just to check if token is good (200 OK)
    // Need a valid date? usually yes
    const date = new Date().toISOString().split('T')[0];
    const url2 = `https://api.finmindtrade.com/api/v4/data?dataset=TaiwanFuturesTick&data_id=TXF&start_date=${date}`;
    console.log(`    URL: ${url2}`);

    const options = { headers: { 'Authorization': `Bearer ${token}` } };

    https.get(url2, options, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
            console.log(`    Status: ${res.statusCode}`);
            if (res.statusCode === 200) {
                console.log("    ✅ [Test 2] Token is VALID (Standard Data endpoint works).");
            } else if (res.statusCode === 401 || res.statusCode === 403) {
                console.log("    ❌ [Test 2] Token Invalid / Permission Denied.");
            } else {
                console.log("    ⚠️ [Test 2] Endpoint reachable but returned:", res.statusCode);
            }
        });
    });
}

function normalizeLength(str) {
    if (str.length > 200) return str.substring(0, 200) + "...";
    return str;
}

verifyFinMind();
