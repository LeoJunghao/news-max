'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Zap, Copy, TrendingUp, Cpu } from 'lucide-react';
import { NewsSection } from '@/components/NewsSection';
import { Gauge } from '@/components/Gauge';
import type { NewsItem } from '@/lib/news';
import type { MarketStats, MarketQuote } from '@/lib/stats';
import { formatNewsForClipboard, cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface DashboardClientProps {
    initialData: {
        us: NewsItem[];
        intl: NewsItem[];
        geo: NewsItem[];
        tw: NewsItem[];
        crypto: NewsItem[];
    };
    initialStats: MarketStats;
    lastUpdatedStr: string;
}

export function DashboardClient({ initialData, initialStats, lastUpdatedStr }: DashboardClientProps) {
    const [data, setData] = useState(initialData);
    const [stats, setStats] = useState<MarketStats | null>(initialStats);
    const [loading, setLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date(lastUpdatedStr));
    const [aiSummary, setAiSummary] = useState<string>("");
    const [generatingSummary, setGeneratingSummary] = useState(false);

    const generateSummary = async (news: any, marketStats: any) => {
        setGeneratingSummary(true);
        try {
            const res = await fetch('/api/summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ news, stats: marketStats })
            });
            const data = await res.json();
            if (data.summary) {
                setAiSummary(data.summary);
            } else if (data.error) {
                console.error("AI Summary Error:", data.error);
                setAiSummary(`自動分析失敗: ${data.error} (請檢查 API Key 或額度)`);
            }
        } catch (error: any) {
            console.error("Failed to generate summary", error);
            setAiSummary(`連線錯誤: ${error.message || "無法連接伺服器"}`);
        } finally {
            setGeneratingSummary(false);
        }
    };

    const fetchData = useCallback(async (isForceRefresh = false) => {
        setLoading(true);
        // If force refresh, clear all data to force visible regeneration
        if (isForceRefresh) {
            setStats(null);
            setData({
                us: [],
                intl: [],
                geo: [],
                tw: [],
                crypto: []
            });
            setAiSummary(""); // Clear previous summary
        }
        try {
            const forceQuery = isForceRefresh ? '&force=true' : '';
            const timestamp = Date.now();

            const [newsRes, statsRes] = await Promise.all([
                fetch(`/api/news?t=${timestamp}${forceQuery}`, { cache: 'no-store' }),
                fetch(`/api/stats?t=${timestamp}`, { cache: 'no-store' })
            ]);

            if (newsRes.ok && statsRes.ok) {
                const newsJson = await newsRes.json();
                const statsJson = await statsRes.json();
                setData(newsJson);
                setStats(statsJson);
                setLastUpdated(new Date());

                // Trigger AI Summary Generation
                generateSummary(newsJson, statsJson);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Load initial summary if data exists but summary is empty
    useEffect(() => {
        if (!aiSummary && initialData.us.length > 0 && initialStats) {
            generateSummary(initialData, initialStats);
        }
    }, []);

    // Auto-refresh removed per user request
    /* 
    useEffect(() => {
        const interval = setInterval(() => {
            fetchData(false);
        }, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchData]); 
    */

    const handleCopy = () => {
        if (!data || !stats) return;
        const body = formatNewsForClipboard(data, stats);
        navigator.clipboard.writeText(body).then(() => {
            alert("Analysis copied to clipboard!");
        }).catch(err => {
            console.error('Copy failed', err);
            alert("Failed to copy to clipboard.");
        });
    };

    return (
        <div className="min-h-screen bg-[#050b14] text-slate-200">
            {/* Header */}
            <header className="w-full border-b border-cyan-500/20 bg-slate-900/95 backdrop-blur-xl px-4 md:px-8 py-3 flex flex-row justify-between items-center shadow-lg shadow-cyan-900/10">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-cyan-950/50 border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                        <Zap className="text-cyan-400" size={20} />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-xl font-bold text-yellow-400 font-mono tracking-tighter drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]">
                            財經總評
                        </h1>
                        <p className="text-[10px] text-slate-500 font-mono tracking-wider flex items-center gap-2">
                            {lastUpdated.toLocaleString('zh-TW', { hour12: false })}
                            {loading && <span className="text-cyan-500 animate-pulse">Syncing...</span>}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => fetchData(true)}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        <RefreshCw size={16} className={cn("transition-transform duration-700", loading ? "animate-spin" : "group-hover:rotate-180")} />
                        <span className="text-sm font-medium tracking-wide hidden sm:inline">REFRESH</span>
                    </button>

                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 border border-slate-700/50 rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        <Copy size={16} className="text-cyan-400 group-hover:text-cyan-300 transition-colors" />
                        <span className="text-sm font-medium tracking-wide hidden sm:inline">COPY</span>
                    </button>
                </div>
            </header>

            <main className="p-4 md:p-8">
                {/* Macro Pulse Section */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-7xl mx-auto mb-6 px-4 md:px-0"
                >
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-emerald-500/5 border-y border-emerald-500/20 backdrop-blur-sm">
                        <MacroItem
                            label="美債利差 10Y-2Y"
                            value={stats?.spread?.price ? `${stats.spread.price.toFixed(3)}%` : '---'}
                            // Negative spread is bad (Recession signal), can color code if needed, but here using changePercent is tricky as spread has no changePercent. Let's assume red if negative.
                            changePercent={undefined}
                            loading={loading}
                            url="https://www.cnbc.com/quotes/10Y2YS"
                        />
                        <MacroItem
                            label="美元兌台幣"
                            value={stats?.usdtwd?.price.toFixed(2) || '---'}
                            changePercent={stats?.usdtwd?.changePercent}
                            loading={loading}
                            url="https://finance.yahoo.com/quote/TWD=X"
                        />
                        <MacroItem
                            label="美元兌日圓"
                            value={stats?.usdjpy?.price.toFixed(2) || '---'}
                            changePercent={stats?.usdjpy?.changePercent}
                            loading={loading}
                            url="https://finance.yahoo.com/quote/JPY=X"
                        />
                        <MacroItem
                            label="美國 10年公債"
                            value={stats?.us10Y?.price ? `${stats.us10Y.price.toFixed(2)}%` : '---'}
                            changePercent={stats?.us10Y?.changePercent}
                            loading={loading}
                            url="https://www.cnbc.com/quotes/US10Y"
                        />
                        <MacroItem
                            label="美元指數"
                            value={stats?.dollarIndex?.price.toFixed(2) || '---'}
                            changePercent={stats?.dollarIndex?.changePercent}
                            loading={loading}
                            url="https://www.cnbc.com/quotes/.DXY"
                        />
                        <MacroItem
                            label="比特幣"
                            value={`$${stats?.bitcoin?.price.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '---'}`}
                            changePercent={stats?.bitcoin?.changePercent}
                            loading={loading}
                            url="https://finance.yahoo.com/quote/BTC-USD"
                        />
                        <MacroItem
                            label="乙太幣"
                            value={`$${stats?.ethereum?.price.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '---'}`}
                            changePercent={stats?.ethereum?.changePercent}
                            loading={loading}
                            url="https://finance.yahoo.com/quote/ETH-USD"
                        />
                        <MacroItem
                            label="布蘭特原油"
                            value={`$${stats?.brentCrude?.price.toFixed(2)}`}
                            changePercent={stats?.brentCrude?.changePercent}
                            loading={loading}
                            url="https://finance.yahoo.com/quote/BZ=F"
                        />
                        <MacroItem
                            label="黃金價格"
                            value={`$${stats?.goldPrice?.price.toFixed(1) || '---'}`}
                            changePercent={stats?.goldPrice?.changePercent}
                            loading={loading}
                            url="https://finance.yahoo.com/quote/GC=F"
                        />
                        <MacroItem
                            label="銅價"
                            value={`$${stats?.copper?.price.toFixed(2) || '---'}`}
                            changePercent={stats?.copper?.changePercent}
                            loading={loading}
                            url="https://finance.yahoo.com/quote/HG=F"
                        />
                        <MacroItem
                            label="BDI 航運"
                            value={`${stats?.bdi?.price.toFixed(0) || '---'}`}
                            changePercent={stats?.bdi?.changePercent}
                            loading={loading}
                            url="https://www.cnbc.com/quotes/.BADI"
                        />
                        <MacroItem
                            label="台積電溢價"
                            value={stats?.tsmAdr?.price && stats?.tsmTw?.price && stats?.usdtwd?.price
                                ? `${(((stats.tsmAdr.price * stats.usdtwd.price / 5) - stats.tsmTw.price) / stats.tsmTw.price * 100).toFixed(1)}%`
                                : '---'}
                            changePercent={undefined}
                            loading={loading}
                            url="https://finance.yahoo.com/quote/2330.TW"
                        />
                    </div>
                </motion.div>

                {/* AI Leaders Section (New) */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="max-w-7xl mx-auto mb-6 px-4 md:px-0"
                >
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-indigo-500/5 border-y border-indigo-500/20 backdrop-blur-sm">
                        <div className="col-span-2 lg:col-span-4 flex items-center gap-2 text-indigo-400 font-bold font-mono text-sm tracking-wider uppercase mb-2">
                            <Cpu size={16} />
                            AI &amp; Tech Giants
                        </div>
                        <MacroItem
                            label="NVIDIA"
                            value={stats?.nvda?.price ? `$${stats.nvda.price.toFixed(2)}` : '---'}
                            changePercent={stats?.nvda?.changePercent}
                            loading={loading}
                            url="https://finance.yahoo.com/quote/NVDA"
                        />
                        <MacroItem
                            label="TSMC ADR"
                            value={stats?.tsmAdr?.price ? `$${stats.tsmAdr.price.toFixed(2)}` : '---'}
                            changePercent={stats?.tsmAdr?.changePercent}
                            loading={loading}
                            url="https://finance.yahoo.com/quote/TSM"
                        />
                        <MacroItem
                            label="AMD"
                            value={stats?.amd?.price ? `$${stats.amd.price.toFixed(2)}` : '---'}
                            changePercent={stats?.amd?.changePercent}
                            loading={loading}
                            url="https://finance.yahoo.com/quote/AMD"
                        />
                        <MacroItem
                            label="Micron"
                            value={stats?.mu?.price ? `$${stats.mu.price.toFixed(2)}` : '---'}
                            changePercent={stats?.mu?.changePercent}
                            loading={loading}
                            url="https://finance.yahoo.com/quote/MU"
                        />
                        <MacroItem
                            label="Microsoft"
                            value={stats?.msft?.price ? `$${stats.msft.price.toFixed(2)}` : '---'}
                            changePercent={stats?.msft?.changePercent}
                            loading={loading}
                            url="https://finance.yahoo.com/quote/MSFT"
                        />
                        <MacroItem
                            label="Google"
                            value={stats?.googl?.price ? `$${stats.googl.price.toFixed(2)}` : '---'}
                            changePercent={stats?.googl?.changePercent}
                            loading={loading}
                            url="https://finance.yahoo.com/quote/GOOGL"
                        />
                        <MacroItem
                            label="Meta"
                            value={stats?.meta?.price ? `$${stats.meta.price.toFixed(2)}` : '---'}
                            changePercent={stats?.meta?.changePercent}
                            loading={loading}
                            url="https://finance.yahoo.com/quote/META"
                        />
                        <MacroItem
                            label="Apple"
                            value={stats?.aapl?.price ? `$${stats.aapl.price.toFixed(2)}` : '---'}
                            changePercent={stats?.aapl?.changePercent}
                            loading={loading}
                            url="https://finance.yahoo.com/quote/AAPL"
                        />
                    </div>
                </motion.div>

                {/* Taiwan Tech F4 Section (New) */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="max-w-7xl mx-auto mb-6 px-4 md:px-0"
                >
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-purple-500/5 border-y border-purple-500/20 backdrop-blur-sm">
                        <div className="col-span-2 lg:col-span-4 flex items-center gap-2 text-purple-400 font-bold font-mono text-sm tracking-wider uppercase mb-2">
                            <Cpu size={16} />
                            Taiwan Tech Leads & AI Supply Chain
                        </div>
                        <MacroItem
                            label="鴻海 (2317)"
                            value={stats?.foxconn?.price ? `$${stats.foxconn.price.toFixed(1)}` : '---'}
                            changePercent={stats?.foxconn?.changePercent}
                            loading={loading}
                            url="https://finance.yahoo.com/quote/2317.TW"
                        />
                        <MacroItem
                            label="聯發科 (2454)"
                            value={stats?.mediatek?.price ? `$${stats.mediatek.price.toFixed(0)}` : '---'}
                            changePercent={stats?.mediatek?.changePercent}
                            loading={loading}
                            url="https://finance.yahoo.com/quote/2454.TW"
                        />
                        <MacroItem
                            label="廣達 (2382)"
                            value={stats?.quanta?.price ? `$${stats.quanta.price.toFixed(1)}` : '---'}
                            changePercent={stats?.quanta?.changePercent}
                            loading={loading}
                            url="https://finance.yahoo.com/quote/2382.TW"
                        />
                        <MacroItem
                            label="台達電 (2308)"
                            value={stats?.delta?.price ? `$${stats.delta.price.toFixed(1)}` : '---'}
                            changePercent={stats?.delta?.changePercent}
                            loading={loading}
                            url="https://finance.yahoo.com/quote/2308.TW"
                        />
                    </div>
                </motion.div>

                {/* Major Indices Section */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="max-w-7xl mx-auto mb-6 px-4 md:px-0"
                >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <IndexItem
                            label="費城半導體"
                            data={stats?.sox}
                            loading={loading}
                            url="https://finance.yahoo.com/quote/%5ESOX"
                        />
                        <IndexItem
                            label="S&P 500 (Fut)"
                            data={stats?.sp500}
                            loading={loading}
                            url="https://finance.yahoo.com/quote/ES=F"
                        />
                        <IndexItem
                            label="Nasdaq (Fut)"
                            data={stats?.nasdaq}
                            loading={loading}
                            url="https://finance.yahoo.com/quote/NQ=F"
                        />
                        <IndexItem
                            label="道瓊工業 (Fut)"
                            data={stats?.dji}
                            loading={loading}
                            url="https://finance.yahoo.com/quote/YM=F"
                        />
                        <IndexItem
                            label="台股加權"
                            data={stats?.twii}
                            loading={loading}
                            url="https://finance.yahoo.com/quote/%5ETWII"
                        />
                        <IndexItem
                            label="櫃買指數 (OTC)"
                            data={stats?.otc}
                            loading={loading}
                            url="https://finance.yahoo.com/quote/%5ETWO"
                        />
                    </div>
                </motion.div>

                {/* Gauges Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="max-w-7xl mx-auto mb-8 p-6 rounded-2xl bg-blue-500/10 border border-blue-500/20"
                >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Gauge
                            label="恐懼貪婪指數"
                            value={stats?.stockFnG || 50}
                            loading={loading && !stats}
                            url="https://edition.cnn.com/markets/fear-and-greed"
                        />
                        <Gauge
                            label="VIX 波動率"
                            value={stats?.vix || 20}
                            max={60}
                            unit=""
                            loading={loading && !stats}
                            url="https://finance.yahoo.com/quote/%5EVIX"
                        />
                        <Gauge
                            label="加密貨幣貪婪"
                            value={stats?.cryptoFnG || 50}
                            loading={loading && !stats}
                            url="https://alternative.me/crypto/fear-and-greed-index/"
                        />
                        <Gauge
                            label="黃金情緒"
                            value={stats?.goldSentiment || 50}
                            loading={loading && !stats}
                            url="https://finance.yahoo.com/quote/GC=F"
                        />
                    </div>
                </motion.div>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto space-y-8 pb-12">
                    <section id="us">
                        <NewsSection title="美國財經焦點" items={data.us} color="cyan" />
                    </section>
                    <section id="intl">
                        <NewsSection title="國際財經視野" items={data.intl} color="blue" />
                    </section>
                    <section id="geo">
                        <NewsSection title="全球地緣政治與軍事" items={data.geo} color="purple" />
                    </section>
                    <section id="tw">
                        <NewsSection title="台灣財經要聞" items={data.tw} color="cyan" />
                    </section>
                    <section id="crypto">
                        <NewsSection title="加密貨幣快訊" items={data.crypto} color="emerald" />
                    </section>

                    {/* Total Summary Report */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="mt-12 mb-8 mx-4 md:mx-0"
                    >
                        <div className="glass-panel p-6 rounded-2xl border border-cyan-500/30 bg-gradient-to-b from-slate-900/90 to-slate-950/90 shadow-[0_0_30px_rgba(6,182,212,0.15)] relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -translate-y-32 translate-x-32 group-hover:bg-cyan-500/20 transition-all duration-1000" />
                            <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl translate-y-20 -translate-x-20" />

                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <TrendingUp className="text-cyan-400" size={24} />
                                        <h2 className="text-xl font-bold text-slate-100 tracking-wide">
                                            市場總結分析報告
                                        </h2>
                                    </div>
                                    {(() => {
                                        const score = stats?.stockFnG ?? 50;
                                        let sentiment = "中性觀望";
                                        let sentimentColor = "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";

                                        if (score >= 60) {
                                            sentiment = "樂觀偏多";
                                            sentimentColor = "bg-red-500/20 text-red-300 border-red-500/30";
                                        } else if (score <= 40) {
                                            sentiment = "悲觀保守";
                                            sentimentColor = "bg-green-500/20 text-green-300 border-green-500/30";
                                        }

                                        return (
                                            <div className={cn("px-4 py-1.5 rounded-full border text-sm font-bold tracking-wider shadow-[0_0_15px_rgba(0,0,0,0.3)] backdrop-blur-md", sentimentColor)}>
                                                {sentiment}
                                            </div>
                                        );
                                    })()}
                                </div>

                                <div className="prose prose-invert max-w-none">
                                    <p className="text-slate-300 leading-8 text-justify font-sans text-sm tracking-wide whitespace-pre-line">
                                        {(() => {
                                            if (generatingSummary) return (
                                                <span className="flex items-center gap-2 animate-pulse text-cyan-400">
                                                    <Cpu className="animate-spin" size={16} />
                                                    AI 正在即時分析全球市場數據，請稍候...
                                                </span>
                                            );

                                            if (!aiSummary) return "請點擊重新整理以生成最新分析報告。";

                                            return aiSummary;
                                        })()}
                                    </p>
                                </div>

                                <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-800/50 pt-4">
                                    <span className="text-xs text-slate-500 font-mono">AI Generated Analysis • Comprehensive Report</span>
                                    <Cpu size={14} className="text-cyan-500/50" />
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <div className="text-center text-slate-600 text-sm font-mono mt-10 pt-10 border-t border-slate-800">
                        Sources: CNN, CNBC, Anue, Yahoo Finance, WSJ, Google News • Priority &lt; 12h • Excludes {'>'} 24h
                    </div>
                </div>
            </main >
        </div >
    );
}

function IndexItem({ label, data, loading, url }: { label: string, data?: MarketQuote, loading: boolean, url?: string }) {
    if (loading || !data) return (
        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900/50 border border-slate-800 animate-pulse h-[80px]">
            <div className="h-3 w-16 bg-slate-800 rounded mb-2"></div>
            <div className="h-5 w-24 bg-slate-800/50 rounded"></div>
        </div>
    );

    const isUp = data.changePercent >= 0;
    const colorClass = isUp ? 'text-red-400' : 'text-green-400';
    // Cold light purple style as requested
    const bgClass = 'bg-purple-500/10 border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)]';

    const content = (
        <div className={cn("flex flex-col items-center justify-center p-3 rounded-xl border backdrop-blur-sm transition-all hover:bg-opacity-80 hover:scale-[1.02]", bgClass)}>
            <span className="text-[10px] font-bold text-purple-300/80 tracking-wider mb-1 uppercase">{label}</span>
            <div className="flex items-baseline gap-2">
                {/* Font size reduced by ~40% (text-lg -> text-sm/base) */}
                <span className="text-sm font-bold font-mono text-slate-100 drop-shadow-sm">
                    {data.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
                {/* Font size reduced (text-xs -> text-[10px]) */}
                <span className={cn("text-[10px] font-mono font-bold flex items-center", colorClass)}>
                    {isUp ? '▲' : '▼'} {Math.abs(data.changePercent).toFixed(2)}%
                </span>
            </div>
        </div>
    );

    if (url) {
        return (
            <a href={url} target="_blank" rel="noopener noreferrer" className="block h-full">
                {content}
            </a>
        );
    }
    return content;
}

function MacroItem({ label, value, changePercent, loading, url }: { label: string, value: string, changePercent?: number, loading: boolean, url?: string }) {
    if (loading) return (
        <div className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-700 bg-slate-900/50 animate-pulse h-[80px] w-full">
            <div className="h-3 w-20 bg-slate-800 rounded mb-2"></div>
            <div className="h-5 w-16 bg-slate-800/50 rounded"></div>
        </div>
    );

    const isUp = (changePercent || 0) >= 0;
    // Taiwan logic: Red = Up, Green = Down
    const trendColor = isUp ? 'text-red-400' : 'text-green-400';

    const content = (
        <div className="flex flex-col items-center justify-center p-3 rounded-lg border border-cyan-500/20 bg-slate-900/40 hover:bg-slate-800/60 hover:border-cyan-500/40 transition-all group w-full h-full">
            <span className="text-[10px] font-bold font-mono text-purple-400 uppercase tracking-tighter mb-1.5 text-center flex items-center gap-1 drop-shadow-[0_0_3px_rgba(168,85,247,0.5)]">
                {label}
            </span>
            <span className="text-xl font-bold font-mono tracking-tight text-slate-100 group-hover:text-white transition-colors">
                {value}
            </span>
            {changePercent !== undefined && (
                <span className={cn("text-[10px] font-bold font-mono mt-0.5", trendColor)}>
                    {isUp ? '▲' : '▼'} {Math.abs(changePercent).toFixed(2)}%
                </span>
            )}
        </div>
    );

    if (url) {
        return (
            <a href={url} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                {content}
            </a>
        );
    }
    return content;
}
