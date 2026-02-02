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
    tx: MarketQuote; // New: Taiwan Futures
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

// Helper to fetch full quote (price + change%)
async function getYahooQuote(symbol: string): Promise<MarketQuote> {
    try {
        const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`, { next: { revalidate: 60 } });
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

// New: Spot Gold Price (XAUUSD=X)
async function getSpotGoldPrice(): Promise<MarketQuote> {
    return getYahooQuote('XAUUSD=X');
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
async function getTWII(): Promise<MarketQuote> { return getYahooQuote('%5ETWII'); }
// Helper to getting Fugle TX Data
async function getFugleTX(): Promise<MarketQuote | null> {
    const apiKey = process.env.FUGLE_API_KEY;
    if (!apiKey) return null;

    try {
        // 1. Get list of TXF contracts to find the active one (Near month)
        // Filtering for FUTURE, TAIFEX, and TXF product
        const listRes = await fetch('https://api.fugle.tw/marketdata/v1.0/futopt/intraday/tickers?type=FUTURE&exchange=TAIFEX&symbol=TXF', {
            headers: { 'X-API-KEY': apiKey },
            next: { revalidate: 300 } // Revalidate list every 5 mins
        });

        if (!listRes.ok) return null;

        const listData = await listRes.json();
        // Sort by symbol to find the nearest date (e.g. TXF202402 < TXF202403)
        // Filter for "Regular" contracts (Standard active contracts usually strictly follow TXF+YM format)
        // We look for standard length symbols to avoid spreads if formatted differently, 
        // though usually standard contracts are just 3 chars + YearMonth (+opt Day)
        const contracts = (listData.data || [])
            .map((c: any) => c.symbol)
            .sort();

        if (contracts.length === 0) return null;

        const activeSymbol = contracts[0]; // Pick the nearest month

        // 2. Get Quote for the active symbol
        const quoteRes = await fetch(`https://api.fugle.tw/marketdata/v1.0/futopt/intraday/quote/${activeSymbol}`, {
            headers: { 'X-API-KEY': apiKey },
            next: { revalidate: 30 }
        });

        if (!quoteRes.ok) return null;

        const quoteData = await quoteRes.json();
        if (!quoteData.lastPrice) return null;

        const price = quoteData.lastPrice;
        const changePercent = quoteData.changePercent || 0;

        return { price, changePercent };

    } catch (e) {
        console.error("Fugle API Error:", e);
        return null; // Fallback
    }
}

async function getTX(): Promise<MarketQuote> {
    // 1. Try Fugle API First
    const fugleData = await getFugleTX();
    if (fugleData) return fugleData;

    // 2. Fallback to Yahoo Scrape
    try {
        const res = await fetch('https://tw.stock.yahoo.com/future/WTX&', { next: { revalidate: 30 } });
        if (!res.ok) return { price: 0, changePercent: 0 };

        const text = await res.text();
        // Price regex: class="Fz(32px)...">32,577.00</span>
        const priceMatch = text.match(/class="Fz\(32px\)[^>]*>([0-9,]+\.?[0-9]*)<\/span>/);
        const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0;

        // Extract first percentage found after price
        // Usually >-0.45%</span>
        let changePercent = 0;
        if (priceMatch) {
            const afterPrice = text.substring(priceMatch.index! + priceMatch[0].length, priceMatch.index! + priceMatch[0].length + 1000);
            const pctMatch = afterPrice.match(/>([+\-]?[0-9,]+\.?[0-9]*)%<\/span>/);
            if (pctMatch) {
                changePercent = parseFloat(pctMatch[1].replace(/,/g, ''));
            }
        }

        return { price, changePercent };
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
            headers: { 'User-Agent': 'Mozilla/5.0' },
            next: { revalidate: 3600 }
        });
        if (res.ok) {
            const data = await res.json();
            const today = data.fear_and_greed?.score;
            if (today !== undefined) return Number(today);
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
async function getNikkei225(): Promise<MarketQuote> { return getYahooQuote('^N225'); }
async function getKOSPI(): Promise<MarketQuote> { return getYahooQuote('^KS11'); }

export async function getMarketStats(): Promise<MarketStats> {
    const [vix, cryptoData, us10Y, us2Y, spread, dxy, brent, goldPrice, spotGoldPrice, copper, bitcoin, ethereum, bdi, crb, sox, sp500, sp500Index, dji, nasdaq, nasdaqComposite, twii, tx, usdtwd, usdjpy, tsmAdr, tsmTw, nvda, msft, mu, meta, googl, amd, aapl, foxconn, mediatek, quanta, delta, fubon, otc, nikkei225, kospi] = await Promise.all([
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
        nikkei225,
        kospi
    };
}
