import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { app } from '@/app/api/lib/firebase';

// GET /api/user/slug?slug=desired
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const slug = url.searchParams.get('slug');
    if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
    const db = getFirestore(app);
    const docRef = doc(db, 'user_slugs', slug);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return NextResponse.json({ available: true });
    const owner = docSnap.data()?.userId;
    return NextResponse.json({ available: false, owner });
  } catch (error: any) {
    console.error('Slug check error:', error);
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 });
  }
}

// POST /api/user/slug  body: { userId, slug }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, slug } = body || {};
    if (!userId || !slug) return NextResponse.json({ error: 'Missing userId or slug' }, { status: 400 });
    // Ensure slug is normalized (lowercase, alphanum, dashes)
    const normalized = String(slug).trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-').replace(/-+/g, '-');

    const db = getFirestore(app);

    const slugRef = doc(db, 'user_slugs', normalized);
    const slugSnap = await getDoc(slugRef);
    if (slugSnap.exists()) {
      const owner = slugSnap.data()?.userId;
      if (owner !== userId) {
        return NextResponse.json({ success: false, message: 'Slug already taken', owner }, { status: 409 });
      }
      return NextResponse.json({ success: true, slug: normalized });
    }

    // Remove previous slug mapping for this user (if any)
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const currentSlug = userSnap.data()?.slug;
        if (currentSlug && currentSlug !== normalized) {
          const prevRef = doc(db, 'user_slugs', currentSlug);
          await deleteDoc(prevRef);
        }
      }
    } catch (e) {
      // ignore
    }

    // Create new mapping and update user's slug
    await setDoc(slugRef, { userId });
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, { slug: normalized }, { merge: true });

    return NextResponse.json({ success: true, slug: normalized });
  } catch (error: any) {
    console.error('Slug set error:', error);
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 });
  }
}
