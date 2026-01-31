import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NewsItem } from '@/lib/news';
import { MarketStats } from '@/lib/stats';

export async function POST(request: Request) {
    try {
        const apiKey = process.env.API_Key?.trim();
        if (!apiKey) {
            return NextResponse.json(
                { error: 'API_Key is not defined in environment variables' },
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
        let prompt = `現在時間是 **${now}**。請根據以下提供的即時財經新聞與市場數據，撰寫一份「市場總結分析報告」。

**分析目標：**
1.  **市場情緒判讀**：整合「恐懼與貪婪指數」、「VIX 波動率」與「美債殖利率曲線」等數據，研判目前市場處於順勢或避險狀態。
2.  **趨勢連動分析**：
    -   **美股與科技巨頭**：從 NVIDIA、Microsoft 等巨頭表現及費半指數，分析 AI 與科技股趨勢。
    -   **台股與半導體**：結合台積電 ADR 溢價 (${tsmPremium}) 與台股 ETF/個股表現進行分析。
3.  **資金流向觀察**：美債、美元指數、黃金與加密貨幣（比特幣）的資金移動跡象。

**內容要求：**
-   **客觀專業**：基於數據事實進行論述，避免過度臆測。
-   **重點摘要**：針對重要數據或趨勢，請使用 **粗體** 標示。
-   **繁體中文**：使用台灣通用的財經術語。

**關鍵市場數據 (Market Data):**
- **宏觀指標**:
  - 美債殖利率曲線 (10Y-2Y Spread): ${spread}% (10Y: ${stats.us10Y?.price}%, 2Y: ${stats.us2Y.price}%)
  - 美元指數: ${stats.dollarIndex?.price.toFixed(3)}
  - 美元兌台幣 (USD/TWD): ${stats.usdtwd?.price.toFixed(3)}
- **情緒指標**:
  - 恐懼與貪婪指數: ${stats.stockFnG}
  - VIX 波動率: ${stats.vix?.toFixed(2)}
  - 比特幣: $${stats.bitcoin?.price.toFixed(0)}
- **關鍵個股與半導體**:
  - 台積電 ADR 溢價率: ${tsmPremium} (ADR: $${stats.tsmAdr.price}, TW: $${stats.tsmTw.price})
  - 費半指數 (SOX): ${stats.sox.price} (${stats.sox.changePercent.toFixed(2)}%)
  - AI 領頭羊 NVIDIA: $${stats.nvda.price} (${stats.nvda.changePercent.toFixed(2)}%)
  - Microsoft: $${stats.msft.price} (${stats.msft.changePercent.toFixed(2)}%)

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

        prompt += `\n請綜合上述數據與新聞，為投資人提供一份清晰的市場總結與趨勢觀察：`;

        // Initialize Gemini
        const genAI = new GoogleGenerativeAI(apiKey);

        // Expanded Robust Fallback Strategy
        const modelCandidates = [
            "gemini-2.5-pro",       // User's key has access to bleeding edge!
            "gemini-2.5-flash",
            "gemini-2.0-flash",     // Very stable and fast
            "gemini-2.0-flash-001",
            "gemini-1.5-pro",       // Fallback
            "gemini-pro"
        ];

        let text = "";
        let errors: string[] = [];

        for (const modelName of modelCandidates) {
            try {
                console.log(`[AI Summary] Attempting model: ${modelName}`);
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(prompt);
                const response = await result.response;
                text = response.text();

                if (text) {
                    console.log(`[AI Summary] Success with model: ${modelName}`);
                    break;
                }
            } catch (e: any) {
                console.warn(`[AI Summary] Model ${modelName} failed:`, e.message);
                errors.push(`${modelName}: ${e.message}`);
            }
        }

        if (!text) {
            // DEEP DEBUG: Fetch list of available models to debug the 404 issue
            let availableModels = "Could not fetch model list";
            try {
                const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
                if (listRes.ok) {
                    const listData = await listRes.json();
                    const models = listData.models?.map((m: any) => m.name.replace('models/', '')) || [];
                    availableModels = models.join(", ");
                } else {
                    const errText = await listRes.text();
                    availableModels = `Fetch failed (${listRes.status}): ${errText}`;
                }
            } catch (listErr: any) {
                availableModels = `Fetch error: ${listErr.message}`;
            }

            console.error("[AI Summary] All models failed.");
            console.error("Available models for this key:", availableModels);

            throw new Error(`所有 AI 模型皆嘗試失敗 (404/Error)。\n您的 API Key 目前可用的模型列表為: [${availableModels}]。\n請檢查您的 API Key 權限設定。\n詳細錯誤: ${errors.join(" | ")}`);
        }

        return NextResponse.json({ summary: text });

    } catch (error: any) {
        console.error('Error generating summary:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate summary' },
            { status: 500 }
        );
    }
}
