
import { NextResponse } from 'next/server';
import { getOTC } from '@/lib/stats';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const data = await getOTC();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch OTC data' },
            { status: 500 }
        );
    }
}
