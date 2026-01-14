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
    const database = getDatabase(app);

    // Check if user exists
    const userSnap = await get(child(ref(database), `users/${trimmedUserId}`));
    if (!userSnap.exists()) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user performance stats from database
    const statsSnap = await get(child(ref(database), `users/${trimmedUserId}/performanceStats`));
    
    let stats = {
      totalMiles: 0,
      topSpeed: 0,
      avgDistance: 0,
      maxDistance: 0,
      totalTrips: 0,
      fleetSize: 0,
    };

    if (statsSnap.exists()) {
      const dbStats = statsSnap.val();
      stats = {
        totalMiles: dbStats.totalMiles || 0,
        topSpeed: dbStats.topSpeed || 0,
        avgDistance: dbStats.avgDistance || 0,
        maxDistance: dbStats.maxDistance || 0,
        totalTrips: dbStats.totalTrips || 0,
        fleetSize: dbStats.fleetSize || 0,
      };
    }

    return NextResponse.json({
      userId: trimmedUserId,
      stats,
    });
  } catch (error: any) {
    console.error('Performance stats error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch performance stats' },
      { status: 500 }
    );
  }
}
