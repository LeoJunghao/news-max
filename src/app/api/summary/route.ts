import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NewsItem } from '@/lib/news';
import { MarketStats, MarketQuote } from '@/lib/stats';

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

        // Helper to format price with range
        const fmtPrice = (quote: MarketQuote | undefined, prefix: string = '$') => {
            if (!quote?.price) return 'N/A';
            let str = `${prefix}${quote.price.toLocaleString(undefined, { maximumFractionDigits: 2 })} (${quote.changePercent >= 0 ? '+' : ''}${quote.changePercent.toFixed(2)}%)`;
            if (quote.fiftyTwoWeekHigh && quote.fiftyTwoWeekLow) {
                str += ` [52W Range: ${prefix}${quote.fiftyTwoWeekLow.toLocaleString()} - ${prefix}${quote.fiftyTwoWeekHigh.toLocaleString()}]`;
            }
            return str;
        };

        // Construct the prompt
        let prompt = `現在時間是 **${now}**。你是「ColdNews Pro」的首席市場分析師，請撰寫一份專業的「全球金融市場總結報告」。

**分析核心原則：**
1.  **判讀趨勢位階**：**必須**參考數據中的「52週最高/最低價 (52W Range)」。
    -   例如：若比特幣價格為 $70,000，但52週高點為 $120,000，**不可**稱其為歷史高點，應解讀為「高檔回調」或「修正階段」。
    -   若價格接近 52週高點，則強調「創高動能」；接近低點則提示「築底跡象」。
2.  **情緒與資金**：結合恐懼貪婪指數 (VIX, Fear & Greed) 與美債殖利率，判斷資金是 Risk-On (追逐風險) 還是 Risk-Off (避險)。

**報告結構：**
1.  **市場情緒溫度計**：一句話定調目前市場氣氛（如：謹慎樂觀、恐慌拋售、高檔震盪）。
2.  **關鍵趨勢解析**：
    -   **加密貨幣**：比特幣目前價格相對於均線與歷史高點的位階分析。
    -   **AI 與科技股**：NVIDIA、台積電 ADR 與費半指數的動能。
    -   **宏觀因子**：美債殖利率與美元對資金流向的影響。
3.  **操作風險提示**：針對當前數據異常或高乖離商品提出警示。

**關鍵市場數據 (Market Data):**
- **宏觀指標**:
  - 美債殖利率曲線 (10Y-2Y Spread): ${spread}% (10Y: ${stats.us10Y?.price}%, 2Y: ${stats.us2Y.price}%)
  - 美元指數: ${stats.dollarIndex?.price.toFixed(3)}
  - 美元兌台幣: ${stats.usdtwd?.price.toFixed(3)}
- **情緒指標**:
  - 恐懼與貪婪指數: ${stats.stockFnG}
  - VIX 波動率: ${stats.vix?.toFixed(2)}
  - 比特幣: ${fmtPrice(stats.bitcoin)}
- **關鍵個股與半導體**:
  - 台積電 ADR 溢價率: ${tsmPremium} (ADR: ${fmtPrice(stats.tsmAdr)}, TW: $${stats.tsmTw.price})
  - 費半指數 (SOX): ${fmtPrice(stats.sox, '')}
  - AI 領頭羊 NVIDIA: ${fmtPrice(stats.nvda)}
  - Microsoft: ${fmtPrice(stats.msft)}
  - 黃金 (Gold): ${fmtPrice(stats.goldPrice)}

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
            "gemini-3.0-pro",       // Potential new version
            "gemini-3.0-flash",
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
