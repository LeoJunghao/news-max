
// WantGoo Data Fetcher

// Mapping of Name to WantGoo ID
const WANTGOO_IDS = {
    weighted: '0000',      // 加權指數 (Verified)
    otc: 'TWO',            // 櫃檯指數 (Verified)
    futures: 'WTX&',       // 台指期 (Verified: ~31463)
    futures_after: 'WTXP&',// 台指期盤後 (Verified: 31889 - Exact)
    sgx: 'WTF&',           // 富台指 (Best Guess based on 'WTF' = Taiwan Futures? Found in logs: WTF& 2376 vs 2530. Maybe outdated?)
    // UPDATE: Found 'WTF&' in log. Let's try it.
};

export interface WantGooItem {
    id: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    updatedAt: number;
}

export async function getWantGooData(): Promise<WantGooItem[]> {
    try {
        const res = await fetch('https://www.wantgoo.com/investrue/all-quote-info', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://www.wantgoo.com/',
                'X-Requested-With': 'XMLHttpRequest',
                'Cache-Control': 'no-cache'
            },
            next: { revalidate: 60 } // Cache for 1 min
        });

        if (!res.ok) throw new Error(`WantGoo fetch failed: ${res.status}`);

        const data = await res.json();
        const results: WantGooItem[] = [];

        // Helper to find and push
        const addItem = (key: string, name: string) => {
            // Find by ID directly
            const item = data.find((d: any) => d.id === key);
            if (item) {
                const price = item.close || item.deal || 0;
                const prev = item.previousClose || item.refPrice || price; // Fallback
                const change = parseFloat((price - prev).toFixed(2));
                const changePercent = prev ? parseFloat(((change / prev) * 100).toFixed(2)) : 0;

                results.push({
                    id: key,
                    name,
                    price,
                    change,
                    changePercent,
                    volume: item.volume || 0,
                    updatedAt: item.time || Date.now()
                });
            }
        };

        addItem(WANTGOO_IDS.weighted, '加權指數');
        addItem(WANTGOO_IDS.otc, '櫃檯指數');
        addItem(WANTGOO_IDS.sgx, '富台指');
        addItem(WANTGOO_IDS.futures, '台指期');
        addItem(WANTGOO_IDS.futures_after, '台指期盤後');

        return results;

    } catch (error) {
        console.error('Error fetching WantGoo data:', error);
        return [];
    }
}
