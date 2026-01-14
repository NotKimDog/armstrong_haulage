import { NextRequest, NextResponse } from 'next/server';
import { getUserProfile as getFirebaseUserProfile, getDb as getFirebaseDb, setUserProfile as setFirebaseUserProfile } from '@/app/api/lib/firebaseDb';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from '@/app/api/lib/firebase';
import { child, ref, get } from 'firebase/database';

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId: userIdOrSlug } = await params;

    // Try direct lookup in Firebase RTDB first
    const direct = await getFirebaseUserProfile(userIdOrSlug);
    if (direct) {
      // Ensure we always include an `id` field so clients can detect owner correctly
      // Ensure stats exist with defaults
      const profileData = direct as any;
      if (!profileData.stats) {
        profileData.stats = { followers: 0, following: 0, views: 0 };
      }
      return NextResponse.json({ id: userIdOrSlug, ...profileData });
    }

    // If not found by id, try resolving as a slug using Firestore mapping
    try {
      const fs = getFirestore(app);
      const slugRef = doc(fs, 'user_slugs', userIdOrSlug);
      const slugSnap = await getDoc(slugRef);
      if (!slugSnap.exists()) {
        // fallback: scan RTDB users for slug field (legacy)
        const database = getFirebaseDb();
        const snapshot = await get(child(ref(database), 'users'));
        if (!snapshot.exists()) return NextResponse.json({ error: 'User not found' }, { status: 404 });
        const usersObj = snapshot.val();
        const entries = Object.entries(usersObj || {});
        const found = entries.find(([id, u]) => {
          try { return (u as any)?.slug === userIdOrSlug; } catch { return false; }
        });
        if (!found) return NextResponse.json({ error: 'User not found' }, { status: 404 });
        const [foundId, foundVal] = found;
        return NextResponse.json({ id: foundId, ...(foundVal as any) });
      }
      const ownerId = slugSnap.data()?.userId as string | undefined;
      if (!ownerId) return NextResponse.json({ error: 'User not found' }, { status: 404 });
      const profile = await getFirebaseUserProfile(ownerId);
      if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 });
      return NextResponse.json({ id: ownerId, ...(profile as any) });
    } catch (err: any) {
      console.error('Fallback profile lookup failed:', err);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
  } catch (error: any) {
    console.error('Fetch profile error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, ctx: any) {
  try {
    const resolvedParams = await ctx.params;
    const userId = resolvedParams.userId as string;
    const updates = await request.json();
    // Use Firebase RTDB helper to set/update profile fields
    const allowed: any = {};
    if (updates.displayName !== undefined) allowed.displayName = updates.displayName;
    if (updates.bio !== undefined) allowed.bio = updates.bio;
    if (updates.location !== undefined) allowed.location = updates.location;
    if (updates.website !== undefined) allowed.website = updates.website;
    if (updates.photoURL !== undefined) allowed.photoURL = updates.photoURL;
    if (updates.bannerURL !== undefined) allowed.bannerURL = updates.bannerURL;
    if (updates.stats !== undefined) allowed.stats = updates.stats;

    if (Object.keys(allowed).length === 0) {
      return NextResponse.json({ success: true, message: 'No changes' });
    }

    const ok = await setFirebaseUserProfile(userId, allowed);
    if (!ok) {
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Profile updated' });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update profile' },
      { status: 500 }
    );
  }
}
