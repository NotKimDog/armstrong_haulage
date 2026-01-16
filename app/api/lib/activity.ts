// User Activity Feed Utilities and Types
export type ActivityType = 
  | 'profile_updated'
  | 'user_followed'
  | 'achievement_unlocked'
  | 'milestone_reached'
  | 'profile_viewed'
  | 'joined'
  | 'stream_started'
  | 'stream_ended'
  | 'custom';

export interface ActivityEvent {
  id: string;
  userId: string;
  type: ActivityType;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  timestamp: number;
  read: boolean;
}

export interface ActivityFeed {
  events: ActivityEvent[];
  unreadCount: number;
  lastUpdated: number;
}

/**
 * Create a new activity event
 */
export function createActivityEvent(
  userId: string,
  type: ActivityType,
  title: string,
  description?: string,
  metadata?: Record<string, any>
): ActivityEvent {
  return {
    id: `${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    type,
    title,
    description,
    metadata,
    timestamp: Date.now(),
    read: false,
  };
}

/**
 * Generate human-readable activity message
 */
export function getActivityMessage(event: ActivityEvent): string {
  const timeAgo = getTimeAgo(event.timestamp);

  const messages: Record<ActivityType, string> = {
    profile_updated: `Updated their profile ${timeAgo}`,
    user_followed: `Started following someone ${timeAgo}`,
    achievement_unlocked: `Unlocked achievement: ${event.metadata?.achievementName || ''} ${timeAgo}`,
    milestone_reached: `Reached ${event.metadata?.milestoneName || 'milestone'} ${timeAgo}`,
    profile_viewed: `Profile viewed ${timeAgo}`,
    joined: `Joined the platform ${timeAgo}`,
    stream_started: `Started streaming ${timeAgo}`,
    stream_ended: `Ended stream ${timeAgo}`,
    custom: event.title + ` ${timeAgo}`,
  };

  return messages[event.type] || event.title;
}

/**
 * Format timestamp as relative time
 */
export function getTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const weeks = Math.floor(diff / 604800000);
  const months = Math.floor(diff / 2592000000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 4) return `${weeks}w ago`;
  if (months < 12) return `${months}mo ago`;
  return 'long ago';
}

/**
 * Filter activity feed by type
 */
export function filterActivityByType(
  events: ActivityEvent[],
  types: ActivityType[]
): ActivityEvent[] {
  return events.filter((event) => types.includes(event.type));
}

/**
 * Get recent activity events
 */
export function getRecentActivity(
  events: ActivityEvent[],
  limit: number = 20
): ActivityEvent[] {
  return events.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
}

/**
 * Mark activity as read
 */
export function markActivityAsRead(event: ActivityEvent): ActivityEvent {
  return { ...event, read: true };
}

/**
 * Count unread activities
 */
export function countUnreadActivities(events: ActivityEvent[]): number {
  return events.filter((event) => !event.read).length;
}

/**
 * Group activities by date
 */
export function groupActivityByDate(events: ActivityEvent[]): Record<string, ActivityEvent[]> {
  const groups: Record<string, ActivityEvent[]> = {};

  events.forEach((event) => {
    const date = new Date(event.timestamp).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(event);
  });

  return groups;
}
