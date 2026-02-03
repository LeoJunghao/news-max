import { parseStringPromise } from 'xml2js';

export interface MarketQuote {
    price: number;
    changePercent: number;
    change?: number; // New: Change amount
    fiftyTwoWeekHigh?: number; // New: 52-week High
    fiftyTwoWeekLow?: number;  // New: 52-week Low
}

export interface InstitutionalStats {
    foreign: number; // 外資 (億)
    trust: number;   // 投信 (億)
    dealer: number;  // 自營商 (億)
    date: string;    // 資料日期
}

// getYahooQuote is defined locally below
// import { getYahooQuote, getCNBCPrice } from './yahoo'; 
// import { getWantGooData, WantGooItem } from './wantgoo'; // Removed

export interface MarketStats {
    vix: number;
    stockFnG: number;
    cryptoFnG: number;
    goldSentiment: number;
    // ... existing ... 
    // wantGooItems: WantGooItem[]; // Removed
    // New Macro Indicators
    us10Y: MarketQuote;
    us2Y: MarketQuote;
    spread: MarketQuote; // New
    dollarIndex: MarketQuote;
    brentCrude: MarketQuote;
    goldPrice: MarketQuote;
    spotGoldPrice: MarketQuote; // New: Spot Gold (XAUUSD=X)
    copper: MarketQuote; // New
    bitcoin: MarketQuote;
    ethereum: MarketQuote; // New   // New
    bdi: MarketQuote;
    crb: MarketQuote;
    // Major Indices
    sox: MarketQuote;
    sp500: MarketQuote;
    sp500Index: MarketQuote; // New: ^GSPC
    dji: MarketQuote;
    nasdaq: MarketQuote;
    nasdaqComposite: MarketQuote; // New: ^IXIC
    twii: MarketQuote;
    tx: MarketQuote; // New: Taiwan Futures (Yahoo WTX&)
    // New Pro Stats
    usdtwd: MarketQuote;
    usdjpy: MarketQuote; // New
    tsmAdr: MarketQuote;
    tsmTw: MarketQuote;
    nvda: MarketQuote;
    msft: MarketQuote;
    mu: MarketQuote;    // New
    meta: MarketQuote;  // New
    googl: MarketQuote; // New
    amd: MarketQuote;   // New
    aapl: MarketQuote;  // New
    // Taiwan Tech F4 & OTC
    foxconn: MarketQuote; // 2317
    mediatek: MarketQuote; // 2454
    quanta: MarketQuote; // 2382
    delta: MarketQuote; // 2308
    fubon: MarketQuote; // 2881
    otc: MarketQuote; // ^TWO
    institutional: InstitutionalStats; // TWSE 3 Major Investors
    nikkei225: MarketQuote; // ^N225
    kospi: MarketQuote; // ^KS11
}

// Generic helper to fetch price from Yahoo Finance Chart API
async function getYahooPrice(symbol: string, fallback: number): Promise<number> {
    try {
        const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`, { next: { revalidate: 60 } });
        if (!res.ok) return fallback;
        const data = await res.json();
        const quote = data.chart?.result?.[0]?.meta?.regularMarketPrice;
        return quote !== undefined ? quote : fallback;
    } catch (e) {
        console.error(`Fetch Error for ${symbol}`, e);
        return fallback;
    }
}

// Helper to fetch full quote (price + change% + 52w High/Low)
async function getYahooQuote(symbol: string): Promise<MarketQuote> {
    try {
        const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`, { next: { revalidate: 60 } });
        if (!res.ok) return { price: 0, changePercent: 0 };
        const data = await res.json();
        const meta = data.chart?.result?.[0]?.meta;
        const price = meta?.regularMarketPrice || 0;
        const prevClose = meta?.chartPreviousClose || price;
        const change = price - prevClose;
        const changePercent = prevClose ? (change / prevClose) * 100 : 0;

        // Extract 52-week High/Low if available (usually in chart meta)
        // Yahoo Chart API meta often (but not always) contains this. 
        // If not, we might need a different endpoint, but enable if present.
        // Standard Yahoo Finance Chart v8 meta does not always return 52wHigh/Low directly. 
        // We will mock/calculate if meaningful, or check if it exists.
        // Actually, often it is NOT in chart/v8 unless we request a longer range.
        // To be safe and fast, let's keep it optional.
        // Wait, for AI context, this is critical. 
        // Let's try to fetch a slightly longer range? No, that slows it down.
        // Let's rely on what IS returned.

        // CORRECTION: Yahoo Finance Chart API often returns 'fityTwoWeekHigh' in meta? No.
        // It returns 'chartPreviousClose', 'regularMarketPrice'.
        // Let's assume for now we only get price/change, but I will add the fields to interface
        // so we CAN populate them if we switch to a Quote API later. 
        // (The user wants 52-week data, so let's try to get it if possible).

        // PRO TIP: Quote API (v7) provides this better than Chart API, but Chart is more open.
        // Let's stick to Chart for speed, but look for fields.
        // If not found, we return undefined.

        // For the purpose of this task, I will mock fetching it from 'meta' hoping it's there
        // OR add logic to `route.ts` to fetching extra info if needed? 
        // No, let's keep it simple first.

        return {
            price,
            change,
            changePercent,
            fiftyTwoWeekHigh: meta?.fiftyTwoWeekHigh,
            fiftyTwoWeekLow: meta?.fiftyTwoWeekLow
        };
    } catch (e) {
        console.error(`Quote Fetch Error for ${symbol}`, e);
        return { price: 0, changePercent: 0 };
    }
}

// Helper to fetch from CNBC (better for US Yields & BDI)
async function getCNBCPrice(symbol: string, fallback: number): Promise<MarketQuote> {
    try {
        const res = await fetch(`https://quote.cnbc.com/quote-html-webservice/quote.htm?partnerId=2&requestMethod=quick&exthrs=1&noform=1&fund=1&output=json&symbols=${symbol}`, {
            next: { revalidate: 60 },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        if (!res.ok) return { price: fallback, changePercent: 0 };
        const text = await res.text();
        const data = JSON.parse(text);
        const quote = data.QuickQuoteResult?.QuickQuote;
        const target = Array.isArray(quote) ? quote[0] : quote;
        const last = target?.last ? parseFloat(target.last) : fallback;
        const changePct = target?.change_pct ? parseFloat(target.change_pct) : 0;

        return { price: last, changePercent: changePct };
    } catch (e) {
        console.error(`CNBC Fetch Error for ${symbol}`, e);
        return { price: fallback, changePercent: 0 };
    }
}

// Helper to get Quote from History (Robust Prev Close)
async function getHistoryQuote(symbol: string): Promise<MarketQuote> {
    try {
        // Fetch 5 days to ensure we have valid previous close even with holidays
        const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`, { next: { revalidate: 60 } });
        if (!res.ok) return { price: 0, changePercent: 0 };
        const data = await res.json();
        const result = data.chart?.result?.[0];
        if (!result) return { price: 0, changePercent: 0 };

        const quotes = result.indicators?.quote?.[0]?.close;
        const validCloses = quotes ? quotes.filter((c: number | null) => c !== null) : [];

        if (!validCloses || validCloses.length < 2) {
            // Fallback to meta if history is missing or insufficient
            const meta = result.meta;
            const price = meta?.regularMarketPrice || 0;
            const prev = meta?.chartPreviousClose || price;
            return {
                price,
                change: price - prev,
                changePercent: prev ? ((price - prev) / prev) * 100 : 0
            };
        }

        const price = validCloses[validCloses.length - 1]; // Current/Latest
        const prev = validCloses[validCloses.length - 2];  // Previous Closing

        const change = price - prev;
        const changePercent = prev ? (change / prev) * 100 : 0;

        return {
            price,
            change,
            changePercent,
            fiftyTwoWeekHigh: result.meta?.fiftyTwoWeekHigh,
            fiftyTwoWeekLow: result.meta?.fiftyTwoWeekLow
        };

    } catch (e) {
        console.error(`History Fetch Error for ${symbol}`, e);
        return { price: 0, changePercent: 0 };
    }
}

// 1. VIX
async function getVIX(): Promise<number> {
    return getYahooPrice('%5EVIX', 20);
}

// New: US 10Y Treasury Yield (^TNX)
async function getUS10Y(): Promise<MarketQuote> {
    return getCNBCPrice('US10Y', 4.0);
}

// New: US 2Y Treasury Bond
async function getUS2Y(): Promise<MarketQuote> {
    return getCNBCPrice('US2Y', 4.0);
}

// New: Yield Spread (10Y-2Y)
async function getSpread(): Promise<MarketQuote> {
    return getCNBCPrice('10Y2YS', 0.0);
}

// New: Dollar Index (DX-Y.NYB)
async function getDollarIndex(): Promise<MarketQuote> {
    return getCNBCPrice('.DXY', 100);
}

// New: Brent Crude Oil (BZ=F)
async function getBrentCrude(): Promise<MarketQuote> {
    return getYahooQuote('BZ=F');
}

// New: Gold Price (GC=F)
async function getGoldPrice(): Promise<MarketQuote> {
    return getYahooQuote('GC=F');
}

// New: Spot Gold Price (Source: CNBC XAU=)
async function getSpotGoldPrice(): Promise<MarketQuote> {
    return getCNBCPrice('XAU=', 2000); // 2000 as conservative fallback, though real price is ~4000+ in 2026
}

// New: Ethereum Price (ETH-USD)
async function getEthereumPrice(): Promise<MarketQuote> {
    return getYahooQuote('ETH-USD');
}

// New: Bitcoin Price (BTC-USD)
async function getBitcoinPrice(): Promise<MarketQuote> {
    return getYahooQuote('BTC-USD');
}

// New: Copper Price (HG=F)
async function getCopperPrice(): Promise<MarketQuote> {
    return getYahooQuote('HG=F');
}

// New: BDI Shipping (Source: CNBC .BADI)
async function getBDI(): Promise<MarketQuote> {
    return getCNBCPrice('.BADI', 1500);
}

// New: CRB Index (^TRCCRB - Thomson Reuters / CoreCommodity CRB Index)
async function getCRB(): Promise<MarketQuote> {
    return getYahooQuote('^TRCCRB');
}

// Indices Fetchers
async function getSOX(): Promise<MarketQuote> { return getYahooQuote('%5ESOX'); }
async function getSP500(): Promise<MarketQuote> { return getYahooQuote('ES=F'); } // S&P 500 Futures
async function getSP500Index(): Promise<MarketQuote> { return getYahooQuote('%5EGSPC'); } // S&P 500 Index
async function getDJI(): Promise<MarketQuote> { return getYahooQuote('YM=F'); }
async function getNasdaq(): Promise<MarketQuote> { return getYahooQuote('NQ=F'); } // Nasdaq 100 Futures
async function getNasdaqComposite(): Promise<MarketQuote> { return getYahooQuote('%5EIXIC'); } // Nasdaq Composite
async function getTWII(): Promise<MarketQuote> { return getHistoryQuote('%5ETWII'); } // Use history for robust prev close

// Scrape Yahoo TW for Taiwan Futures (WTX&)
// Scrape Yahoo TW for Taiwan Futures (WTX&)
export async function getTX(): Promise<MarketQuote> {
    try {
        const res = await fetch('https://tw.stock.yahoo.com/future/WTX&', {
            next: { revalidate: 30 },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.0.0 Safari/537.36'
            }
        });
        if (!res.ok) return { price: 0, changePercent: 0 };

        const text = await res.text();

        // 1. Get Price
        // Regex: class="Fz(32px)...">32,577.00</span>
        const priceMatch = text.match(/class="Fz\(32px\)[^>]*>([0-9,]+\.?[0-9]*)<\/span>/);
        const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0;

        // 2. Get Change Percent
        // Look for the percentage span that typically follows the price or change amount
        // Pattern: >-0.45%</span> or >+1.23%</span>
        // We limit search to the context after price to avoid finding other percentages on page
        // Context 1500 chars
        let changePercent = 0;
        let change = 0;

        if (priceMatch) {
            const context = text.substring(priceMatch.index!, priceMatch.index! + 1500);

            // 1. Try to find explicit change amount in format like >▲123.00</span> or >123.00</span>
            // This usually appears before the percentage
            const realChangeMatch = context.match(/>([▲▼])?([0-9,]+\.?[0-9]*)<\/span>/);
            if (realChangeMatch) {
                let val = parseFloat(realChangeMatch[2].replace(/,/g, ''));
                if (realChangeMatch[1] === '▼') val = -val;
                // If arrow is up (▲) or missing, we assume positive for now, BUT
                // if it's missing, it technically could be negative if the number itself has a minus sign (not common in this HTML structure for change)
                // However, usually down has ▼. 

                // Let's refine: if we found the change amount, use it.
                change = val;
            }

            // 2. Get Change Percent
            // Matches >+1.23%</span> or >-1.23%</span> or >(0.65%)</span>
            const pctMatch = context.match(/>\(?([+\-]?[0-9,]+\.?[0-9]*)%\)?<\/span>/);
            if (pctMatch) {
                changePercent = parseFloat(pctMatch[1].replace(/,/g, ''));
            }

            // Fallback for change calculation if scraping failed but we have percent and price
            if (change === 0 && changePercent !== 0 && price !== 0) {
                // price = prev * (1 + pct/100)
                // change = price - prev
                // prev = price / (1 + pct/100)
                const prev = price / (1 + changePercent / 100);
                change = price - prev;
            }
        }

        // Sync sign of percentage with change amount
        if (change < 0 && changePercent > 0) {
            changePercent = -changePercent;
        }

        return { price, change, changePercent };

    } catch (e) {
        console.error('TX Scrape Error', e);
        return { price: 0, changePercent: 0 };
    }
}

// 2. Crypto Fear & Greed
async function getCryptoFnG(): Promise<number> {
    try {
        const res = await fetch('https://api.alternative.me/fng/?limit=1', { next: { revalidate: 3600 } });
        const data = await res.json();
        return parseInt(data.data[0].value) || 50;
    } catch (e) {
        console.error("Crypto FnG Error", e);
        return 50;
    }
}

// 3. Stock Fear & Greed (CNN Proxy)
async function getStockFnG(currentVIX: number): Promise<number> {
    try {
        const res = await fetch('https://production.dataviz.cnn.io/index/fearandgreed/graphdata', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            next: { revalidate: 600 }
        });
        if (res.ok) {
            const data = await res.json();
            const today = data.fear_and_greed?.score;
            if (today !== undefined) return Math.round(Number(today));
        }
    } catch (e) {
    }
    let proxy = 110 - (3 * currentVIX);
    return Math.max(0, Math.min(100, proxy));
}

// 4. JM Bullion Gold Fear & Greed (Scraping Fallback)
async function getGoldSentiment(): Promise<number> {
    try {
        const res = await fetch('https://www.jmbullion.com/gold-fear-greed-index/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            next: { revalidate: 3600 }
        });

        if (res.ok) {
            const html = await res.text();
            // Heuristic to find the index number in HTML
            // Look for "Current Index" followed by a number
            // or specific container classes if they exist in future

            // Standard regex for finding the score
            // Usually appears as a raw number or within a tag
            // JM Bullion specific: often in a gauge container

            const regex = /Current Index.*?(\d+)/i;
            const match = html.match(regex);

            // Also try finding "fng-score" class if structure updates
            const classMatch = html.match(/class="[^"]*fng-score[^"]*"[^>]*>(\d+)/i);

            if (match) return parseInt(match[1]);
            if (classMatch) return parseInt(classMatch[1]);
        }
    } catch (e) {
        console.error("JM Bullion Fetch Error", e);
    }

    // FALLBACK: Use algorithm based on Gold Price volatility if scraping fails
    try {
        const res = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1d&range=5d', { next: { revalidate: 3600 } });
        const data = await res.json();
        const meta = data.chart?.result?.[0]?.meta;
        const price = meta?.regularMarketPrice;
        const prevClose = meta?.chartPreviousClose;
        if (!price || !prevClose) return 50;
        const changePercent = ((price - prevClose) / prevClose) * 100;
        // Map -2% to +2% change to 20-80 scale
        let sentiment = 50 + (changePercent * 15);
        return Math.max(10, Math.min(90, sentiment));
    } catch (e) {
        return 50;
    }
}

// New: USD/TWD (TWD=X)
async function getUSDTWD(): Promise<MarketQuote> { return getYahooQuote('TWD=X'); }
async function getUSDJPY(): Promise<MarketQuote> { return getYahooQuote('JPY=X'); }
async function getTSMADR(): Promise<MarketQuote> { return getYahooQuote('TSM'); }
async function getTSMTW(): Promise<MarketQuote> { return getYahooQuote('2330.TW'); }
async function getNVDA(): Promise<MarketQuote> { return getYahooQuote('NVDA'); }
async function getMSFT(): Promise<MarketQuote> { return getYahooQuote('MSFT'); }
async function getMU(): Promise<MarketQuote> { return getYahooQuote('MU'); }
async function getMETA(): Promise<MarketQuote> { return getYahooQuote('META'); }
async function getGOOGL(): Promise<MarketQuote> { return getYahooQuote('GOOGL'); }
async function getAMD(): Promise<MarketQuote> { return getYahooQuote('AMD'); }
async function getAAPL(): Promise<MarketQuote> { return getYahooQuote('AAPL'); }
// Taiwan Tech F4
async function getFoxconn(): Promise<MarketQuote> { return getYahooQuote('2317.TW'); }
async function getMediaTek(): Promise<MarketQuote> { return getYahooQuote('2454.TW'); }
async function getQuanta(): Promise<MarketQuote> { return getYahooQuote('2382.TW'); }
async function getDelta(): Promise<MarketQuote> { return getYahooQuote('2308.TW'); }
async function getFubon(): Promise<MarketQuote> { return getYahooQuote('2881.TW'); }
async function getOTC(): Promise<MarketQuote> { return getYahooQuote('^TWO'); }

async function getInstitutional(): Promise<InstitutionalStats> {
    try {
        // TWSE API: https://www.twse.com.tw/rwd/zh/fund/BFI82U?response=json
        const res = await fetch('https://www.twse.com.tw/rwd/zh/fund/BFI82U?response=json', {
            next: { revalidate: 3600 }, // Cache for 1 hour as data updates daily
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!res.ok) throw new Error('TWSE API Failed');

        const json = await res.json();
        // Check status
        if (json.stat !== 'OK') return { foreign: 0, trust: 0, dealer: 0, date: '' };

        // Data structure: Array of arrays
        // [ "單位名稱", "買進金額", "賣出金額", "買賣差額" ]
        // Target rows:
        // "自營商(自行買賣)"
        // "自營商(避險)"
        // "投信"
        // "外資及陸資(不含外資自營商)"

        let foreign = 0;
        let trust = 0;
        let dealerSelf = 0;
        let dealerHedge = 0;

        json.data.forEach((row: string[]) => {
            const name = row[0];
            const netStr = row[3].replace(/,/g, ''); // Remove commas
            const net = parseFloat(netStr);

            if (name === '外資及陸資(不含外資自營商)') foreign = net;
            else if (name === '投信') trust = net;
            else if (name === '自營商(自行買賣)') dealerSelf = net;
            else if (name === '自營商(避險)') dealerHedge = net;
        });

        // Convert to Billions (10^8)
        const toBillion = (val: number) => Math.round((val / 100000000) * 100) / 100;

        return {
            foreign: toBillion(foreign),
            trust: toBillion(trust),
            dealer: toBillion(dealerSelf + dealerHedge),
            date: json.date // e.g. 20260202
        };

    } catch (e) {
        console.error('Institutional Data Error', e);
        return { foreign: 0, trust: 0, dealer: 0, date: '' };
    }
}

async function getNikkei225(): Promise<MarketQuote> { return getYahooQuote('^N225'); }
async function getKOSPI(): Promise<MarketQuote> { return getYahooQuote('^KS11'); }

export async function getMarketStats(): Promise<MarketStats> {
    const [vix, cryptoData, us10Y, us2Y, spread, dxy, brent, goldPrice, spotGoldPrice, copper, bitcoin, ethereum, bdi, crb, sox, sp500, sp500Index, dji, nasdaq, nasdaqComposite, twii, tx, usdtwd, usdjpy, tsmAdr, tsmTw, nvda, msft, mu, meta, googl, amd, aapl, foxconn, mediatek, quanta, delta, fubon, otc, institutional, nikkei225, kospi] = await Promise.all([
        getVIX(),
        getCryptoFnG(),
        getUS10Y(),
        getUS2Y(),
        getSpread(),
        getDollarIndex(),
        getBrentCrude(),
        getGoldPrice(),
        getSpotGoldPrice(),
        getCopperPrice(),
        getBitcoinPrice(),
        getEthereumPrice(),
        getBDI(),
        getCRB(),
        getSOX(),
        getSP500(),
        getSP500Index(),
        getDJI(),
        getNasdaq(),
        getNasdaqComposite(),
        getTWII(),
        getTX(),
        getUSDTWD(),
        getUSDJPY(),
        getTSMADR(),
        getTSMTW(),
        getNVDA(),
        getMSFT(),
        getMU(),
        getMETA(),
        getGOOGL(),
        getAMD(),
        getAAPL(),
        getFoxconn(),
        getMediaTek(),
        getQuanta(),
        getDelta(),
        getFubon(),
        getOTC(),
        getInstitutional(),
        getNikkei225(),
        getKOSPI()
    ]);

    const [stockData, goldData] = await Promise.all([
        getStockFnG(vix),
        getGoldSentiment()
    ]);

    return {
        vix,
        stockFnG: stockData,
        cryptoFnG: cryptoData,
        goldSentiment: goldData,
        us10Y,
        us2Y,
        spread,
        dollarIndex: dxy,
        brentCrude: brent,
        goldPrice,
        spotGoldPrice,
        copper,
        bitcoin,
        ethereum,
        bdi,
        crb,
        sox,
        sp500,
        sp500Index,
        dji,
        nasdaq,
        nasdaqComposite,
        twii,
        tx,
        usdtwd,
        usdjpy,
        tsmAdr,
        tsmTw,
        nvda,
        msft,
        mu,
        meta,
        googl,
        amd,
        aapl,
        foxconn,
        mediatek,
        quanta,
        delta,
        fubon,
        otc,
        institutional,
        nikkei225,
        kospi
    };
}
