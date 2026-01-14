import { NextResponse } from 'next/server';
import { setLivestreamers, getLivestreamers } from '@/app/api/lib/firebaseDb';
import { livestreamers as localList } from '@/config/livestreamers';

export async function POST(request: Request) {
  try {
    // Check if DB already has entries
    const existing = await getLivestreamers();
    if (existing && existing.length > 0) {
      return NextResponse.json({ success: false, message: 'Livestreamers already present', count: existing.length }, { status: 200 });
    }

    const success = await setLivestreamers(localList || []);
    return NextResponse.json({ success, count: Array.isArray(localList) ? localList.length : 0 });
  } catch (err) {
    console.error('Seeding livestreamers failed', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
