const https = require('https');
const fs = require('fs');
const path = require('path');

async function verifyFinMindTick() {
    console.log("🔍 Checking FinMind 'TaiwanFutOptTick' availability for Free Tier...");

    let token = process.env.FINMIND_API_TOKEN;
    if (!token) {
        try {
            const content = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8');
            const match = content.match(/^FINMIND_API_TOKEN=(.+)$/m);
            if (match) token = match[1].trim();
        } catch (e) { }
    }

    if (!token) {
        console.error("❌ No FINMIND_API_TOKEN found in .env");
        return;
    }

    // Try to get the latest tick data for TXF
    // Note: Free tier might block 'TaiwanFutOptTick' or allow delayed data.
    // FinMind V4 generic data endpoint
    // Dataset: TaiwanFutOptTick (Realtime Tick) or TaiwanFutOptDaily (Daily)
    // We want Realtime if possible.
    const dataset = "TaiwanFuturesTick";
    const data_id = "TXF";
    // We need a start_date, usually today.
    // If market is closed (weekend), this might return empty or error if searching future dates.
    // Let's use today's date.
    const today = new Date().toISOString().split('T')[0];

    const url = `https://api.finmindtrade.com/api/v4/data?dataset=${dataset}&data_id=${data_id}&start_date=${today}`;

    console.log(`URL: ${url}`);

    const options = {
        headers: { 'Authorization': `Bearer ${token}` }
    };

    https.get(url, options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
            console.log(`Status: ${res.statusCode}`);
            if (res.statusCode === 200) {
                try {
                    const json = JSON.parse(body);
                    if (json.msg === 'success' && json.data && json.data.length > 0) {
                        const last = json.data[json.data.length - 1];
                        console.log("✅ Success! Retrieved tick data.");
                        console.log("Sample Data:", last);
                    } else {
                        console.log("⚠️  Request success (200) but no data returned.");
                        console.log("Msg:", json.msg);
                        console.log("Data Length:", json.data ? json.data.length : 0);
                        console.log("Possibility: Market closed today or free tier restricted/delayed.");
                    }
                } catch (e) {
                    console.error("❌ Parse Error");
                }
            } else {
                console.error("❌ Request Failed (Likely Permission/Plan issue)");
                console.error("Body:", body);
            }
        });
    });
}

verifyFinMindTick();
