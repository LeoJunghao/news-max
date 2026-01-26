import { parseStringPromise } from 'xml2js';
import { subHours, isAfter } from 'date-fns';

export interface NewsItem {
    id: string;
    title: string;
    summary: string;
    source: string;
    link: string;
    time: string;
    category: string;
    pubDate: number; // Added for sorting
}

interface FeedConfig {
    name: string;      // Display name as Source (e.g. "CNBC")
    url: string;       // RSS URL
    isGoogle?: boolean; // If true, requires special Google News parsing/cleaning
}

interface CategoryConfig {
    name: string;
    keywords: string; // Used for Google News Fallback/Mix
    limit: number;
    feeds: FeedConfig[];
}

const CATEGORIES: Record<string, CategoryConfig> = {
    us: {
        name: '美國財經焦點',
        keywords: '美國財經 OR 美股 OR 道瓊 OR 納斯達克 OR 標普500 OR 聯準會 OR Fed OR 美債 OR 美元匯率',
        limit: 10,
        feeds: [
            { name: 'Google News', url: '', isGoogle: true },
            { name: 'Yahoo奇摩股市', url: 'https://tw.stock.yahoo.com/rss?category=intl-markets' } // Pure Chinese Source
        ]
    },
    intl: {
        name: '國際財經視野',
        keywords: '中國經濟 OR 歐洲市場 OR 歐盟 OR 德國股市 OR 法國股市 OR 日經 OR 日本央行 OR 韓國股市 OR 印度經濟 OR 越南與東南亞財經 -美國 -美股 -聯準會',
        limit: 10,
        feeds: [
            { name: 'Google News', url: '', isGoogle: true },
            { name: 'Yahoo奇摩股市', url: 'https://tw.stock.yahoo.com/rss?category=intl-markets' }
        ]
    },
    geo: {
        name: '全球地緣政治與軍事',
        keywords: '地緣政治 OR 烏克蘭戰爭 OR 以巴衝突 OR 南海爭議 OR 軍事動態',
        limit: 5,
        feeds: [
            { name: 'Google News', url: '', isGoogle: true },
        ]
    },
    tw: {
        name: '台灣財經要聞',
        keywords: '台股 OR 半導體 OR AI供應鏈 OR 台灣經濟政策',
        limit: 10,
        feeds: [
            { name: 'Google News', url: '', isGoogle: true },
            { name: '中央社', url: 'https://feeds.feedburner.com/rsscna/finance' },
            { name: '經濟日報', url: 'https://money.udn.com/rssfeed/news/1001/5597/5722?ch=money' }
        ]
    },
    crypto: {
        name: '加密貨幣快訊',
        keywords: '比特幣 OR 以太坊 OR 區塊鏈 OR Web3 OR 加密貨幣 source:動區 OR source:區塊客 OR source:金色財經',
        limit: 5,
        feeds: [
            { name: 'Google News', url: '', isGoogle: true },
            { name: '動區動趨', url: 'https://www.blocktempo.com/feed/' },
            { name: '區塊客', url: 'https://blockcast.it/feed/' }
        ]
    }
};

async function fetchRSS(feed: FeedConfig, categoryName: string, query?: string, forceRefresh: boolean = false): Promise<NewsItem[]> {
    let url = feed.url;

    // Construct Google News URL if needed
    if (feed.isGoogle && query) {
        const encodedQuery = encodeURIComponent(query);
        url = `https://news.google.com/rss/search?q=${encodedQuery}&hl=zh-TW&gl=TW&ceid=TW:zh-Hant`;
    }

    if (!url) return [];

    try {
        const fetchOptions: RequestInit = forceRefresh
            ? { cache: 'no-store' }
            : { next: { revalidate: 300 } }; // Default 5 mins cache

        const res = await fetch(url, fetchOptions);
        const text = await res.text();
        const result = await parseStringPromise(text);

        if (!result.rss?.channel?.[0]?.item) return [];

        const items = result.rss.channel[0].item;
        const now = new Date();
        const cutoff = subHours(now, 24);

        const newsItems: NewsItem[] = [];

        for (const item of items) {
            const pubDateStr = item.pubDate?.[0];
            if (!pubDateStr) continue;

            const pubDate = new Date(pubDateStr);
            if (!isAfter(pubDate, cutoff)) continue;

            let title = item.title?.[0] || 'No Title';
            let link = item.link?.[0] || '';
            let summary = item.description?.[0] || '';
            let source = feed.name;

            // --- Source Specific Parsing ---

            if (feed.isGoogle) {
                // Google News often has "Title - Source"
                const sourceMatch = title.match(/(.*) - (.*)$/);
                if (sourceMatch) {
                    title = sourceMatch[1];
                    source = item.source?.[0]?._ || sourceMatch[2]; // Use Google's embedded source if available
                }
            }

            // Cleanup Summary
            summary = summary.replace(/<[^>]+>/g, '');
            summary = summary.replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
            if (summary.length > 200) summary = summary.substring(0, 197) + '...';

            newsItems.push({
                id: item.guid?.[0]?._ || link,
                title,
                summary,
                source,
                link,
                time: pubDate.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
                category: categoryName,
                pubDate: pubDate.getTime()
            });
        }

        return newsItems;
    } catch (error) {
        console.error(`Error fetching RSS from ${feed.name}:`, error);
        return [];
    }
}

// Helper: Calculate Jaccard Similarity between two strings
function calculateSimilarity(str1: string, str2: string): number {
    const normalize = (s: string) => s.toLowerCase().replace(/[^\w\u4e00-\u9fa5\s]/g, '');
    const s1 = normalize(str1);
    const s2 = normalize(str2);

    if (s1 === s2) return 1.0;
    if (s1.includes(s2) || s2.includes(s1)) return 1.0;

    const hasChinese = /[\u4e00-\u9fa5]/.test(s1 + s2);
    let tokens1: Set<string>;
    let tokens2: Set<string>;

    if (hasChinese) {
        tokens1 = new Set(s1.split(''));
        tokens2 = new Set(s2.split(''));
    } else {
        tokens1 = new Set(s1.split(/\s+/).filter(w => w.length > 2));
        tokens2 = new Set(s2.split(/\s+/).filter(w => w.length > 2));
    }

    if (tokens1.size === 0 || tokens2.size === 0) return 0.0;

    let intersection = 0;
    for (const t of tokens1) {
        if (tokens2.has(t)) intersection++;
    }

    const union = tokens1.size + tokens2.size - intersection;
    return intersection / union;
}

async function fetchCategoryNews(key: string, config: CategoryConfig, forceRefresh: boolean = false): Promise<NewsItem[]> {
    try {
        const feedPromises = config.feeds.map(feed => fetchRSS(feed, config.name, config.keywords, forceRefresh));
        const results = await Promise.all(feedPromises);

        let allItems = results.flat();
        allItems.sort((a, b) => b.pubDate - a.pubDate);

        // Local Deduplication (Keep it)
        const uniqueItems: NewsItem[] = [];
        for (const item of allItems) {
            let isDuplicate = false;
            for (const existing of uniqueItems) {
                if (item.link === existing.link) { isDuplicate = true; break; }
                if (calculateSimilarity(item.title, existing.title) > 0.4) { isDuplicate = true; break; }
            }
            if (!isDuplicate) uniqueItems.push(item);
        }

        return uniqueItems.slice(0, config.limit);
    } catch (error) {
        console.error(`Error processing category ${key}:`, error);
        return [];
    }
}

// Helper to filter a list against a global set of seen items
function filterDuplicates(items: NewsItem[], globalSeen: NewsItem[]): NewsItem[] {
    const unique: NewsItem[] = [];

    for (const item of items) {
        let isDuplicate = false;

        for (const seen of globalSeen) {
            // Check Link
            if (item.link === seen.link) {
                isDuplicate = true;
                break;
            }
            // Check Title Similarity (Stricter threshold for cross-category)
            if (calculateSimilarity(item.title, seen.title) > 0.5) {
                isDuplicate = true;
                break;
            }
        }

        if (!isDuplicate) {
            unique.push(item);
            globalSeen.push(item);
        }
    }

    return unique;
}

export async function getDashboardNews(forceRefresh: boolean = false) {
    const [usRaw, intlRaw, geoRaw, twRaw, cryptoRaw] = await Promise.all([
        fetchCategoryNews('us', CATEGORIES.us, forceRefresh),
        fetchCategoryNews('intl', CATEGORIES.intl, forceRefresh),
        fetchCategoryNews('geo', CATEGORIES.geo, forceRefresh),
        fetchCategoryNews('tw', CATEGORIES.tw, forceRefresh),
        fetchCategoryNews('crypto', CATEGORIES.crypto, forceRefresh)
    ]);

    // Priority Order: US -> Intl -> Geo -> Crypto -> TW
    const globalSeen: NewsItem[] = []; // Stores all accepted items

    const us = filterDuplicates(usRaw, globalSeen);
    const intl = filterDuplicates(intlRaw, globalSeen);
    const geo = filterDuplicates(geoRaw, globalSeen);
    const crypto = filterDuplicates(cryptoRaw, globalSeen);
    const tw = filterDuplicates(twRaw, globalSeen);

    return { us, intl, geo, tw, crypto };
}
