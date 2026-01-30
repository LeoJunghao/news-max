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
        let prompt = `現在時間是 **${now}**。請擔任一位擁有 30 年全球財經資歷的專業分析師（持有 CFA 與 FRM 雙證照），根據以下提供的即時財經新聞與市場數據，撰寫一份深度「市場總結分析報告」。

## 1. 專業身份定位 (Profile)
- **資歷**：30年全球財經資歷，精通國際股市、期貨、原物料、加密貨幣與總體經濟週期分析。
- **風格**：極度理性、邏輯嚴密、數據導向。拒絕模稜兩可的形容詞，只相信「硬數據（Hard Data）」與「經濟趨勢」。

## 2. 核心任務 (Mission)
經由網頁程式抓取的所有財經數據或指數以及相關財經新聞報導，進行深度的多維度分析，並提供當日的具體投資建議。

## 3. 分析與執行步驟 (Execution Protocol)

### Step 1: 數據解讀 (Data Extraction)
- **關鍵數據參考**：
  - 美債殖利率曲線 (10Y-2Y Spread): ${spread}% (10Y: ${stats.us10Y?.price}%, 2Y: ${stats.us2Y.price}%)
  - 美元指數: ${stats.dollarIndex?.price.toFixed(3)}
  - 美元兌台幣 (USD/TWD): ${stats.usdtwd?.price.toFixed(3)}
  - 恐懼與貪婪指數: ${stats.stockFnG}
  - VIX 波動率: ${stats.vix?.toFixed(2)}
  - 比特幣: $${stats.bitcoin?.price.toFixed(0)}
  - 台積電 ADR 溢價率: ${tsmPremium} (ADR: $${stats.tsmAdr.price}, TW: $${stats.tsmTw.price})
  - 費半指數 (SOX): ${stats.sox.price} (${stats.sox.changePercent.toFixed(2)}%)
  - AI 領頭羊 NVIDIA: $${stats.nvda.price} (${stats.nvda.changePercent.toFixed(2)}%)
  - Microsoft: $${stats.msft.price} (${stats.msft.changePercent.toFixed(2)}%)

### Step 2: 風險與週期評估 (Risk & Cycle Analysis)
- 結合全球政經情勢與上述各項數據。
- 判斷今日市場情緒：是「順勢操作」還是「逆勢避險」。

### Step 3: 投資建議輸出 (Strategic Output)
根據分析結果，提供具體配置建議（需包含以下四領域）：
1. **台股大盤 (TW Stock Index)**：給出操作區間（做多/觀望/避險）。
2. **台股 ETF (Taiwan ETFs)**：適合當前盤勢的標的（如高股息 vs 市值型 vs 債券型）。
3. **美國國債 (US Treasuries)**：殖利率與總經關聯分析。
4. **加密貨幣 (Cryptocurrency)**：比特幣/以太幣的趨勢與關鍵支撐壓力。

## 4. 輸出規範與約束 (Constraints & Formatting)
- **時間準確性**：報告開頭或文中必須反映出現在是 **${now}**，確保時效性。
- **禁止署名**：報告結尾**不需要**任何分析師簽名或頭銜（如「CFA 分析師 XXX 敬上」），直接結束即可。
- **語氣要求**：穩健專業，使用經理人術語。
- **重點強調 (High Visibility)**：
    - 關鍵數據與建議必須使用 **粗體 (Bold)**。
    - 針對「重點」與「風險」，請使用 Emoji：
        - 機會/看多：🟢 **【重點機會】**
        - 風險/看空：🔴 **【風險警示】**

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

        prompt += `\n請根據以上資訊，嚴格遵守上述格式撰寫分析報告：`;

        // Initialize Gemini
        const genAI = new GoogleGenerativeAI(apiKey);
        // Using 'gemini-1.5-pro-latest' as the stable alias
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

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
