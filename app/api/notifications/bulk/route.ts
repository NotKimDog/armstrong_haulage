import { NextRequest, NextResponse } from 'next/server';
import { notificationManager } from '@/app/api/lib/notifications';
import { performanceMonitor, sendMetricsToAnalytics } from '@/app/api/lib/performance';

/**
 * GET /api/notifications - Get user notifications
 * POST /api/notifications - Create notification
 */
export async function GET(request: NextRequest) {
  try {
    // In production, get userId from auth token
    const userId = request.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json(
        { error: 'userId required' },
        { status: 400 }
      );
    }

    const unreadOnly = request.nextUrl.searchParams.get('unreadOnly') === 'true';
    const notifications = notificationManager.getNotifications(userId, unreadOnly);
    const unreadCount = notificationManager.getUnreadCount(userId);

    return NextResponse.json(
      {
        success: true,
        notifications,
        unreadCount,
        timestamp: Date.now(),
      },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
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
      message,
      icon,
      data,
      actionUrl,
      expiresIn,
    } = await request.json();

    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const notification = notificationManager.createNotification(
      userId,
      type,
      title,
      message,
      {
        icon,
        data,
        actionUrl,
        expiresIn,
      }
    );

    return NextResponse.json(
      {
        success: true,
        notification,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/notifications/[notificationId] - Mark notification as read
 */
export async function PUT(request: NextRequest) {
  try {
    const { notificationId, userId, action } = await request.json();

    if (!userId || !notificationId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (action === 'read') {
      const success = notificationManager.markAsRead(userId, notificationId);
      if (!success) {
        return NextResponse.json(
          { error: 'Notification not found' },
          { status: 404 }
        );
      }
    } else if (action === 'delete') {
      const success = notificationManager.deleteNotification(userId, notificationId);
      if (!success) {
        return NextResponse.json(
          { error: 'Notification not found' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      unreadCount: notificationManager.getUnreadCount(userId),
    });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}
