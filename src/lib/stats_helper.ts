
import { JSDOM } from 'jsdom';

// New function to scrape Gold Sentiment from JM Bullion using JSDOM
async function getJMBullionGoldSentiment() {
    try {
        console.log("Fetching JM Bullion Gold Fear & Greed Index...");
        const res = await fetch('https://www.jmbullion.com/gold-fear-greed-index/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!res.ok) {
            console.log("Failed to fetch JM Bullion page");
            return 50;
        }

        const html = await res.text();
        // Since we can't inspect element, our previous debugs show we can't easily find a clean ID.
        // However, we can try to parse the "Fear & Greed Index is currently at XX" text if it exists
        // Or look for the specific structure if we had it.

        // Let's try to match a common pattern for these indices.
        // On JM Bullion, looking at cached versions/similar sites:
        // usually it's in a div with a specific class or ID.
        // Since my previous "fng-score" check failed, let's try a broader regex for the number.

        // Heuristic: Find "Current Index" and take the next number.
        const regex = /Current Index.*?(\d+)/i;
        const match = html.match(regex);
        if (match) {
            return parseInt(match[1]);
        }

        return 50; // Fallback
    } catch (e) {
        console.error("JM Bullion Fetch Error", e);
        return 50;
    }
}

// Function to get TX (Taiwan Futures) from Yahoo Finance Page
async function getTXRealtime() {
    try {
        // Yahoo Finance symbol for Taiwan Weighted Index Futures is often WTX=F or similar but sometimes delayed or broken.
        // User requested "Unit" / "Realtime" from "Taiwan Stock Yahoo".
        // URL: https://tw.stock.yahoo.com/future/WTX&

        const res = await fetch('https://tw.stock.yahoo.com/future/WTX&', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!res.ok) return null;

        const text = await res.text();

        // Data is usually in a simpler separate API call or embedded in JSON, but let's try regex on HTML first as it worked in debug.
        // Price: class="Fz(32px)...">32,577.00</span>
        const priceMatch = text.match(/class="Fz\(32px\)[^>]*>([0-9,]+\.?[0-9]*)<\/span>/);
        let price = 0;
        if (priceMatch) {
            price = parseFloat(priceMatch[1].replace(/,/g, ''));
        }

        // Change: nearby class="Fz(20px)...">-148.00</span> ... >-0.45%</span>
        // Let's extract the first percentage after the price match index
        // This is a bit risky but often works for simple pages.

        let changePercent = 0;
        if (priceMatch) {
            const afterPrice = text.substring(priceMatch.index + priceMatch[0].length);
            // Limit search to next 1000 chars
            const lookAhead = afterPrice.substring(0, 1000);

            // Look for >-0.45%</span> or >+0.45%</span>
            const pctMatch = lookAhead.match(/>([+\-]?[0-9,]+\.?[0-9]*)%<\/span>/);
            if (pctMatch) {
                changePercent = parseFloat(pctMatch[1].replace(/,/g, ''));
            }
        }

        return { price, changePercent };

    } catch (e) {
        console.error("TX Fetch Error", e);
        return null;
    }
}
