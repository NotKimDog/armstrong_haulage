import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../lib/firebaseDb';
import { ref, get, query, orderByChild, limitToLast } from 'firebase/database';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filter = searchParams.get('filter') || 'all';
    const userId = searchParams.get('userId');

    const db = getDb();
    const activitiesRef = ref(db, 'activities');
    const snapshot = await get(activitiesRef);

    const activities = [];

    if (snapshot.exists()) {
      const activitiesData = snapshot.val();
      
      for (const activityId in activitiesData) {
        const activity = activitiesData[activityId];
        
        // Apply filters
        if (filter === 'personal' && activity.userId !== userId) {
          continue;
        }
        
        activities.push({
          id: activityId,
          ...activity
        });
      }

      // Sort by timestamp (most recent first)
      activities.sort((a, b) => b.timestamp - a.timestamp);
    }

    // Generate mock activities if none exist
    if (activities.length === 0) {
      const mockActivities = generateMockActivities();
      return NextResponse.json(mockActivities);
    }

    return NextResponse.json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
  }
}

function generateMockActivities() {
  const now = Date.now();
  const users = [
    { name: 'John Doe', photo: null },
    { name: 'Sarah Smith', photo: null },
    { name: 'Mike Johnson', photo: null },
    { name: 'Emily Davis', photo: null },
  ];

  const activities = [
    {
      id: '1',
      userId: 'user1',
      userName: users[0].name,
      userPhoto: users[0].photo,
      type: 'job',
      title: 'Completed a long haul',
      description: 'Successfully delivered cargo from Los Angeles to New York',
      timestamp: now - 1000 * 60 * 30,
      metadata: {
        miles: 2789,
        earnings: 4500,
        route: 'LA → NY'
      },
      likes: 12,
      comments: 3,
      isLiked: false
    },
    {
      id: '2',
      userId: 'user2',
      userName: users[1].name,
      userPhoto: users[1].photo,
      type: 'achievement',
      title: 'New Achievement Unlocked!',
      description: 'Earned the "Road Warrior" achievement for completing 100 jobs',
      timestamp: now - 1000 * 60 * 60 * 2,
      metadata: {
        achievement: 'Road Warrior'
      },
      likes: 45,
      comments: 8,
      isLiked: false
    },
    {
      id: '3',
      userId: 'user3',
      userName: users[2].name,
      userPhoto: users[2].photo,
      type: 'level-up',
      title: 'Leveled Up!',
      description: 'Reached level 25 and unlocked new trucks',
      timestamp: now - 1000 * 60 * 60 * 5,
      metadata: {
        level: 25
      },
      likes: 28,
      comments: 5,
      isLiked: false
    },
    {
      id: '4',
      userId: 'user4',
      userName: users[3].name,
      userPhoto: users[3].photo,
      type: 'milestone',
      title: '10,000 Miles Milestone!',
      description: 'Celebrated driving 10,000 total miles',
      timestamp: now - 1000 * 60 * 60 * 8,
      metadata: {
        miles: 10000
      },
      likes: 67,
      comments: 12,
      isLiked: false
    },
    {
      id: '5',
      userId: 'user1',
      userName: users[0].name,
      userPhoto: users[0].photo,
      type: 'rating',
      title: 'Received 5-Star Rating',
      description: 'Client gave excellent feedback for timely delivery',
      timestamp: now - 1000 * 60 * 60 * 12,
      metadata: {},
      likes: 15,
      comments: 2,
      isLiked: false
    },
    {
      id: '6',
      userId: 'user2',
      userName: users[1].name,
      userPhoto: users[1].photo,
      type: 'job',
      title: 'Express Delivery Completed',
      description: 'Delivered urgent cargo ahead of schedule',
      timestamp: now - 1000 * 60 * 60 * 18,
      metadata: {
        miles: 450,
        earnings: 1200,
        route: 'Chicago → Detroit'
      },
      likes: 22,
      comments: 4,
      isLiked: false
    }
  ];

  return activities;
}
