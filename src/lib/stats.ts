import { parseStringPromise } from 'xml2js';

export interface MarketQuote {
    price: number;
    changePercent: number;
}

export interface MarketStats {
    vix: number;
    stockFnG: number;
    cryptoFnG: number;
    goldSentiment: number;
    // New Macro Indicators
    us10Y: MarketQuote;
    us2Y: MarketQuote;
    dollarIndex: MarketQuote;
    brentCrude: MarketQuote;
    goldPrice: MarketQuote;
    bitcoin: MarketQuote;   // New
    bdi: MarketQuote;
    crb: MarketQuote;
    // Major Indices
    sox: MarketQuote;
    sp500: MarketQuote;
    dji: MarketQuote;
    nasdaq: MarketQuote; // New
    twii: MarketQuote;
    // New Pro Stats
    usdtwd: MarketQuote;
    tsmAdr: MarketQuote;
    tsmTw: MarketQuote;
    nvda: MarketQuote;
    msft: MarketQuote;
}

// Generic helper to fetch price from Yahoo Finance Chart API
async function getYahooPrice(symbol: string, fallback: number): Promise<number> {
    try {
        const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`, { next: { revalidate: 300 } });
        if (!res.ok) return fallback;
        const data = await res.json();
        const quote = data.chart?.result?.[0]?.meta?.regularMarketPrice;
        return quote !== undefined ? quote : fallback;
    } catch (e) {
        console.error(`Fetch Error for ${symbol}`, e);
        return fallback;
    }
}

// Helper to fetch full quote (price + change%)
async function getYahooQuote(symbol: string): Promise<MarketQuote> {
    try {
        const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`, { next: { revalidate: 300 } });
        if (!res.ok) return { price: 0, changePercent: 0 };
        const data = await res.json();
        const meta = data.chart?.result?.[0]?.meta;
        const price = meta?.regularMarketPrice || 0;
        const prevClose = meta?.chartPreviousClose || price;
        const changePercent = prevClose ? ((price - prevClose) / prevClose) * 100 : 0;

        return { price, changePercent };
    } catch (e) {
        console.error(`Quote Fetch Error for ${symbol}`, e);
        return { price: 0, changePercent: 0 };
    }
}

// Helper to fetch from CNBC (better for US Yields & BDI)
async function getCNBCPrice(symbol: string, fallback: number): Promise<MarketQuote> {
    try {
        const res = await fetch(`https://quote.cnbc.com/quote-html-webservice/quote.htm?partnerId=2&requestMethod=quick&exthrs=1&noform=1&fund=1&output=json&symbols=${symbol}`, { next: { revalidate: 300 } });
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

// 1. VIX
async function getVIX(): Promise<number> {
    return getYahooPrice('%5EVIX', 20);
}

// New: US 10Y Treasury Yield (^TNX)
async function getUS10Y(): Promise<MarketQuote> {
    return getYahooQuote('%5ETNX');
}

// New: US 2Y Treasury Bond (Source: Yahoo ^IRX is 13 week, ^FVX is 5 year. ^TU is not available directly on public yahoo easily. Let's try CNBC or use ^UST2Y if available, but ^TNX is standard. 
// Standard Yahoo symbols for treasuries: ^TNX (10y), ^TYX (30y), ^FVX (5y), ^IRX (13w). 2Y is harder. 
// We can use CNBC for US2Y which we already have helper for.
async function getUS2Y(): Promise<MarketQuote> {
    return getCNBCPrice('US2Y', 4.0);
}

// New: Dollar Index (DX-Y.NYB)
async function getDollarIndex(): Promise<MarketQuote> {
    return getYahooQuote('DX-Y.NYB');
}

// New: Brent Crude Oil (BZ=F)
async function getBrentCrude(): Promise<MarketQuote> {
    return getYahooQuote('BZ=F');
}

// New: Gold Price (GC=F)
async function getGoldPrice(): Promise<MarketQuote> {
    return getYahooQuote('GC=F');
}

// New: Bitcoin Price (BTC-USD)
async function getBitcoinPrice(): Promise<MarketQuote> {
    return getYahooQuote('BTC-USD');
}

// New: BDI Shipping (Source: CNBC .BADI)
async function getBDI(): Promise<MarketQuote> {
    return getCNBCPrice('.BADI', 1500);
}

// New: CRB Index (^TRCCRB - Thomson Reuters / CoreCommodity CRB Index)
async function getCRB(): Promise<MarketQuote> {
    // Yahoo often uses ^TRCCRB or similar. Let's try ^TRCCRB.
    // Sometimes it's CL=F for oil, but CRB index itself is specific.
    return getYahooQuote('^TRCCRB');
}

// Indices Fetchers (Switched to Futures for 24h Coverage)
async function getSOX(): Promise<MarketQuote> { return getYahooQuote('%5ESOX'); } // SOX has no liquid 24h future, keeping Index
async function getSP500(): Promise<MarketQuote> { return getYahooQuote('ES=F'); } // S&P 500 Futures
async function getDJI(): Promise<MarketQuote> { return getYahooQuote('YM=F'); }   // Dow Futures
async function getNasdaq(): Promise<MarketQuote> { return getYahooQuote('NQ=F'); } // Nasdaq 100 Futures (New)
async function getTWII(): Promise<MarketQuote> { return getYahooQuote('%5ETWII'); }

// 2. Crypto Fear & Greed from Alternative.me
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
            headers: { 'User-Agent': 'Mozilla/5.0' },
            next: { revalidate: 3600 }
        });
        if (res.ok) {
            const data = await res.json();
            const today = data.fear_and_greed?.score;
            // User requested 2 decimal places, so valid float is needed.
            if (today !== undefined) return Number(today);
        }
    } catch (e) {
        // Silently fail to fallback
    }

    // Fallback: VIX Proxy
    let proxy = 110 - (3 * currentVIX);
    return Math.max(0, Math.min(100, proxy));
}

// 4. MM Gold Sentiment (Proxy: Gold Trend)
async function getGoldSentiment(): Promise<number> {
    try {
        // GC=F
        const res = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1d&range=5d', { next: { revalidate: 3600 } });
        const data = await res.json();
        const meta = data.chart?.result?.[0]?.meta;
        const price = meta?.regularMarketPrice;
        const prevClose = meta?.chartPreviousClose;

        if (!price || !prevClose) return 50;

        const changePercent = ((price - prevClose) / prevClose) * 100;
        let sentiment = 50 + (changePercent * 10);
        return Math.max(10, Math.min(90, sentiment));
    } catch (e) {
        return 50;
    }
}

// New: USD/TWD (TWD=X)
async function getUSDTWD(): Promise<MarketQuote> {
    return getYahooQuote('TWD=X');
}

// New: TSMC ADR (TSM)
async function getTSMADR(): Promise<MarketQuote> {
    return getYahooQuote('TSM');
}

// New: TSMC TWSE (2330.TW)
async function getTSMTW(): Promise<MarketQuote> {
    return getYahooQuote('2330.TW');
}

// New: NVIDIA (NVDA)
async function getNVDA(): Promise<MarketQuote> {
    return getYahooQuote('NVDA');
}

// New: Microsoft (MSFT)
async function getMSFT(): Promise<MarketQuote> {
    return getYahooQuote('MSFT');
}

export async function getMarketStats(): Promise<MarketStats> {
    // Parallel fetch
    const [vix, cryptoData, us10Y, us2Y, dxy, brent, goldPrice, bitcoin, bdi, crb, sox, sp500, dji, nasdaq, twii, usdtwd, tsmAdr, tsmTw, nvda, msft] = await Promise.all([
        getVIX(),
        getCryptoFnG(),
        getUS10Y(),
        getUS2Y(),
        getDollarIndex(),
        getBrentCrude(),
        getGoldPrice(),
        getBitcoinPrice(),
        getBDI(),
        getCRB(),
        getSOX(),
        getSP500(),
        getDJI(),
        getNasdaq(), // New
        getTWII(),
        getUSDTWD(),
        getTSMADR(),
        getTSMTW(),
        getNVDA(),
        getMSFT()
    ]);

    // Dependent stats
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
        dollarIndex: dxy,
        brentCrude: brent,
        goldPrice,
        bitcoin,
        bdi,
        crb,
        sox,
        sp500,
        dji,
        nasdaq, // New
        twii,
        usdtwd,
        tsmAdr,
        tsmTw,
        nvda,
        msft
    };
}
