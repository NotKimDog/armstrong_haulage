import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, ref, get, update, remove, child } from 'firebase/database';
import { app } from '@/app/api/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { followerId, followingId } = body;

    // Validate required fields
    if (!followerId || typeof followerId !== 'string' || followerId.trim() === '') {
      return NextResponse.json(
        { error: 'followerId is required and must be a valid string' },
        { status: 400 }
      );
    }

    if (!followingId || typeof followingId !== 'string' || followingId.trim() === '') {
      return NextResponse.json(
        { error: 'followingId is required and must be a valid string' },
        { status: 400 }
      );
    }

    const trimmedFollowerId = followerId.trim();
    const trimmedFollowingId = followingId.trim();

    const database = getDatabase(app);

    // Check if both users exist
    const followerSnap = await get(child(ref(database), `users/${trimmedFollowerId}`));
    const followingSnap = await get(child(ref(database), `users/${trimmedFollowingId}`));

    if (!followerSnap.exists() || !followingSnap.exists()) {
      return NextResponse.json(
        { error: 'One or both users not found' },
        { status: 404 }
      );
    }

    // Check if they're actually following
    const isFollowingSnap = await get(child(ref(database), `users/${trimmedFollowerId}/following/${trimmedFollowingId}`));
    if (!isFollowingSnap.exists()) {
      return NextResponse.json(
        { error: 'Not following this user' },
        { status: 400 }
      );
    }

    const updates: any = {};
    updates[`users/${trimmedFollowerId}/following/${trimmedFollowingId}`] = null;
    updates[`users/${trimmedFollowingId}/followers/${trimmedFollowerId}`] = null;

    // Get current stats and ensure they exist
    const followerStatsSnap = await get(child(ref(database), `users/${trimmedFollowingId}/stats`));
    const followingStatsSnap = await get(child(ref(database), `users/${trimmedFollowerId}/stats`));

    const followerStats = followerStatsSnap.val() || { followers: 0, following: 0, views: 0 };
    const followingStats = followingStatsSnap.val() || { followers: 0, following: 0, views: 0 };

    const newFollowerCount = Math.max(0, (followerStats.followers || 0) - 1);
    const newFollowingCount = Math.max(0, (followingStats.following || 0) - 1);

    // Update stats while preserving other fields
    updates[`users/${trimmedFollowingId}/stats`] = {
      ...followerStats,
      followers: newFollowerCount,
    };
    updates[`users/${trimmedFollowerId}/stats`] = {
      ...followingStats,
      following: newFollowingCount,
    };

    await update(ref(database), updates);

    return NextResponse.json({
      success: true,
      message: 'Unfollowed successfully',
      followerCount: newFollowerCount,
      followingCount: newFollowingCount,
    });
  } catch (error: any) {
    console.error('Unfollow error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to unfollow' },
      { status: 500 }
    );
  }
}
