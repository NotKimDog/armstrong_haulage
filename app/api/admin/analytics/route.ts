import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../lib/firebaseDb';
import { ref, get } from 'firebase/database';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    
    // Fetch users
    const usersRef = ref(db, 'users');
    const usersSnapshot = await get(usersRef);
    
    let totalUsers = 0;
    let activeUsers = 0;
    let newUsersToday = 0;
    let totalMiles = 0;
    let totalJobs = 0;

    if (usersSnapshot.exists()) {
      const usersData = usersSnapshot.val();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTime = today.getTime();
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      
      Object.values(usersData).forEach((user: any) => {
        totalUsers++;
        
        // Check if user was active in the last 7 days
        const lastLogin = user.lastLogin || user.createdAt || 0;
        if (lastLogin && Date.now() - lastLogin < 7 * 24 * 60 * 60 * 1000) {
          activeUsers++;
        }
        
        // Check if user joined today
        if (user.createdAt && user.createdAt >= todayTime) {
          newUsersToday++;
        }
      });
    }

    // Fetch stats
    const statsRef = ref(db, 'stats');
    const statsSnapshot = await get(statsRef);
    
    if (statsSnapshot.exists()) {
      const statsData = statsSnapshot.val();
      Object.values(statsData).forEach((stat: any) => {
        if (stat.miles) totalMiles += stat.miles;
        if (stat.jobsDelivered) totalJobs += stat.jobsDelivered;
      });
    }

    return NextResponse.json({
      totalUsers,
      activeUsers,
      newUsersToday,
      totalMiles,
      totalJobs
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
