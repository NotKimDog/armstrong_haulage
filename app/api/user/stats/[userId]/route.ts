import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, ref, get, child } from 'firebase/database';
import { app } from '@/app/api/lib/firebase';

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params;

    // Validate userId
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      return NextResponse.json(
        { error: 'userId is required and must be a valid string' },
        { status: 400 }
      );
    }

    const trimmedUserId = userId.trim();

    // Get optional currentUserId from query params
    const { searchParams } = new URL(request.url);
    const currentUserId = searchParams.get('currentUserId')?.trim() || null;

    const database = getDatabase(app);

    // Check if target user exists
    const userSnap = await get(child(ref(database), `users/${trimmedUserId}`));
    if (!userSnap.exists()) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user stats and ensure they exist
    const statsSnap = await get(child(ref(database), `users/${trimmedUserId}/stats`));
    const stats = statsSnap.val() || { followers: 0, following: 0, views: 0 };

    // Check if currentUserId is following userId (if provided)
    let isFollowing = false;
    if (currentUserId && currentUserId !== trimmedUserId) {
      // Validate currentUserId
      if (typeof currentUserId !== 'string' || currentUserId === '') {
        return NextResponse.json(
          { error: 'currentUserId must be a valid string' },
          { status: 400 }
        );
      }

      // Check if current user exists
      const currentUserSnap = await get(child(ref(database), `users/${currentUserId}`));
      if (!currentUserSnap.exists()) {
        return NextResponse.json(
          { error: 'Current user not found' },
          { status: 404 }
        );
      }

      const followSnap = await get(
        child(ref(database), `users/${currentUserId}/following/${trimmedUserId}`)
      );
      isFollowing = followSnap.exists();
    }

    return NextResponse.json({
      userId: trimmedUserId,
      stats: {
        followers: stats.followers || 0,
        following: stats.following || 0,
        views: stats.views || 0,
      },
      isFollowing,
    });
  } catch (error: any) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
