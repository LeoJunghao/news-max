export interface WantGooQuote {
    id: string;
    price: number;
    change: number;
    changePercent: number;
    open: number;
    high: number;
    low: number;
    volume: number;
    updatedAt: number;
}

/**
 * Fetch Real-time Futures Data from WantGoo
 * Target ID: 'WTX&' (Continuous Index Futures)
 */
export async function getWantGooFutures(): Promise<WantGooQuote | null> {
    const url = 'https://www.wantgoo.com/investrue/all-quote-info';

    try {
        const res = await fetch(url, {
            next: { revalidate: 10 }, // aggressive 10s caching for real-time feel
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://www.wantgoo.com/',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        if (!res.ok) {
            console.error(`WantGoo API Failed: ${res.status}`);
            return null;
        }

        const data: any[] = await res.json();

        // Strategy 1: Look for exact continuous contract ID 'WTX&'
        let target = data.find(item => item.id === 'WTX&');

        // Strategy 2: If not found, look for 'WTX' + Month (e.g., WTX02) with highest volume
        if (!target) {
            const candidates = data.filter(item =>
                item.id &&
                item.id.startsWith('WTX') &&
                !item.id.includes('P') && // Exclude options often labelled P? Or Mini? actually WTX is big.
                !item.id.includes('M') // Exclude Mini (WTM) / Micro
            );

            // Sort by volume descending
            if (candidates.length > 0) {
                target = candidates.sort((a, b) => (b.volume || 0) - (a.volume || 0))[0];
            }
        }

        if (!target) return null;

        // WantGoo Data Structure:
        // { id, close, open, high, low, volume, change, ... }
        // Note: 'close' is current price. 'change' might need calculation if missing.

        const price = Number(target.close || target.deal || 0);
        const prevClose = Number(target.previousClose || target.reference || price);
        const change = target.change ? Number(target.change) : (price - prevClose);
        const changePercent = prevClose ? (change / prevClose) * 100 : 0;

        return {
            id: target.id,
            price,
            change,
            changePercent,
            open: Number(target.open || 0),
            high: Number(target.high || 0),
            low: Number(target.low || 0),
            volume: Number(target.volume || 0),
            updatedAt: Number(target.time || Date.now())
        };

    } catch (error: any) {
        console.error('WantGoo Fetch Error:', error.message);
        return null;
    }
}
