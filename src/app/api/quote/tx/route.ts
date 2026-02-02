
import { NextResponse } from 'next/server';
import { getTX } from '@/lib/stats';

export const dynamic = 'force-dynamic'; // Ensure no caching

export async function GET() {
    try {
        const data = await getTX();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch TX data' },
            { status: 500 }
        );
    }
}
