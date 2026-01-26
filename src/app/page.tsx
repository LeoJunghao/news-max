import { getDashboardNews } from '@/lib/news';
import { getMarketStats } from '@/lib/stats';
import { DashboardClient } from '@/components/DashboardClient';

// Refresh the page data on the server side every 60 seconds
export const revalidate = 60;

export default async function Page() {
  const [news, stats] = await Promise.all([
    getDashboardNews(),
    getMarketStats()
  ]);

  return (
    <DashboardClient
      initialData={news}
      initialStats={stats}
      lastUpdatedStr={new Date().toISOString()}
    />
  );
}
