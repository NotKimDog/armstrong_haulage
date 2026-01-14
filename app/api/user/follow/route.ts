import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, ref, get, update, child } from 'firebase/database';
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

    if (trimmedFollowerId === trimmedFollowingId) {
      return NextResponse.json(
        { error: 'Cannot follow yourself' },
        { status: 400 }
      );
    }

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

    // Check if already following
    const alreadyFollowingSnap = await get(
      child(ref(database), `users/${trimmedFollowerId}/following/${trimmedFollowingId}`)
    );

    if (alreadyFollowingSnap.exists()) {
      return NextResponse.json(
        { error: 'Already following this user' },
        { status: 400 }
      );
    }

    const updates: any = {};
    const timestamp = new Date().toISOString();

    // Add follow relationship
    updates[`users/${trimmedFollowerId}/following/${trimmedFollowingId}`] = { followedAt: timestamp };
    updates[`users/${trimmedFollowingId}/followers/${trimmedFollowerId}`] = { followedAt: timestamp };

    // Get current stats and ensure they exist
    const followerStatsSnap = await get(child(ref(database), `users/${trimmedFollowingId}/stats`));
    const followingStatsSnap = await get(child(ref(database), `users/${trimmedFollowerId}/stats`));

    const followerStats = followerStatsSnap.val() || { followers: 0, following: 0, views: 0 };
    const followingStats = followingStatsSnap.val() || { followers: 0, following: 0, views: 0 };

    const newFollowerCount = (followerStats.followers || 0) + 1;
    const newFollowingCount = (followingStats.following || 0) + 1;

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
      message: 'Followed successfully',
      followerCount: newFollowerCount,
      followingCount: newFollowingCount,
    });
  } catch (error: any) {
    console.error('Follow error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to follow' },
      { status: 500 }
    );
  }
}
