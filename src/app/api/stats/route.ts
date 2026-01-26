import { NextResponse } from 'next/server';
import { getMarketStats } from '@/lib/stats';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const data = await getMarketStats();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
