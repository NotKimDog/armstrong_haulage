'use client';

import React, { useState } from 'react';
import { Notification } from '@/app/api/lib/notifications';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, CheckCircle, AlertCircle } from 'lucide-react';
import { useNotifications } from '@/app/hooks/useNotifications';

interface NotificationCenterProps {
  userId?: string;
  maxVisible?: number;
}

export function NotificationCenter({
  userId,
  maxVisible = 5,
}: NotificationCenterProps) {
  const {
    notifications,
    unreadCount,
    markAsRead,
    deleteNotification,
    loading,
  } = useNotifications({ userId, pollInterval: 20000 });

  const [showPanel, setShowPanel] = useState(false);
  const displayedNotifications = notifications.slice(0, maxVisible);

  const getNotificationIcon = (type: string) => {
    const iconProps = { className: 'w-4 h-4' };
    switch (type) {
      case 'achievement':
        return <CheckCircle {...iconProps} className="text-yellow-500" />;
      case 'alert':
        return <AlertCircle {...iconProps} className="text-red-500" />;
      case 'milestone':
        return <CheckCircle {...iconProps} className="text-green-500" />;
      default:
        return <Bell {...iconProps} className="text-blue-500" />;
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 text-gray-300 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-96 max-h-96 bg-neutral-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
          >
            {/* Header */}
            <div className="bg-neutral-950 border-b border-white/10 p-4 flex justify-between items-center">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Notifications
              </h3>
              <button
                onClick={() => setShowPanel(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            {loading ? (
              <div className="p-4 text-center text-gray-400">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-emerald-500 mx-auto"></div>
              </div>
            ) : displayedNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5 overflow-y-auto max-h-80">
                {displayedNotifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className={`p-4 hover:bg-white/5 transition-colors ${
                      !notification.read ? 'bg-emerald-500/5' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {getNotificationIcon(notification.type)}

                      <div className="flex-1">
                        <h4 className="font-semibold text-white text-sm">
                          {notification.title}
                        </h4>
                        <p className="text-xs text-gray-400 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>

                      <div className="flex gap-1">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-emerald-500 hover:text-emerald-400 transition-colors p-1"
                            title="Mark as read"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
                          title="Delete"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Footer */}
            {notifications.length > maxVisible && (
              <div className="bg-neutral-950 border-t border-white/10 p-3 text-center">
                <a
                  href="/notifications"
                  className="text-emerald-500 hover:text-emerald-400 text-sm font-medium transition-colors"
                >
                  View all notifications ({notifications.length})
                </a>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default NotificationCenter;
