import { NextRequest, NextResponse } from 'next/server';
import { getStats, updateStats, getLivestreamers, setLivestreamers } from '@/app/api/lib/firebaseDb';
import { app } from '@/app/api/lib/firebase';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');

    if (type === 'stats') {
      try {
        const firestore = getFirestore(app);
        const docRef = doc(firestore, 'landingPageStats', 'current');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          return NextResponse.json([data]);
        }
      } catch (err) {
        console.warn('Firestore stats read failed, falling back to RTDB', err);
      }

      const stats = await getStats();
      return NextResponse.json(stats ? [stats] : []);
    }

    if (type === 'livestreamers') {
      try {
        // Prefer Firestore collection if available
        const firestore = getFirestore(app);
        const col = collection(firestore, 'livestreamers');
        const snap = await getDocs(col);
        const list = snap.docs.map(d => d.data());
        return NextResponse.json(list || []);
      } catch (err) {
        console.warn('Firestore livestreamers read failed, falling back to RTDB', err);
        const list = await getLivestreamers();
        return NextResponse.json(list || []);
      }
    }

    return NextResponse.json({ error: 'Invalid query type' }, { status: 400 });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Database query failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { type, data } = await request.json();

    if (type === 'stats' && data) {
      const success = await updateStats(data);
      return NextResponse.json({ success, data });
    }

    if (type === 'livestreamers' && data) {
      const success = await setLivestreamers(data);
      return NextResponse.json({ success, data });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Database operation failed' },
      { status: 500 }
    );
  }
}
