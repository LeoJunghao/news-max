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

        // Construct the prompt
        let prompt = `請擔任一位專業的全球總體經濟分析師，根據以下提供的即時財經新聞與市場數據，撰寫一份「市場總結分析報告」。

**風格與內容要求：**
1.  **冷靜、客觀、專業**：使用財經專業用語，語氣簡潔有力。
2.  **數據驅動**：必須引用提供的數據（如利差、溢價率）來佐證論點。
3.  **情境推演 (Scenario Analysis)**：在結尾處，請根據當前數據提供「多方」與「空方」的短線劇本推演。
4.  **結構嚴謹**：
    -   **綜合市場掃描**：總結宏觀氛圍與資金流向。
    -   **關鍵因子分析**：針對「美債利差」、「台積電溢價」、「AI 領頭羊」進行深入解讀。
    -   **區域市場觀察**：歐美與台灣市場重點。
    -   **投資劇本推演**：多空情境與風險提示。
5.  **繁體中文** (Traditional Chinese)。

**關鍵市場數據 (Market Data):**
- **宏觀指標**:
  - 美債殖利率曲線 (10Y-2Y Spread): ${spread}% (10Y: ${stats.us10Y?.price}%, 2Y: ${stats.us2Y.price}%) - 若為負值代表倒掛。
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
