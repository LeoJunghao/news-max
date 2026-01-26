# ColdNews Dashboard

A real-time, cold-light style news dashboard tracking US Finance, International Markets, Geopolitics, and Taiwan Finance.

## Features
- **Real-time News**: Fetches latest updates via Google News RSS (Taiwan Edition).
- **Cold Light UI**: Dark mode with neon cyan accents and glassmorphism.
- **Mobile Responsive**: Optimized for phone and desktop.
- **Gemini Integration**: One-click analysis of news items using Google Gemini.

## Data Sources
Aggregated via a hybrid engine combining Google News RSS and direct feeds from:
- **US/Global**: Yahoo Finance Taiwan (Intl), Google News (Chinese Aggregation)
- **Taiwan**: Central News Agency (CNA), Economic Daily News (UDN)
- **Crypto**: BlockTempo, Blockcast, Google News (Crypto Aggregation)
- **Aggregator**: Google News (Primary for Chinese content fallback)

## Tech Stack
- Next.js 15 (App Router)
- Tailwind CSS v4
- Lucide React (Icons)
- Serverless API Routes (Fetch & Parse RSS)

## Deployment (Vercel)
1. Push this repository to GitHub.
2. Import project in Vercel.
3. Deploy (No environment variables required for basic functionality).

## Gemini Feature
Clicking the "Gemini 分析" button on any news card will copy the title to your clipboard and open Gemini. You can then paste the title to get an instant AI analysis.
