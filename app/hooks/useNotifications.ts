/**
 * React hook for managing notifications
 */
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Notification, NotificationType } from '@/app/api/lib/notifications';

interface UseNotificationsOptions {
  userId?: string;
  pollInterval?: number;
  autoMarkAsRead?: boolean;
}

interface CreateNotificationOptions {
  relatedUserId?: string;
  metadata?: Record<string, any>;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const {
    userId,
    pollInterval = 30000, // 30 seconds
    autoMarkAsRead = false,
  } = options;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Fetch notifications from server
   */
  const fetchNotifications = useCallback(
    async (unreadOnly = false) => {
      if (!userId) return;

      setLoading(true);
      try {
        const response = await fetch(
          `/api/notifications?userId=${userId}&unreadOnly=${unreadOnly}`
        );
        if (!response.ok) throw new Error('Failed to fetch notifications');

        const data = await response.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch notifications';
        setError(message);
        console.error('Error fetching notifications:', err);
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!userId) return;

      try {
        const response = await fetch(`/api/notifications`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            notificationId,
            action: 'read',
          }),
        });

        if (!response.ok) throw new Error('Failed to mark as read');

        const data = await response.json();
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        );
        setUnreadCount(data.unreadCount);
      } catch (err) {
        console.error('Error marking notification as read:', err);
      }
    },
    [userId]
  );

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    try {
      const unreadNotifs = notifications.filter((n) => !n.read);
      await Promise.all(unreadNotifs.map((n) => markAsRead(n.id)));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  }, [userId, notifications, markAsRead]);

  /**
   * Delete notification
   */
  const deleteNotification = useCallback(
    async (notificationId: string) => {
      if (!userId) return;

      try {
        const response = await fetch(`/api/notifications`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            notificationId,
            action: 'delete',
          }),
        });

        if (!response.ok) throw new Error('Failed to delete notification');

        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      } catch (err) {
        console.error('Error deleting notification:', err);
      }
    },
    [userId]
  );

  /**
   * Create new notification
   */
  const createNotification = useCallback(
    async (
      type: NotificationType,
      title: string,
      message: string,
      options?: CreateNotificationOptions
    ) => {
      if (!userId) return;

      try {
        const response = await fetch(`/api/notifications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            type,
            title,
            message,
            ...options,
          }),
        });

        if (!response.ok) throw new Error('Failed to create notification');

        const data = await response.json();
        setNotifications((prev) => [data.notification, ...prev]);
        return data.notification;
      } catch (err) {
        console.error('Error creating notification:', err);
      }
    },
    [userId]
  );

  /**
   * Start polling for new notifications
   */
  useEffect(() => {
    if (!userId) return;

    // Initial fetch
    fetchNotifications();

    // Set up polling
    pollTimerRef.current = setInterval(() => {
      fetchNotifications();
    }, pollInterval);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, [userId, pollInterval, fetchNotifications]);

  /**
   * Auto-mark as read when notification appears (if enabled)
   */
  useEffect(() => {
    if (autoMarkAsRead && notifications.some((n) => !n.read)) {
      const timer = setTimeout(() => {
        markAllAsRead();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [autoMarkAsRead, notifications, markAllAsRead]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    refetch: fetchNotifications,
  };
}

/**
 * Hook for creating notifications with debouncing
 */
export function useCreateNotification(userId?: string) {
  const [createdNotifications, setCreatedNotifications] = useState<Notification[]>([]);

  const create = useCallback(
    async (
      type: NotificationType,
      title: string,
      message: string,
      options?: Record<string, any>
    ) => {
      if (!userId) return;

      try {
        const response = await fetch(`/api/notifications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            type,
            title,
            message,
            ...options,
          }),
        });

        if (!response.ok) throw new Error('Failed to create notification');

        const data = await response.json();
        setCreatedNotifications((prev) => [data.notification, ...prev]);
        return data.notification;
      } catch (err) {
        console.error('Error creating notification:', err);
      }
    },
    [userId]
  );

  return { create, createdNotifications };
}
