import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, ref, get, update, child } from 'firebase/database';
import { app } from '@/app/api/lib/firebase';

export async function POST(request: NextRequest, ctx: any) {
  try {
    const resolvedParams = await ctx.params;
    const userId = resolvedParams.userId as string;

    // Validate userId
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      return NextResponse.json(
        { error: 'userId is required and must be a valid string' },
        { status: 400 }
      );
    }

    const trimmedUserId = userId.trim();
    const database = getDatabase(app);

    // Check if user exists
    const userSnap = await get(child(ref(database), `users/${trimmedUserId}`));
    if (!userSnap.exists()) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get current stats and ensure they exist
    const statsSnap = await get(child(ref(database), `users/${trimmedUserId}/stats`));
    const stats = statsSnap.val() || { followers: 0, following: 0, views: 0 };

    const newViewCount = (stats.views || 0) + 1;

    // Update stats while preserving other fields
    const updates: any = {};
    updates[`users/${trimmedUserId}/stats`] = {
      ...stats,
      views: newViewCount,
    };

    await update(ref(database), updates);

    return NextResponse.json({
      success: true,
      message: 'View recorded',
      views: newViewCount,
    });
  } catch (error: any) {
    console.error('View error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to record view' },
      { status: 500 }
    );
  }
}
