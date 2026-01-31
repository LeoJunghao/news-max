'use client';

import { NewsCard } from './NewsCard';
import type { NewsItem } from '@/lib/news';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SectionProps {
    title: string;
    items: NewsItem[];
    color: string;
}

const colorMap: Record<string, { border: string; text: string; dot: string }> = {
    cyan: { border: 'border-cyan-500/30', text: 'text-cyan-400', dot: 'bg-cyan-500 shadow-[0_0_8px_#06b6d4]' },
    blue: { border: 'border-blue-500/30', text: 'text-blue-400', dot: 'bg-blue-500 shadow-[0_0_8px_#3b82f6]' },
    purple: { border: 'border-purple-500/30', text: 'text-purple-400', dot: 'bg-purple-500 shadow-[0_0_8px_#a855f7]' },
    emerald: { border: 'border-emerald-500/30', text: 'text-emerald-400', dot: 'bg-emerald-500 shadow-[0_0_8px_#10b981]' },
    default: { border: 'border-slate-500/30', text: 'text-slate-400', dot: 'bg-slate-500' }
};

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemAnim = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

export function NewsSection({ title, items, color }: SectionProps) {
    const styles = colorMap[color] || colorMap.default;

    return (
        <div className="mb-6">
            <div className={cn("flex items-center gap-2 mb-4 pb-2 border-b", styles.border)}>
                <div className={cn("w-1 h-5 rounded-full", styles.dot)} />
                <h2 className={cn("text-lg font-medium tracking-wider uppercase", styles.text)}>
                    {title} <span className="text-slate-600 text-xs ml-2 font-mono">({items.length})</span>
                </h2>
            </div>

            <motion.div
                variants={container}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-50px" }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3"
            >
                {items.map((item) => (
                    <motion.div key={item.id} variants={itemAnim}>
                        <NewsCard item={item} />
                    </motion.div>
                ))}
            </motion.div>

            {items.length === 0 && (
                <div className="py-8 text-center text-slate-600 font-mono text-xs border border-dashed border-slate-800 rounded-lg">
                    No recent news found in this category (24h).
                </div>
            )}
        </div>
    );
}
