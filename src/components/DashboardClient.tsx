'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Zap, Copy, TrendingUp, Cpu } from 'lucide-react';
import { NewsSection } from '@/components/NewsSection';
import { Gauge } from '@/components/Gauge';
import type { NewsItem } from '@/lib/news';
import type { MarketStats, MarketQuote, InstitutionalStats } from '@/lib/stats';

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
                        <h1 className="text-xl font-medium text-yellow-400 font-mono tracking-tighter drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]">
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
                {/* Futures Section */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="max-w-7xl mx-auto mb-6 px-4 md:px-0"
                >
                    <div className="flex flex-col gap-2 p-4 border-y border-cyan-500/20 backdrop-blur-sm bg-cyan-950/10">
                        <div className="flex items-center gap-2 text-cyan-400 font-medium font-mono text-sm tracking-wider uppercase mb-2 px-2">
                            <Zap size={16} />
                            期貨指數
                        </div>
                        <div className="space-y-2">
                            <IndexListItem
                                label="標普500期貨"
                                data={stats?.sp500}
                                loading={loading}
                                url="https://finance.yahoo.com/quote/ES=F"
                            />
                            <IndexListItem
                                label="那斯達克100期"
                                data={stats?.nasdaq}
                                loading={loading}
                                url="https://finance.yahoo.com/quote/NQ=F"
                            />
                            <IndexListItem
                                label="道瓊期指"
                                data={stats?.dji}
                                loading={loading}
                                url="https://finance.yahoo.com/quote/YM=F"
                            />
                            <RealtimeIndexListItem
                                label="台指期近一"
                                initialData={stats?.tx}
                                url="https://tw.stock.yahoo.com/future/WTX&"
                                apiPath="/api/quote/tx"
                                refreshInterval={30000}
                            />
                        </div>
                    </div>
                </motion.div>

                {/* Major Indices Section */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="max-w-7xl mx-auto mb-6 px-4 md:px-0"
                >
                    <div className="flex flex-col gap-2 p-4 border-y border-purple-500/20 backdrop-blur-sm overflow-hidden">
                        <div className="flex items-center gap-2 text-cyan-400 font-medium font-mono text-sm tracking-wider uppercase mb-4 px-2">
                            <TrendingUp size={16} />
                            主要股市指數
                        </div>

                        <div className="space-y-2">
                            {[
                                { label: "費半指數", data: stats?.sox, url: "https://finance.yahoo.com/quote/%5ESOX" },
                                { label: "S&P 500", data: stats?.sp500Index, url: "https://finance.yahoo.com/quote/%5EGSPC" },
                                { label: "納斯達克", data: stats?.nasdaqComposite, url: "https://finance.yahoo.com/quote/%5EIXIC" },
                                { label: "道瓊工業", data: stats?.dji, url: "https://finance.yahoo.com/quote/YM=F" },
                                { label: "日經指數", data: stats?.nikkei225, url: "https://finance.yahoo.com/quote/%5EN225" },
                                { label: "韓國綜合", data: stats?.kospi, url: "https://finance.yahoo.com/quote/%5EKS11" },
                                { label: "台股加權", data: stats?.twii, url: "https://finance.yahoo.com/quote/%5ETWII" },
                            ].map((item, idx) => (
                                <IndexListItem
                                    key={idx}
                                    label={item.label}
                                    data={item.data}
                                    loading={loading}
                                    url={item.url}
                                />
                            ))}

                            {/* Institutional Fund Flows (Visible only when data exists) */}
                            {stats?.institutional && stats.institutional.date && (
                                <InstitutionalRow data={stats.institutional} />
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Macro Pulse Section */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-7xl mx-auto mb-6 px-4 md:px-0"
                >
                    <div className="flex items-center gap-3 mb-3 px-2">
                        <div className="w-1 h-5 bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)] rounded-full" />
                        <h2 className="text-lg font-medium text-slate-100 tracking-wide">
                            【財經數據】
                        </h2>
                    </div>
                    <div className="flex flex-col gap-2 p-4 bg-emerald-500/5 border-y border-emerald-500/20 backdrop-blur-sm">
                        <div className="space-y-2">
                            <MacroItem
                                label="美2年債"
                                value={stats?.us2Y?.price ? `${stats.us2Y.price.toFixed(3)}%` : '---'}
                                changePercent={stats?.us2Y?.changePercent}
                                loading={loading}
                                url="https://www.cnbc.com/quotes/US2Y"
                            />
                            <MacroItem
                                label="美10年債"
                                value={stats?.us10Y?.price ? `${stats.us10Y.price.toFixed(3)}%` : '---'}
                                changePercent={stats?.us10Y?.changePercent}
                                loading={loading}
                                url="https://www.cnbc.com/quotes/US10Y"
                            />
                            <MacroItem
                                label="美元兌台幣"
                                value={stats?.usdtwd?.price.toFixed(3) || '---'}
                                changePercent={stats?.usdtwd?.changePercent}
                                loading={loading}
                                url="https://finance.yahoo.com/quote/TWD=X"
                            />
                            <MacroItem
                                label="美元兌日圓"
                                value={stats?.usdjpy?.price.toFixed(3) || '---'}
                                changePercent={stats?.usdjpy?.changePercent}
                                loading={loading}
                                url="https://finance.yahoo.com/quote/JPY=X"
                            />
                            <MacroItem
                                label="美元指數"
                                value={stats?.dollarIndex?.price.toFixed(3) || '---'}
                                changePercent={stats?.dollarIndex?.changePercent}
                                loading={loading}
                                url="https://www.cnbc.com/quotes/.DXY"
                            />
                            <MacroItem
                                label="布蘭特原油"
                                value={`$${stats?.brentCrude?.price.toFixed(2)}`}
                                changePercent={stats?.brentCrude?.changePercent}
                                loading={loading}
                                url="https://finance.yahoo.com/quote/BZ=F"
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
                                label="黃金期貨"
                                value={`$${stats?.goldPrice?.price.toFixed(1) || '---'}`}
                                changePercent={stats?.goldPrice?.changePercent}
                                loading={loading}
                                url="https://finance.yahoo.com/quote/GC=F"
                            />
                            <MacroItem
                                label="現貨黃金"
                                value={`$${stats?.spotGoldPrice?.price.toFixed(1) || '---'}`}
                                changePercent={stats?.spotGoldPrice?.changePercent}
                                loading={loading}
                                url="https://www.cnbc.com/quotes/XAU="
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
                    </div>
                </motion.div>

                {/* AI Leaders Section (New) */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="max-w-7xl mx-auto mb-6 px-4 md:px-0"
                >
                    <div className="flex flex-col gap-2 p-4 bg-purple-500/5 border-y border-purple-500/20 backdrop-blur-sm">
                        <div className="flex items-center gap-2 text-cyan-400 font-medium font-mono text-sm tracking-wider uppercase mb-2 px-2">
                            <Cpu size={16} />
                            AI &amp; Tech Giants
                        </div>
                        <div className="space-y-2">
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
                    </div>
                </motion.div>

                {/* Taiwan Tech F4 Section (New) */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="max-w-7xl mx-auto mb-6 px-4 md:px-0"
                >
                    <div className="flex flex-col gap-2 p-4 bg-purple-500/5 border-y border-purple-500/20 backdrop-blur-sm">
                        <div className="flex items-center gap-2 text-cyan-400 font-medium font-mono text-sm tracking-wider uppercase mb-2 px-2">
                            <Cpu size={16} />
                            台灣權值
                        </div>
                        <div className="space-y-2">
                            <MacroItem
                                label="台積電 (2330)"
                                value={stats?.tsmTw?.price ? `$${stats.tsmTw.price.toFixed(0)}` : '---'}
                                changePercent={stats?.tsmTw?.changePercent}
                                loading={loading}
                                url="https://finance.yahoo.com/quote/2330.TW"
                            />
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
                            <MacroItem
                                label="富邦金 (2881)"
                                value={stats?.fubon?.price ? `$${stats.fubon.price.toFixed(1)}` : '---'}
                                changePercent={stats?.fubon?.changePercent}
                                loading={loading}
                                url="https://finance.yahoo.com/quote/2881.TW"
                            />
                        </div>
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

                {/* Total Summary Report */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="max-w-7xl mx-auto mb-8 px-4 md:px-0"
                >
                    <div className="glass-panel p-6 rounded-2xl border border-cyan-500/30 bg-gradient-to-b from-slate-900/90 to-slate-950/90 shadow-[0_0_30px_rgba(6,182,212,0.15)] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -translate-y-32 translate-x-32 group-hover:bg-cyan-500/20 transition-all duration-1000" />
                        <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl translate-y-20 -translate-x-20" />

                        <div className="relative z-10">
                            <div className="flex flex-col items-start gap-4 mb-6">
                                <div className="flex items-center gap-3 text-cyan-400">
                                    <TrendingUp size={24} />
                                    <h2 className="text-xl font-medium text-slate-100 tracking-wide whitespace-nowrap">
                                        分析報告
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
                                        <div className={cn("px-4 py-1.5 rounded-full border text-sm font-medium tracking-wider shadow-[0_0_15px_rgba(0,0,0,0.3)] backdrop-blur-md", sentimentColor)}>
                                            {sentiment}
                                        </div>
                                    );
                                })()}
                            </div>

                            <div className="prose prose-invert max-w-none">
                                {(() => {
                                    if (generatingSummary) return (
                                        <div className="flex items-center justify-center p-8">
                                            <span className="flex items-center gap-3 animate-pulse text-cyan-400 text-lg">
                                                <Cpu className="animate-spin" size={24} />
                                                AI 正在即時分析全球市場數據，請稍候...
                                            </span>
                                        </div>
                                    );

                                    if (!aiSummary) return (
                                        <p className="text-slate-400 text-center italic">
                                            請點擊 <span className="text-cyan-400 not-italic">REFRESH</span> 按鈕以生成最新分析報告。
                                        </p>
                                    );

                                    // Helper function to parse bold text and numbers
                                    const parseContent = (text: string) => {
                                        // First split by bold syntax (**text**)
                                        const segments = text.split(/(\*\*.*?\*\*)/g);

                                        return segments.map((segment, i) => {
                                            // Handle Bold
                                            if (segment.startsWith('**') && segment.endsWith('**')) {
                                                const content = segment.slice(2, -2);
                                                return (
                                                    <span key={i} className="text-cyan-200 font-bold mx-0.5">
                                                        {content}
                                                    </span>
                                                );
                                            }

                                            // Handle Numbers in regular text
                                            const parts = segment.split(/([$–-]?\d{1,3}(?:,\d{3})*(?:\.\d+)?%?)/g);
                                            return (
                                                <span key={i}>
                                                    {parts.map((part, j) => {
                                                        if (/^[$–-]?\d{1,3}(?:,\d{3})*(?:\.\d+)?%?$/.test(part)) {
                                                            return <span key={j} className="text-amber-400 font-mono font-medium mx-0.5">{part}</span>;
                                                        }
                                                        return part;
                                                    })}
                                                </span>
                                            );
                                        });
                                    };

                                    return (
                                        <div className="space-y-4 text-base leading-relaxed tracking-wide text-slate-200">
                                            {aiSummary.split('\n').map((line, i) => {
                                                const trimmedLine = line.trim();
                                                if (!trimmedLine) return <br key={i} />;

                                                // 1. Handle Headers (Markdown # or ## or lines ending in :)
                                                const headerMatch = trimmedLine.match(/^(#{1,6})\s+(.*)/);
                                                const isHeuristicHeader = trimmedLine.length < 30 && (trimmedLine.endsWith(':') || trimmedLine.endsWith('：'));

                                                if (headerMatch || isHeuristicHeader) {
                                                    const content = headerMatch ? headerMatch[2] : trimmedLine;
                                                    // Clean stars from headers if they exist
                                                    const cleanContent = content.replace(/\*\*/g, '');
                                                    return (
                                                        <h3 key={i} className="text-cyan-300 font-medium text-lg mt-3 mb-1 border-l-3 border-cyan-500 pl-2">
                                                            {cleanContent}
                                                        </h3>
                                                    );
                                                }

                                                // 2. Handle List Items (* or -)
                                                // Improved regex to handle nested lists or different bullet styles
                                                const listMatch = trimmedLine.match(/^[\-\*•]\s+(.*)/);
                                                if (listMatch) {
                                                    return (
                                                        <div key={i} className="flex gap-2 pl-1 mb-1 group/list-item">
                                                            <span className="text-cyan-500 mt-1 shrink-0 text-base leading-none opacity-80 group-hover/list-item:opacity-100 transition-opacity">•</span>
                                                            <p className="text-justify leading-snug text-slate-300 text-sm md:text-base">
                                                                {parseContent(listMatch[1])}
                                                            </p>
                                                        </div>
                                                    );
                                                }

                                                // 3. Standard Paragraph
                                                return (
                                                    <p key={i} className="text-justify mb-1 leading-snug text-slate-300 text-sm md:text-base">
                                                        {parseContent(trimmedLine)}
                                                    </p>
                                                );
                                            })}
                                        </div>
                                    );
                                })()}
                            </div>

                            <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-800/50 pt-4">
                                <span className="text-xs text-slate-500 font-mono">AI Generated Analysis • Comprehensive Report</span>
                                <Cpu size={14} className="text-cyan-500/50" />
                            </div>
                        </div>
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



                    <div className="text-center text-slate-600 text-sm font-mono mt-10 pt-10 border-t border-slate-800">
                        Sources: CNN, CNBC, Anue, Yahoo Finance, WSJ, Google News • Priority &lt; 12h • Excludes {'>'} 24h
                    </div>
                </div>
            </main >
        </div >
    );
}



function IndexListItem({ label, data, loading, url }: { label: string, data?: MarketQuote, loading: boolean, url?: string }) {
    if (loading || !data) return (
        <div className="flex flex-col justify-center p-3 rounded-lg bg-slate-900/50 border border-slate-800 animate-pulse h-[70px]">
            <div className="h-3 w-24 bg-slate-800 rounded mb-2"></div>
            <div className="flex justify-between w-full">
                <div className="h-4 w-16 bg-slate-800/50 rounded"></div>
                <div className="h-4 w-12 bg-slate-800/50 rounded"></div>
            </div>
        </div>
    );

    const isUp = data.changePercent >= 0;
    const colorClass = isUp ? 'text-red-400' : 'text-green-400';
    const bgClass = 'bg-slate-950 border-purple-500/20 hover:bg-slate-900/80 transition-colors';

    const content = (
        <div className={cn("flex flex-col p-3 rounded-lg border backdrop-blur-sm", bgClass)}>
            {/* Row 1: Label */}
            <div className="mb-1">
                <span className="text-base font-medium font-mono text-purple-300/95 tracking-wider uppercase">{label}</span>
            </div>
            {/* Row 2: Values */}
            <div className="flex items-end justify-between">
                <span className="text-xl font-normal font-mono text-slate-100 leading-none">
                    {data.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
                <span className={cn("text-base font-mono font-normal flex items-center leading-none", colorClass)}>
                    {isUp ? '▲' : '▼'}{data.change !== undefined ? ` ${Math.abs(data.change).toFixed(2)}` : ''} ({Math.abs(data.changePercent).toFixed(2)}%)
                </span>
            </div>
        </div>
    );

    if (url) {
        return (
            <a href={url} target="_blank" rel="noopener noreferrer" className="block w-full">
                {content}
            </a>
        );
    }
    return content;
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
    const bgClass = 'bg-slate-950 border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)]';

    const content = (
        <div className={cn("flex flex-col items-center justify-center p-3 rounded-xl border backdrop-blur-sm transition-all hover:bg-opacity-80 hover:scale-[1.02]", bgClass)}>
            <span className="text-base font-medium font-mono text-purple-300/95 tracking-wider mb-1 uppercase">{label}</span>
            <div className="flex items-baseline gap-2">
                {/* Font size reduced by ~40% (text-lg -> text-sm/base) */}
                <span className="text-sm font-normal font-mono text-slate-100 drop-shadow-sm">
                    {data.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
                {/* Font size reduced (text-xs -> text-[10px]) */}
                <span className={cn("text-sm font-mono font-normal flex items-center", colorClass)}>
                    {isUp ? '▲' : '▼'} {data.change !== undefined ? `${Math.abs(data.change).toFixed(2)} ` : ''}{Math.abs(data.changePercent).toFixed(2)}%
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
        <div className="flex flex-col justify-center p-3 rounded-lg bg-slate-900/50 border border-slate-700 animate-pulse h-[70px]">
            <div className="h-3 w-24 bg-slate-800 rounded mb-2"></div>
            <div className="flex justify-between w-full">
                <div className="h-4 w-16 bg-slate-800/50 rounded"></div>
                <div className="h-4 w-12 bg-slate-800/50 rounded"></div>
            </div>
        </div>
    );

    const isUp = (changePercent || 0) >= 0;
    const trendColor = isUp ? 'text-red-400' : 'text-green-400';

    const content = (
        <div className="flex flex-col p-3 rounded-lg border border-purple-500/20 bg-slate-900/40 hover:bg-slate-800/60 hover:border-purple-500/40 transition-all group">
            {/* Row 1: Label */}
            <div className="mb-1">
                <span className="text-base font-medium font-mono text-purple-300/95 uppercase tracking-wider flex items-center gap-1 drop-shadow-[0_0_3px_rgba(168,85,247,0.5)]">
                    {label}
                </span>
            </div>
            {/* Row 2: Values */}
            <div className="flex items-end justify-between">
                <span className="text-xl font-normal font-mono tracking-tight text-slate-100 group-hover:text-white transition-colors leading-none">
                    {value}
                </span>
                {changePercent !== undefined && (
                    <span className={cn("text-base font-normal font-mono flex items-center leading-none", trendColor)}>
                        {isUp ? '▲' : '▼'} {Math.abs(changePercent).toFixed(2)}%
                    </span>
                )}
            </div>
        </div>
    );

    if (url) {
        return (
            <a href={url} target="_blank" rel="noopener noreferrer" className="block w-full">
                {content}
            </a>
        );
    }
    return content;
}

function RealtimeIndexListItem({
    label,
    initialData,
    url,
    apiPath,
    refreshInterval = 30000
}: {
    label: string,
    initialData?: MarketQuote,
    url?: string,
    apiPath: string,
    refreshInterval?: number
}) {
    const [data, setData] = useState<MarketQuote | undefined>(initialData);

    useEffect(() => {
        const fetchQuote = async () => {
            try {
                const res = await fetch(apiPath + (apiPath.includes('?') ? '&' : '?') + 't=' + Date.now());
                if (res.ok) {
                    const json = await res.json();
                    if (json && json.price) {
                        setData(json);
                    }
                }
            } catch (e) {
                console.error(`Failed to poll ${label}`, e);
            }
        };

        const interval = setInterval(fetchQuote, refreshInterval);
        return () => clearInterval(interval);
    }, [apiPath, label, refreshInterval]);

    return <IndexListItem label={label} data={data} loading={!data} url={url} />;
}

function InstitutionalRow({ data }: { data: InstitutionalStats }) {
    const Item = ({ label, value }: { label: string, value: number }) => (
        <div className="flex items-center justify-between w-full">
            <span className="text-gray-400 text-[20px]">{label}</span>
            <span className={`font-mono font-bold text-[18px] ${value > 0 ? 'text-red-400' : value < 0 ? 'text-green-400' : 'text-gray-400'}`}>
                {value > 0 ? '+' : ''}{value}億
            </span>
        </div>
    );

    return (
        <div className="flex flex-col gap-3 px-4 py-3 bg-white/5 border-t border-dashed border-gray-700/50">
            <div className="flex flex-col gap-2 w-full">
                <Item label="外資" value={data.foreign} />
                <Item label="投信" value={data.trust} />
                <Item label="自營" value={data.dealer} />
            </div>
            <div className="text-xs text-gray-500 font-mono text-right mt-1">
                {data.date} (TWSE)
            </div>
        </div>
    );
}
