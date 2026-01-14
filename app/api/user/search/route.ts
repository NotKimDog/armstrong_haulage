import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { app } from '@/app/api/lib/firebase';

// GET /api/user/search?q=prefix
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const q = (url.searchParams.get('q') || '').trim();
    if (!q) return NextResponse.json({ users: [] });

    const db = getFirestore(app);
    // Firestore doesn't support contains; do a prefix search using >= and <= with \uffff
    const end = q + '\uffff';
    const usersCol = collection(db, 'users');
    const qref = query(usersCol, orderBy('displayName'), where('displayName', '>=', q), where('displayName', '<=', end), limit(25));
    const snap = await getDocs(qref);
    const users: Array<any> = [];
    snap.forEach((doc) => {
      const d = doc.data();
      users.push({ id: doc.id, displayName: d.displayName || null, photoURL: d.photoURL || null, slug: d.slug || null });
    });
    return NextResponse.json({ users });
  } catch (err: any) {
    console.error('Search users error', err);
    return NextResponse.json({ users: [] }, { status: 500 });
  }
}
