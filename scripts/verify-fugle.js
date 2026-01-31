const fs = require('fs');
const path = require('path');
const https = require('https');

async function verifyFugle() {
    console.log("🔍 Starting Fugle API Verification...");

    // 1. Try to load key from .env
    let apiKey = process.env.FUGLE_API_KEY;

    if (!apiKey) {
        try {
            const envPath = path.join(process.cwd(), '.env');
            if (fs.existsSync(envPath)) {
                const content = fs.readFileSync(envPath, 'utf8');
                const match = content.match(/^FUGLE_API_KEY=(.+)$/m);
                if (match) {
                    apiKey = match[1].trim();
                    // Remove quotes if present
                    if ((apiKey.startsWith('"') && apiKey.endsWith('"')) || (apiKey.startsWith("'") && apiKey.endsWith("'"))) {
                        apiKey = apiKey.slice(1, -1);
                    }
                    console.log("📂 Found FUGLE_API_KEY in .env file.");
                }
            }
        } catch (e) { }
    }

    if (!apiKey) {
        console.error("❌ ERROR: FUGLE_API_KEY not found in environment variables or .env file.");
        console.error("👉 Please add FUGLE_API_KEY=your_key_here to your .env file.");
        return;
    }

    console.log("🔑 API Key found (masked):", apiKey.substring(0, 4) + "****" + apiKey.substring(apiKey.length - 4));
    console.log("1️⃣  Step 1: Fetching Active TXF Contracts...");

    // Step 1: Get list of contracts
    const listUrl = 'https://api.fugle.tw/marketdata/v1.0/futopt/intraday/tickers?type=FUTURE&exchange=TAIFEX&symbol=TXF';
    const options = {
        headers: { 'X-API-KEY': apiKey }
    };

    https.get(listUrl, options, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
            if (res.statusCode !== 200) {
                console.error(`❌ Failed to fetch tickers list. Status: ${res.statusCode}`);
                try { console.error("Response:", JSON.parse(data)); } catch (e) { console.error("Response:", data); }
                return;
            }

            try {
                const json = JSON.parse(data);
                const contracts = (json.data || []).map(c => c.symbol).sort();

                if (contracts.length === 0) {
                    console.warn("⚠️  Success, but no TXF contracts found (Market might be closed or empty list returned).");
                    return;
                }

                console.log(`✅ Found ${contracts.length} contracts: ${contracts.slice(0, 3).join(', ')}...`);

                const activeSymbol = contracts[0];
                console.log(`2️⃣  Step 2: Fetching Quote for Nearest Contract: ${activeSymbol}...`);

                // Step 2: Get Quote
                const quoteUrl = `https://api.fugle.tw/marketdata/v1.0/futopt/intraday/quote/${activeSymbol}`;

                https.get(quoteUrl, options, (qRes) => {
                    let qData = '';
                    qRes.on('data', c => qData += c);
                    qRes.on('end', () => {
                        if (qRes.statusCode !== 200) {
                            console.error(`❌ Failed to fetch quote. Status: ${qRes.statusCode}`);
                            return;
                        }

                        try {
                            const qJson = JSON.parse(qData);
                            console.log("\n--- Active Contract Quote ---");
                            console.log(`Symbol: ${qJson.symbol}`);
                            console.log(`Name: ${qJson.name}`);
                            console.log(`Price: ${qJson.lastPrice}`);
                            console.log(`Change: ${qJson.change}`);
                            console.log(`Change (%): ${qJson.changePercent}%`);
                            console.log(`Time: ${new Date(qJson.lastUpdated).toLocaleString()}`);
                            console.log("-----------------------------");
                            console.log("✅ Fugle API Integration Verified Successfully!");
                        } catch (e) {
                            console.error("❌ Failed to parse quote JSON:", e.message);
                        }
                    });
                });

            } catch (e) {
                console.error("❌ Failed to parse tickers JSON:", e.message);
            }
        });
    }).on('error', (e) => {
        console.error("❌ Network Error:", e.message);
    });
}

verifyFugle();
