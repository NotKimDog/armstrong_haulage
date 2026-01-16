'use client';

import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ActivityEvent, getActivityMessage } from '@/app/api/lib/activity';
import { motion } from 'framer-motion';
import { Heart, Users, Trophy, Eye, MessageCircle, Star } from 'lucide-react';

interface ActivityFeedProps {
  userId?: string;
  limit?: number;
  showGroupedByDate?: boolean;
}

export function ActivityFeed({
  userId,
  limit = 20,
  showGroupedByDate = true,
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const fetchActivities = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/activity/feed?userId=${userId}&limit=${limit}&groupByDate=${showGroupedByDate}`
        );
        if (!response.ok) throw new Error('Failed to fetch activities');

        const data = await response.json();
        
        if (showGroupedByDate && typeof data.activities === 'object' && !Array.isArray(data.activities)) {
          // Convert grouped object to flat array for easier rendering
          const flat: ActivityEvent[] = [];
          Object.values(data.activities).forEach((dateActivities: any) => {
            flat.push(...dateActivities);
          });
          setActivities(flat);
        } else {
          setActivities(data.activities || []);
        }
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch activities';
        setError(message);
        console.error('Error fetching activities:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();

    // Polling for new activities every 30 seconds
    const interval = setInterval(fetchActivities, 30000);
    return () => clearInterval(interval);
  }, [userId, limit, showGroupedByDate]);

  const getActivityIcon = (type: string) => {
    const iconProps = { className: 'w-4 h-4' };
    
    switch (type) {
      case 'profile_updated':
        return <Eye {...iconProps} />;
      case 'user_followed':
        return <Users {...iconProps} />;
      case 'achievement_unlocked':
        return <Trophy {...iconProps} />;
      case 'milestone_reached':
        return <Star {...iconProps} />;
      case 'profile_viewed':
        return <Eye {...iconProps} />;
      case 'joined':
        return <Heart {...iconProps} />;
      case 'stream_started':
        return <MessageCircle {...iconProps} />;
      case 'stream_ended':
        return <MessageCircle {...iconProps} />;
      default:
        return <Heart {...iconProps} />;
    }
  };

  const getActivityColor = (type: string) => {
    const colors: Record<string, string> = {
      profile_updated: 'text-blue-400',
      user_followed: 'text-green-400',
      achievement_unlocked: 'text-yellow-400',
      milestone_reached: 'text-purple-400',
      profile_viewed: 'text-blue-400',
      joined: 'text-green-400',
      stream_started: 'text-red-400',
      stream_ended: 'text-red-400',
    };
    return colors[type] || 'text-gray-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 text-red-300">
        {error}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>No activities yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white mb-6">Recent Activity</h2>
      
      <div className="space-y-3">
        {activities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-start gap-4 p-4 rounded-lg bg-neutral-900/50 border border-white/10 hover:border-white/20 transition-colors"
          >
            <div className={`mt-1 ${getActivityColor(activity.type)}`}>
              {getActivityIcon(activity.type)}
            </div>

            <div className="flex-1">
              <h3 className="font-semibold text-white">{activity.title}</h3>
              {activity.description && (
                <p className="text-sm text-gray-400 mt-1">{activity.description}</p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                {format(new Date(activity.timestamp), 'MMM d, yyyy h:mm a')}
              </p>
            </div>

            {activity.metadata?.actionUrl && (
              <a
                href={activity.metadata.actionUrl}
                className="text-emerald-500 hover:text-emerald-400 text-sm font-medium transition-colors"
              >
                View
              </a>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default ActivityFeed;
