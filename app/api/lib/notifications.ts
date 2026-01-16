// Real-time Notifications System
import { NextRequest, NextResponse } from 'next/server';

export type NotificationType = 
  | 'achievement' 
  | 'follow' 
  | 'message' 
  | 'alert' 
  | 'milestone' 
  | 'system';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  icon?: string;
  data?: Record<string, any>;
  read: boolean;
  actionUrl?: string;
  createdAt: number;
  expiresAt?: number;
}

class NotificationManager {
  private notifications = new Map<string, Notification[]>();

  /**
   * Create and store a notification
   */
  createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    options?: {
      icon?: string;
      data?: Record<string, any>;
      actionUrl?: string;
      expiresIn?: number; // milliseconds
    }
  ): Notification {
    const notification: Notification = {
      id: `${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type,
      title,
      message,
      icon: options?.icon,
      data: options?.data,
      read: false,
      actionUrl: options?.actionUrl,
      createdAt: Date.now(),
      expiresAt: options?.expiresIn ? Date.now() + options.expiresIn : undefined,
    };

    if (!this.notifications.has(userId)) {
      this.notifications.set(userId, []);
    }

    this.notifications.get(userId)!.push(notification);
    return notification;
  }

  /**
   * Get user notifications
   */
  getNotifications(userId: string, unreadOnly: boolean = false): Notification[] {
    const userNotifs = this.notifications.get(userId) || [];
    const now = Date.now();

    const filtered = userNotifs.filter((n) => {
      // Filter expired notifications
      if (n.expiresAt && now > n.expiresAt) return false;
      // Filter by read status if requested
      if (unreadOnly && n.read) return false;
      return true;
    });

    return filtered.sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Mark notification as read
   */
  markAsRead(userId: string, notificationId: string): boolean {
    const userNotifs = this.notifications.get(userId);
    if (!userNotifs) return false;

    const notification = userNotifs.find((n) => n.id === notificationId);
    if (!notification) return false;

    notification.read = true;
    return true;
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(userId: string): number {
    const userNotifs = this.notifications.get(userId);
    if (!userNotifs) return 0;

    let count = 0;
    userNotifs.forEach((n) => {
      if (!n.read) {
        n.read = true;
        count++;
      }
    });

    return count;
  }

  /**
   * Delete a notification
   */
  deleteNotification(userId: string, notificationId: string): boolean {
    const userNotifs = this.notifications.get(userId);
    if (!userNotifs) return false;

    const index = userNotifs.findIndex((n) => n.id === notificationId);
    if (index === -1) return false;

    userNotifs.splice(index, 1);
    return true;
  }

  /**
   * Get unread count for user
   */
  getUnreadCount(userId: string): number {
    return this.getNotifications(userId, true).length;
  }

  /**
   * Clear expired notifications
   */
  clearExpired(): number {
    const now = Date.now();
    let cleared = 0;

    for (const [userId, notifs] of this.notifications) {
      const before = notifs.length;
      const filtered = notifs.filter((n) => !n.expiresAt || n.expiresAt > now);
      this.notifications.set(userId, filtered);
      cleared += before - filtered.length;
    }

    return cleared;
  }
}

export const notificationManager = new NotificationManager();

/**
 * Broadcast notification to multiple users
 */
export function broadcastNotification(
  userIds: string[],
  type: NotificationType,
  title: string,
  message: string,
  options?: Parameters<typeof notificationManager.createNotification>[4]
): Notification[] {
  return userIds.map((userId) =>
    notificationManager.createNotification(userId, type, title, message, options)
  );
}

/**
 * API Route for getting user notifications
 */
export async function handleGetNotifications(request: NextRequest, userId: string) {
  try {
    const unreadOnly = request.nextUrl.searchParams.get('unreadOnly') === 'true';
    const notifications = notificationManager.getNotifications(userId, unreadOnly);
    const unreadCount = notificationManager.getUnreadCount(userId);

    return NextResponse.json({
      notifications,
      unreadCount,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

/**
 * API Route for marking notification as read
 */
export async function handleMarkNotificationAsRead(
  request: NextRequest,
  userId: string,
  notificationId: string
) {
  try {
    const success = notificationManager.markAsRead(userId, notificationId);

    if (!success) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      unreadCount: notificationManager.getUnreadCount(userId),
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

/**
 * Cleanup expired notifications periodically
 */
export function startNotificationCleanup(interval: number = 60 * 1000): () => void {
  const intervalId = setInterval(() => {
    const cleared = notificationManager.clearExpired();
    if (cleared > 0) {
      console.log(`Cleared ${cleared} expired notifications`);
    }
  }, interval);

  return () => clearInterval(intervalId);
}
