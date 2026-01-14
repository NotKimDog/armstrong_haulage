import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../lib/firebaseDb';
import { ref, get } from 'firebase/database';

interface LeaderboardEntry {
  userId: string;
  displayName: string;
  photoURL?: string;
  totalMiles: number;
  totalJobs: number;
  totalEarnings: number;
  avgRating: number;
  level: number;
  change: number;
  rank?: number;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') || 'miles';
    const range = searchParams.get('range') || 'month';

    const db = getDb();
    const usersRef = ref(db, 'users');
    const statsRef = ref(db, 'stats');

    const [usersSnapshot, statsSnapshot] = await Promise.all([
      get(usersRef),
      get(statsRef)
    ]);

    const leaderboard: LeaderboardEntry[] = [];

    if (usersSnapshot.exists() && statsSnapshot.exists()) {
      const usersData = usersSnapshot.val();
      const statsData = statsSnapshot.val();

      // Combine user data with stats
      for (const userId in usersData) {
        const user = usersData[userId];
        const userStats = statsData[userId] || {};

        leaderboard.push({
          userId,
          displayName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
          photoURL: user.photoURL,
          totalMiles: userStats.miles || 0,
          totalJobs: userStats.jobsDelivered || 0,
          totalEarnings: userStats.earnings || 0,
          avgRating: userStats.rating || 0,
          level: userStats.level || 1,
          change: Math.floor(Math.random() * 10) - 5 // Mock data for change
        });
      }

      // Sort based on category
      leaderboard.sort((a, b) => {
        switch (category) {
          case 'miles':
            return b.totalMiles - a.totalMiles;
          case 'jobs':
            return b.totalJobs - a.totalJobs;
          case 'earnings':
            return b.totalEarnings - a.totalEarnings;
          case 'rating':
            return b.avgRating - a.avgRating;
          default:
            return 0;
        }
      });

      // Add ranks
      leaderboard.forEach((entry, index) => {
        entry.rank = index + 1;
      });
    }

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
