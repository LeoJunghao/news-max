import { cn } from "@/lib/utils";

interface GaugeProps {
    value: number;
    min?: number;
    max?: number;
    label: string;
    unit?: string;
    loading?: boolean;
    url?: string;
}

export function Gauge({ value, min = 0, max = 100, label, unit = "", loading = false, url }: GaugeProps) {
    const normalizedValue = Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100);
    const rotation = (normalizedValue / 100) * 180 - 90;

    let strokeColor = "#fcd34d"; // Default Amber-300
    let stateText = getLabelForValue(label, value, !!loading);
    let stateColorClass = "text-yellow-200/70";

    // Taiwan Stock Color Logic: Red = Up/Hot/Greed, Green = Down/Cold/Fear
    if (label.includes("Greed") || label.includes("Sentiment") || label.includes("情緒") || label.includes("貪婪")) {
        // 0-100 Scale: 0 = Extreme Fear (Green), 100 = Extreme Greed (Red)
        if (value < 25) { strokeColor = "#22c55e"; stateColorClass = "text-green-400"; } // Extreme Fear -> Green (Bottom/Cold)
        else if (value < 45) { strokeColor = "#34d399"; stateColorClass = "text-emerald-300"; } // Fear
        else if (value > 75) { strokeColor = "#ef4444"; stateColorClass = "text-red-500"; } // Extreme Greed -> Red (Hot)
        else if (value > 55) { strokeColor = "#f87171"; stateColorClass = "text-red-400"; } // Greed
        else { strokeColor = "#fb923c"; stateColorClass = "text-orange-300"; } // Neutral -> Orange
    } else if (label.includes("VIX") || label.includes("波動")) {
        // VIX: Low = Bullish (Red/Good), High = Bearish (Green/Bad)
        if (value < 15) { strokeColor = "#ef4444"; stateColorClass = "text-red-400"; } // Low VIX -> Red (Bullish)
        else if (value < 25) { strokeColor = "#fb923c"; stateColorClass = "text-orange-300"; } // Normal
        else { strokeColor = "#22c55e"; stateColorClass = "text-green-400"; } // High VIX -> Green (Bearish)
    } else if (label.includes("Gold") || label.includes("黃金")) {
        // Gold Sentiment: High = Bullish (Red)
        if (value > 60) { strokeColor = "#ef4444"; stateColorClass = "text-red-400"; }
        else if (value < 40) { strokeColor = "#22c55e"; stateColorClass = "text-green-400"; }
    }

    if (url) {
        return (
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block transition-transform hover:scale-105 active:scale-95"
            >
                <div className={cn(
                    "glass-panel p-3 rounded-lg flex flex-col items-center justify-center relative min-h-[120px]",
                    "border border-yellow-500/10 bg-slate-950/80",
                    "shadow-[inset_0_0_20px_rgba(253,224,71,0.02)]",
                    "cursor-pointer hover:border-yellow-500/30 hover:bg-slate-900/90 transition-all"
                )}>
                    {/* Corner Accents */}
                    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-yellow-500/30 rounded-tl-sm" />
                    <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-yellow-500/30 rounded-tr-sm" />
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-yellow-500/30 rounded-bl-sm" />
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-yellow-500/30 rounded-br-sm" />

                    <h3 className="text-[10px] font-bold font-mono text-purple-400 uppercase tracking-tighter mb-1 text-center h-3 flex items-center drop-shadow-[0_0_3px_rgba(168,85,247,0.5)]">
                        {label}
                    </h3>

                    {loading ? (
                        <div className="animate-pulse w-full h-16 flex items-center justify-center">
                            <div className="w-6 h-6 rounded-full border border-yellow-500/20 border-t-yellow-400 animate-spin" />
                        </div>
                    ) : (
                        <div className="relative w-28 h-14 overflow-hidden mt-1">
                            <svg viewBox="0 0 100 50" className="absolute top-0 left-0 w-full h-full opacity-30">
                                <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#fef08a" strokeWidth="1" strokeDasharray="1 3" />
                            </svg>

                            <svg viewBox="0 0 100 50" className="absolute top-0 left-0 w-full h-full">
                                <path d="M 15 50 A 35 35 0 0 1 85 50" fill="none" stroke="#1e293b" strokeWidth="4" strokeLinecap="butt" />
                                <path
                                    d="M 15 50 A 35 35 0 0 1 85 50"
                                    fill="none"
                                    stroke={strokeColor}
                                    strokeWidth="4"
                                    strokeDasharray="110"
                                    strokeDashoffset={110 - (110 * normalizedValue / 100)}
                                    strokeLinecap="butt"
                                    className="transition-all duration-1000 ease-out drop-shadow-[0_0_8px_rgba(234,179,8,0.3)]"
                                />
                            </svg>

                            <div
                                className="absolute bottom-0 left-1/2 w-[1px] h-full origin-bottom transition-transform duration-1000 ease-out z-10"
                                style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
                            >
                                <div className="w-full h-[90%] bg-yellow-100 shadow-[0_0_5px_rgba(253,224,71,0.8)]" />
                            </div>
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-2 bg-slate-900 border-t border-yellow-500/30 rounded-t-full z-20" />
                        </div>
                    )}

                    <div className="mt-1 flex flex-col items-center">
                        <div className="text-lg font-bold font-mono text-yellow-50 tracking-tighter drop-shadow-md leading-none">
                            {loading ? '--' : value.toFixed(2)}
                            <span className="text-[9px] ml-0.5 opacity-60 text-yellow-200/50 font-sans">{unit}</span>
                        </div>
                        <div className={cn("text-[9px] mt-0.5 font-mono uppercase tracking-wider", stateColorClass)}>
                            {loading ? "SYNC" : stateText}
                        </div>
                    </div>
                </div>
            </a>
        );
    }

    return (
        <div className={cn(
            "glass-panel p-3 rounded-lg flex flex-col items-center justify-center relative min-h-[120px]",
            "border border-yellow-500/10 bg-slate-950/80",
            "shadow-[inset_0_0_20px_rgba(253,224,71,0.02)]"
        )}>
            {/* Corner Accents */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-yellow-500/30 rounded-tl-sm" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-yellow-500/30 rounded-tr-sm" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-yellow-500/30 rounded-bl-sm" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-yellow-500/30 rounded-br-sm" />

            <h3 className="text-[10px] font-bold font-mono text-purple-400 uppercase tracking-tighter mb-1 text-center h-3 flex items-center drop-shadow-[0_0_3px_rgba(168,85,247,0.5)]">
                {label}
            </h3>

            {loading ? (
                <div className="animate-pulse w-full h-16 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full border border-yellow-500/20 border-t-yellow-400 animate-spin" />
                </div>
            ) : (
                <div className="relative w-28 h-14 overflow-hidden mt-1">
                    <svg viewBox="0 0 100 50" className="absolute top-0 left-0 w-full h-full opacity-30">
                        <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#fef08a" strokeWidth="1" strokeDasharray="1 3" />
                    </svg>

                    <svg viewBox="0 0 100 50" className="absolute top-0 left-0 w-full h-full">
                        <path d="M 15 50 A 35 35 0 0 1 85 50" fill="none" stroke="#1e293b" strokeWidth="4" strokeLinecap="butt" />
                        <path
                            d="M 15 50 A 35 35 0 0 1 85 50"
                            fill="none"
                            stroke={strokeColor}
                            strokeWidth="4"
                            strokeDasharray="110"
                            strokeDashoffset={110 - (110 * normalizedValue / 100)}
                            strokeLinecap="butt"
                            className="transition-all duration-1000 ease-out drop-shadow-[0_0_8px_rgba(234,179,8,0.3)]"
                        />
                    </svg>

                    <div
                        className="absolute bottom-0 left-1/2 w-[1px] h-full origin-bottom transition-transform duration-1000 ease-out z-10"
                        style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
                    >
                        <div className="w-full h-[90%] bg-yellow-100 shadow-[0_0_5px_rgba(253,224,71,0.8)]" />
                    </div>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-2 bg-slate-900 border-t border-yellow-500/30 rounded-t-full z-20" />
                </div>
            )}

            <div className="mt-1 flex flex-col items-center">
                <div className="text-lg font-bold font-mono text-yellow-50 tracking-tighter drop-shadow-md leading-none">
                    {loading ? '--' : value.toFixed(2)}
                    <span className="text-[9px] ml-0.5 opacity-60 text-yellow-200/50 font-sans">{unit}</span>
                </div>
                <div className={cn("text-[9px] mt-0.5 font-mono uppercase tracking-wider", stateColorClass)}>
                    {loading ? "SYNC" : stateText}
                </div>
            </div>
        </div>
    );
}

function getLabelForValue(label: string, val: number, loading: boolean): string {
    if (loading) return "LOADING";
    if (label.includes("VIX") || label.includes("波動")) {
        if (val < 15) return "CALM";
        if (val < 25) return "NORMAL";
        return "HIGH VOLATILITY"; // Green in TW style = Bearish
    }
    // Fear & Greed
    if (val < 25) return "EXTREME FEAR"; // Green
    if (val < 45) return "FEAR"; // Green
    if (val < 55) return "NEUTRAL";
    if (val < 75) return "GREED"; // Red
    return "EXTREME GREED"; // Red
}
