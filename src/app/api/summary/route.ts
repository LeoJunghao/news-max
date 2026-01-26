import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NewsItem } from '@/lib/news';
import { MarketStats } from '@/lib/stats';

export async function POST(request: Request) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: 'GEMINI_API_KEY is not defined in environment variables' },
                { status: 500 }
            );
        }

        const body = await request.json();
        const { news, stats } = body as { news: { us: NewsItem[], intl: NewsItem[], geo: NewsItem[], tw: NewsItem[], crypto: NewsItem[] }, stats: MarketStats };

        // Calculate derivatives
        const spread = (stats.us10Y.price - stats.us2Y.price).toFixed(2);
        const tsmPremium = stats.tsmAdr.price && stats.tsmTw.price && stats.usdtwd.price
            ? (((stats.tsmAdr.price * stats.usdtwd.price / 5) - stats.tsmTw.price) / stats.tsmTw.price * 100).toFixed(2) + '%'
            : 'N/A';

        const now = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', hour12: false });

        // Construct the prompt
        let prompt = `請擔任一位專業的全球總體經濟分析師，根據以下提供的即時財經新聞與市場數據，撰寫一份「市場總結分析報告」。

**嚴格規則 (Strict Rules):**
1.  **目前時間**：${now}。所有分析必須基於此時間點的市場狀態。
2.  **拒絕幻覺**：絕對禁止編造未出現在「提供的市場數據」或「即時新聞重點」中的具體事件或數字。若資料不足請直接說明，不要瞎掰。
3.  **數據一致**：報告中引用的指數價格與漲跌幅，必須完全與下方提供的數據一致。

**風格與內容要求：**
1.  **冷靜、客觀、專業**：使用財經專業用語，語氣簡潔有力。
2.  **數據驅動**：引用提供的利差、溢價率等數據來佐證論點。
3.  **情境推演**：在結尾處，根據數據提供「多方」與「空方」的短線劇本。
4.  **繁體中文** (Traditional Chinese)。

**關鍵市場數據 (Market Data):**
- **宏觀指標**:
  - 美債殖利率曲線 (10Y-2Y Spread): ${spread}% (10Y: ${stats.us10Y?.price}%, 2Y: ${stats.us2Y.price}%)
  - 美元指數: ${stats.dollarIndex?.price.toFixed(2)}
  - 美元兌台幣 (USD/TWD): ${stats.usdtwd?.price.toFixed(2)}
- **情緒指標**:
  - 恐懼與貪婪指數: ${stats.stockFnG}
  - VIX 波動率: ${stats.vix?.toFixed(2)}
  - 比特幣: $${stats.bitcoin?.price.toFixed(0)}
- **關鍵個股與半導體**:
  - 台積電 ADR 溢價率: ${tsmPremium} (ADR: ${stats.tsmAdr.price}, TW: ${stats.tsmTw.price})
  - 費半指數 (SOX): ${stats.sox.price} (${stats.sox.changePercent.toFixed(2)}%)
  - AI 領頭羊 NVIDIA: $${stats.nvda.price} (${stats.nvda.changePercent.toFixed(2)}%)

**即時新聞重點 (News Highlights):**
`;

        // Helper to add news to prompt
        const addNews = (category: string, items: NewsItem[], limit: number = 3) => {
            prompt += `\n[${category}]:\n`;
            items.slice(0, limit).forEach(item => {
                prompt += `- ${item.title} (來源: ${item.source})\n`;
            });
        };

        addNews('美國財經焦點', news.us);
        addNews('國際財經視野', news.intl);
        addNews('全球地緣政治', news.geo, 2);
        addNews('台灣財經要聞', news.tw);

        prompt += `\n請根據以上資訊，撰寫一份深度且具有操作參考價值的分析報告：`;

        // Initialize Gemini
        const genAI = new GoogleGenerativeAI(apiKey);
        // Using 'gemini-2.0-flash' as confirmed available in User's model list
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ summary: text });

    } catch (error: any) {
        console.error('Error generating summary:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate summary' },
            { status: 500 }
        );
    }
}
