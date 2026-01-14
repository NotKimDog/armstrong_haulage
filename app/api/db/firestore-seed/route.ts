import { NextResponse } from 'next/server';
import { livestreamers as localList } from '@/config/livestreamers';
import { app } from '@/app/api/lib/firebase';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

export async function POST(request: Request) {
  try {
    const firestore = getFirestore(app);
    const list = Array.isArray(localList) ? localList : [];
    let written = 0;
    for (const s of list) {
      const id = s.username || s.channelId || `${s.name}`;
      if (!id) continue;
      const ref = doc(firestore, 'livestreamers', id.toString());
      await setDoc(ref, s as any);
      written++;
    }

    return NextResponse.json({ success: true, written });
  } catch (err) {
    console.error('Firestore seed failed', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
