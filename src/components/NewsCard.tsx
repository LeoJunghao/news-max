import { ExternalLink, Sparkles } from 'lucide-react';
import type { NewsItem } from '@/lib/news';

export function NewsCard({ item }: { item: NewsItem }) {
    // Construct Gemini query URL
    const geminiUrl = "https://gemini.google.com/app";

    return (
        <div className="glass-panel p-3 rounded-lg transition-all hover:scale-[1.01] hover:shadow-cyan-500/10 group flex flex-col h-full bg-slate-900/40 border border-white/5">
            <div className="flex justify-between items-start gap-3 mb-2">
                <h3 className="font-medium text-[15px] text-slate-100 leading-snug group-hover:text-cyan-400 transition-colors line-clamp-2">
                    {item.title}
                </h3>
            </div>

            <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-700/30">
                <span className="text-[11px] text-slate-500 font-medium bg-slate-800/30 px-1.5 py-0.5 rounded border border-white/5 truncate max-w-[120px]">
                    {item.source}
                </span>

                <div className="flex gap-1.5 align-middle items-center">
                    {/* Time display moved here for compactness if possible? Or just keep simple source */}
                    <span className="text-[10px] text-slate-600 mr-1 font-mono">{item.time}</span>

                    <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors px-1.5 py-0.5 rounded hover:bg-slate-700/50"
                        title="閱讀原文"
                    >
                        <ExternalLink size={12} />
                        <span className="hidden sm:inline">原文</span>
                    </a>

                    <a
                        href={geminiUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-6 h-6 text-cyan-400 hover:text-cyan-200 transition-all rounded-full bg-cyan-950/30 hover:bg-cyan-500/20 border border-cyan-500/20 hover:border-cyan-400/50 hover:shadow-[0_0_8px_rgba(34,211,238,0.2)]"
                        title="使用 Gemini 分析這則新聞"
                        onClick={(e) => {
                            navigator.clipboard.writeText(`請分析這則新聞：${item.title}`);
                            alert("已複製新聞標題，請在 Gemini 視窗中貼上查詢！");
                        }}
                    >
                        <Sparkles size={12} />
                    </a>
                </div>
            </div>
        </div>
    );
}
