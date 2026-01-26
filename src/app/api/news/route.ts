import { NextResponse } from 'next/server';
import { getDashboardNews } from '@/lib/news';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('force') === 'true';

    const data = await getDashboardNews(forceRefresh);
    return NextResponse.json(data);
}
