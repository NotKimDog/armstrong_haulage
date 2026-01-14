import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, ref, get, child, update } from 'firebase/database';
import { app } from '@/app/api/lib/firebase';

// Generate random but realistic performance stats (numbers only)
function generatePerformanceStats() {
  const totalMiles = Math.floor(Math.random() * 50000000 + 1000000);
  const topSpeed = Math.floor(Math.random() * 400 + 100);
  const avgDistance = Math.floor(Math.random() * 1000 + 100);
  const maxDistance = Math.floor(Math.random() * 200 + 50);
  const totalTrips = Math.floor(Math.random() * 5000 + 100);
  const fleetSize = Math.floor(Math.random() * 10000 + 100);

  return {
    totalMiles,
    topSpeed,
    avgDistance,
    maxDistance,
    totalTrips,
    fleetSize,
  };
}

export async function POST(request: NextRequest) {
  try {
    const database = getDatabase(app);

    // Get all users
    const usersSnapshot = await get(child(ref(database), 'users'));
    
    if (!usersSnapshot.exists()) {
      return NextResponse.json(
        { error: 'No users found in database' },
        { status: 404 }
      );
    }

    const users = usersSnapshot.val();
    const userIds = Object.keys(users);
    const updates: any = {};
    let seededCount = 0;

    // Add performance stats to each user
    for (const userId of userIds) {
      const statsPath = `users/${userId}/performanceStats`;
      
      // Check if stats already exist
      const existingStatsSnapshot = await get(child(ref(database), statsPath));
      
      // Only seed if stats don't exist
      if (!existingStatsSnapshot.exists()) {
        const stats = generatePerformanceStats();
        updates[statsPath] = stats;
        seededCount++;
      }
    }

    if (Object.keys(updates).length > 0) {
      await update(ref(database), updates);
    }

    return NextResponse.json({
      success: true,
      message: `Performance stats seeded successfully`,
      seededCount,
      totalUsers: userIds.length,
      usersSkipped: userIds.length - seededCount,
    });
  } catch (error: any) {
    console.error('Performance stats seed error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to seed performance stats' },
      { status: 500 }
    );
  }
}
