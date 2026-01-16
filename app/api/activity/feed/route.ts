import { NextRequest, NextResponse } from 'next/server';
import { 
  createActivityEvent, 
  getRecentActivity, 
  groupActivityByDate,
  ActivityType,
} from '@/app/api/lib/activity';

// In-memory activity store (use database in production)
const activityStore = new Map<string, any[]>();

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    const limit = Math.min(100, Math.max(1, parseInt(request.nextUrl.searchParams.get('limit') || '20')));
    const groupByDate = request.nextUrl.searchParams.get('groupByDate') === 'true';

    if (!userId) {
      return NextResponse.json(
        { error: 'userId required' },
        { status: 400 }
      );
    }

    const activities = activityStore.get(userId) || [];
    const recent = getRecentActivity(activities, limit);
    const grouped = groupByDate ? groupActivityByDate(recent) : null;

    return NextResponse.json({
      success: true,
      activities: grouped || recent,
      total: activities.length,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error fetching activity feed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity feed' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      userId,
      type,
      title,
      description,
      metadata,
    }: {
      userId: string;
      type: ActivityType;
      title: string;
      description?: string;
      metadata?: Record<string, any>;
    } = await request.json();

    if (!userId || !type || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, type, title' },
        { status: 400 }
      );
    }

    const activity = createActivityEvent(
      userId,
      type,
      title,
      description,
      metadata
    );

    if (!activityStore.has(userId)) {
      activityStore.set(userId, []);
    }

    activityStore.get(userId)!.push(activity);

    // Keep only last 500 activities per user
    const activities = activityStore.get(userId)!;
    if (activities.length > 500) {
      activityStore.set(userId, activities.slice(-500));
    }

    return NextResponse.json(
      {
        success: true,
        activity,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating activity:', error);
    return NextResponse.json(
      { error: 'Failed to create activity' },
      { status: 500 }
    );
  }
}
