import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../lib/firebaseDb';
import { ref, get, update, child } from 'firebase/database';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);

    if (!snapshot.exists()) {
      return NextResponse.json({ activeUsers: 0, inactiveUsers: 0, timeline: [] });
    }

    const usersData = snapshot.val();
    const now = Date.now();
    const thirtyMinutesAgo = now - 30 * 60 * 1000;
    const oneHourAgo = now - 60 * 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    let activeNow = 0;
    let activeLastHour = 0;
    let activeLastDay = 0;
    let activeLastWeek = 0;
    let inactiveUsers = 0;

    const timeline: any[] = [];
    const dayActivityMap = new Map<string, number>();

    Object.values(usersData).forEach((user: any) => {
      const lastActive = user.lastActive || user.lastLogin || user.createdAt || 0;
      const userStatus = user.status || 'offline';

      if (lastActive >= thirtyMinutesAgo || userStatus === 'online') {
        activeNow++;
      }
      if (lastActive >= oneHourAgo) {
        activeLastHour++;
      }
      if (lastActive >= oneDayAgo) {
        activeLastDay++;
      }
      if (lastActive >= sevenDaysAgo) {
        activeLastWeek++;
      }
      if (lastActive < sevenDaysAgo && userStatus === 'offline') {
        inactiveUsers++;
      }

      // Build daily timeline data
      if (lastActive >= sevenDaysAgo) {
        const date = new Date(lastActive);
        const dayKey = date.toISOString().split('T')[0];
        dayActivityMap.set(dayKey, (dayActivityMap.get(dayKey) || 0) + 1);
      }
    });

    // Create timeline array for last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000);
      const dayKey = date.toISOString().split('T')[0];
      const dayCount = dayActivityMap.get(dayKey) || 0;

      timeline.push({
        date: dayKey,
        count: dayCount,
        label: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      });
    }

    return NextResponse.json({
      activeNow,
      activeLastHour,
      activeLastDay,
      activeLastWeek,
      inactiveUsers,
      timeline,
      totalUsers: Object.keys(usersData).length,
    });
  } catch (error) {
    console.error('Error fetching active users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    let userId: string | null = null;
    let status: string | null = null;

    // Try to parse the request body
    try {
      const body = await request.json();
      userId = body.userId;
      status = body.status;
    } catch (e) {
      // If body is empty or not JSON, try query parameters
      const searchParams = request.nextUrl.searchParams;
      userId = searchParams.get('userId');
      status = searchParams.get('status');
    }
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const db = getDb();
    const userRef = ref(db, `users/${userId}`);
    
    const updateData: any = {
      lastActive: Date.now(),
    };

    // If status is provided, update it
    if (status) {
      updateData.status = status;
    } else {
      // Default to online if no status provided
      updateData.status = 'online';
    }

    // Update user activity and status
    await update(userRef, updateData);

    return NextResponse.json({ success: true, status: updateData.status, timestamp: updateData.lastActive });
  } catch (error) {
    console.error('Error updating user activity:', error);
    return NextResponse.json(
      { error: 'Failed to update activity' },
      { status: 500 }
    );
  }
}
