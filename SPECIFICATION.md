# ColdNews Pro - 系統規格書 (System Specification)

## 1. 專案概述 (Project Overview)
**ColdNews Pro** 是一個專為投資者設計的「即時財經新聞與市場數據儀表板」。
本系統採用「冷光科技風格 (Cold Light/Cyberpunk)」設計，整合全球主要財經媒體的即時新聞，並提供關鍵市場指標（如美股期指、台積電溢價、美國公債殖利率等）的即時監控。
系統核心特色在於整合 Google Gemini AI，能針對當前市場新聞與數據，自動生成「財經總評分析報告」。

---

## 2. 技術堆疊 (Technology Stack)

### 前端 (Frontend)
- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Language**: TypeScript / React 19
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: Lucide React
- **Animation**: Framer Motion (頁面轉場與元件載入動畫)
- **UI Architecture**: Client-Side Rendering (CSR) for Dashboard, Server-Side Rendering (SSR) for Initial State.

### 後端 (Backend / Serverless)
- **Runtime**: Next.js API Routes (Serverless Functions)
- **Data Fetching**: 
  - RSS Parser (`xml2js`)：處理新聞源。
  - Custom Scrapers：處理 Yahoo Finance, CNBC, CNN Fear & Greed 等數據。
- **AI Integration**: Google Gemini API (`@google/generative-ai`) via `/api/summary`。
- **Utilities**: `date-fns` (時間處理), `cheerio` (或是類似的 HTML 解析邏輯)。

### 部署 (Deployment)
- **Platform**: Vercel
- **CI/CD**: GitHub Integration

---

## 3. 系統架構與數據流 (System Architecture)

### 3.1 核心模組
1.  **News Aggregator Engine (`src/lib/news.ts`)**:
    -   負責從多個來源（Google News, Yahoo, CNA, BlockTempo 等）抓取 RSS。
    -   執行「關鍵字過濾」、「去重 (Jaccard Similarity)」、「時間篩選 (<24h)」。
    -   分類處理：美國 (US)、國際 (Intl)、地緣政治 (Geo)、台灣 (TW)、加密貨幣 (Crypto)。

2.  **Market Data Engine (`src/lib/stats.ts`)**:
    -   負責抓取實時金融數據。
    -   **來源**: Yahoo Finance (主要), CNBC (債券/匯率), CNN (情緒指數), Alternative.me (Crypto情緒)。
    -   **涵蓋範圍**: 
        -   主要指數 (S&P500, Nasdaq, 費半, 台指期)。
        -   總經指標 (美債 10Y/2Y, 美元指數, 原油, 黃金, VIX)。
        -   重點個股 (AI & Tech Giants: NVIDIA, TSMC, Microsoft, Apple)。
        -   台灣權值股 (台積電, 鴻海, 聯發科等)。

3.  **AI Analysis Service (`/api/summary`)**:
    -   接收前端彙整的「Top News」與「Market Stats」。
    -   呼叫 Google Gemini 模型進行分析。
    -   回傳結構化的市場解讀與情緒判斷（樂觀/悲觀/中性）。

### 3.2 路由結構 (`src/app`)
-   `/` (Home): 主儀表板頁面。
    -   `page.tsx`: 伺服器端預取 (SSR) 初始數據，提升首屏速度 (Revalidate: 60s)。
    -   `DashboardClient.tsx`: 客戶端互動元件，負責定時刷新、AI 請求、UI 渲染。
-   `/api/news`: GET 請求，回傳 JSON 格式的分類新聞。
-   `/api/stats`: GET 請求，回傳 JSON 格式的市場報價。
-   `/api/summary`: POST 請求，觸發 AI 分析。

---

## 4. 功能規格 (Functional Specifications)

### 4.1 儀表板 (Dashboard UI)
-   **Header**: 
    -   顯示 "財經總評" 標題與最後更新時間。
    -   功能按鈕：`REFRESH` (強制刷新所有數據), `COPY` (複製文本報告)。
-   **期貨指數區 (Futures)**: 頂部橫列，監控美股三大期指與台指期。
-   **主要股市區 (Major Indices)**: 顯示費半、納指、道瓊、台股加權、日韓股市。
-   **財經數據區 (Macro Pulse)**:
    -   **關鍵指標**: 美債殖利率 (10Y, 2Y)、美元指數 (DXY)、美元兌台幣/日圓。
    -   **商品**: 布蘭特原油、黃金、銅價、BDI 航運指數。
    -   **台積電溢價**: 自動計算 TSM ADR 與 台股 2330 的溢價差。
-   **AI 科技巨頭 (AI Leaders)**: 專區顯示 NVIDIA, TSMC(ADR), AMD, Microsoft, Google, Meta, Apple。
-   **台灣權值 (Taiwan Tech)**: 台積電, 鴻海, 聯發科, 廣達, 台達電, 富邦金。
-   **情緒儀表板 (Gauges)**:
    -   股市恐懼貪婪 (Stock Fear & Greed)
    -   VIX 波動率 (VIX Index)
    -   加密貨幣貪婪 (Crypto Fear & Greed)
    -   黃金情緒 (Gold Sentiment)

### 4.2 自動化 AI 分析報告
-   **觸發時機**: 頁面初次載入或點擊 Refresh 後自動觸發。
-   **顯示內容**:
    -   市場情緒標籤（如：樂觀偏多、中性觀望）。
    -   條列式重點分析，自動高亮關鍵數字（琥珀色顯示）。
    -   載入狀態顯示 "AI 正在即時分析全球市場數據..." 動畫。

### 4.3 新聞列表
-   **分類**: 美國財經、國際財經、地緣政治、台灣財經、加密貨幣。
-   **卡片設計**: 
    -   顯示來源與時間 (e.g., "CNBC • 2小時前")。
    -   點擊標題可開啟原始連結。
    -   提供 "Gemini 分析" 按鈕 (尚未詳細實作，目前可能為複製標題功能)。

---

## 5. UI/UX 設計規範 (Design System)

### 色彩計畫 (Color Palette)
-   **背景色**: Deep Space Blue (`#050b14` ~ `bg-slate-950`)
-   **主色調 (Accents)**:
    -   **Cyan (科技/資訊)**: `text-cyan-400`, `border-cyan-500` (用於標題、邊框光暈)。
    -   **Purple (高科技/AI)**: `text-purple-300`, `border-purple-500` (用於 AI 板塊、個股)。
    -   **Emerald (加密貨幣)**: `text-emerald-400`。
-   **數據漲跌色 (Taiwan Standards)**:
    -   **漲 (Up)**: Red (`text-red-400`)
    -   **跌 (Down)**: Green (`text-green-400`)
    -   *註：美股習慣通常相反，但本專案採用台灣看盤習慣。*

### 字體 (Typography)
-   **主要文字**: Sans-serif (系統預設 Inter/Roboto)。
-   **數據/標題**: Monospace (`font-mono`)，強調數據感與科技感。

### 視覺效果
-   **Glassmorphism**: 使用 `backdrop-blur` 與半透明背景 (`bg-slate-900/50`)。
-   **Glow Effects**: 使用 `box-shadow` 與 `drop-shadow` 模擬霓虹光暈。
-   **Micro-interactions**: 按鈕 Hover 變色、數據卡片 Hover 浮起 (`scale-102`)。

---

## 6. 資料來源清單 (Data Sources)

| 類別 | 來源名稱 | 用途 | 備註 |
| --- | --- | --- | --- |
| **News** | Google News RSS | 聚合各類別新聞 | 主要來源 |
| **News** | Yahoo Finance (TW) | 國際/美股新聞 | 備援/輔助 |
| **News** | 中央社 (CNA) / 經濟日報 | 台灣財經新聞 | 補強在地觀點 |
| **News** | BlockTempo / Blockcast | 加密貨幣新聞 | 專項來源 |
| **Market** | Yahoo Finance API | 股票、指數、VIX、匯率 | 延遲約 15分鐘 |
| **Market** | CNBC Quotes | 美債殖利率、BDI、美元指數 | 較 Yahoo 即時 |
| **Sentiment**| CNN Business | Fear & Greed Index | 需透過 Proxy 或 API |
| **Sentiment**| Alternative.me | Crypto Fear & Greed | 開放 API |

---

## 7. 未來擴充規劃 (Roadmap)
1.  **用戶登入系統**: 收藏新聞、自訂關注股票。
2.  **更深度的 AI 互動**: 針對單則新聞進行 "Deep Dive" 提問。
3.  **TradingView 圖表整合**: 點擊股票代碼顯示 K 線圖。
4.  **推播通知**: 當 VIX 飆升或重大新聞發生時發送通知。

---
*Last Updated: 2026-01-30*
