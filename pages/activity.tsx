"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import {
  Activity,
  Truck,
  Award,
  Users,
  TrendingUp,
  MapPin,
  Clock,
  MessageCircle,
  Heart,
  Share2,
  Briefcase,
  Target,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';

interface ActivityItem {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  type: 'job' | 'achievement' | 'milestone' | 'follow' | 'rating' | 'level-up';
  title: string;
  description: string;
  timestamp: number;
  metadata?: {
    miles?: number;
    earnings?: number;
    route?: string;
    achievement?: string;
    level?: number;
  };
  likes: number;
  comments: number;
  isLiked?: boolean;
}

export default function ActivityFeedPage() {
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'following' | 'personal'>('all');
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await fetchActivities(user.uid);
      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, filter]);

  const fetchActivities = async (userId: string) => {
    try {
      const res = await fetch(`/api/activity?filter=${filter}&userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'job':
        return <Truck className="text-blue-500" size={20} />;
      case 'achievement':
        return <Award className="text-yellow-500" size={20} />;
      case 'milestone':
        return <Target className="text-purple-500" size={20} />;
      case 'follow':
        return <Users className="text-green-500" size={20} />;
      case 'rating':
        return <TrendingUp className="text-orange-500" size={20} />;
      case 'level-up':
        return <Zap className="text-red-500" size={20} />;
      default:
        return <Activity className="text-neutral-500" size={20} />;
    }
  };

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'job':
        return 'bg-blue-500/10 border-blue-500/30';
      case 'achievement':
        return 'bg-yellow-500/10 border-yellow-500/30';
      case 'milestone':
        return 'bg-purple-500/10 border-purple-500/30';
      case 'follow':
        return 'bg-green-500/10 border-green-500/30';
      case 'rating':
        return 'bg-orange-500/10 border-orange-500/30';
      case 'level-up':
        return 'bg-red-500/10 border-red-500/30';
      default:
        return 'bg-neutral-800 border-neutral-700';
    }
  };

  const handleLike = async (activityId: string) => {
    try {
      await fetch(`/api/activity/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activityId })
      });
      
      setActivities(activities.map(activity =>
        activity.id === activityId
          ? {
              ...activity,
              likes: activity.isLiked ? activity.likes - 1 : activity.likes + 1,
              isLiked: !activity.isLiked
            }
          : activity
      ));
    } catch (error) {
      console.error('Error liking activity:', error);
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white pt-32">
      {/* Header */}
      <div className="bg-neutral-900 border-b border-neutral-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Activity className="text-blue-500" size={32} />
                Activity Feed
              </h1>
              <p className="text-neutral-400 mt-1">See what's happening in the community</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 bg-neutral-900 p-2 rounded-lg border border-neutral-800">
          {(['all', 'following', 'personal'] as const).map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                filter === filterType
                  ? 'bg-red-600 text-white'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            </button>
          ))}
        </div>

        {/* Activity Feed */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-neutral-500">Loading activities...</div>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-12 bg-neutral-900 rounded-lg border border-neutral-800">
              <Activity size={48} className="mx-auto mb-4 text-neutral-700" />
              <p className="text-neutral-400">No activities yet</p>
              <p className="text-sm text-neutral-500 mt-2">
                Start driving or follow other drivers to see activity here
              </p>
            </div>
          ) : (
            activities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-neutral-900 rounded-lg border p-6 hover:border-neutral-600 transition ${getActivityColor(activity.type)}`}
              >
                <div className="flex gap-4">
                  {/* User Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-neutral-700 rounded-full overflow-hidden">
                      {activity.userPhoto ? (
                        <img src={activity.userPhoto} alt={activity.userName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl font-bold">
                          {activity.userName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold">{activity.userName}</span>
                          <span className="text-neutral-500">·</span>
                          <span className="text-sm text-neutral-500">{formatTimeAgo(activity.timestamp)}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-2">
                          {getActivityIcon(activity.type)}
                          <span className="font-medium">{activity.title}</span>
                        </div>
                        
                        <p className="text-neutral-400 mb-3">{activity.description}</p>

                        {/* Metadata */}
                        {activity.metadata && (
                          <div className="flex flex-wrap gap-3 mb-3">
                            {activity.metadata.miles && (
                              <div className="flex items-center gap-1 px-3 py-1 bg-neutral-800 rounded-full text-sm">
                                <MapPin size={14} className="text-blue-500" />
                                <span>{activity.metadata.miles} miles</span>
                              </div>
                            )}
                            {activity.metadata.earnings && (
                              <div className="flex items-center gap-1 px-3 py-1 bg-neutral-800 rounded-full text-sm">
                                <Briefcase size={14} className="text-green-500" />
                                <span>${activity.metadata.earnings}</span>
                              </div>
                            )}
                            {activity.metadata.route && (
                              <div className="flex items-center gap-1 px-3 py-1 bg-neutral-800 rounded-full text-sm">
                                <MapPin size={14} className="text-purple-500" />
                                <span>{activity.metadata.route}</span>
                              </div>
                            )}
                            {activity.metadata.achievement && (
                              <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-full text-sm">
                                <Award size={14} className="text-yellow-500" />
                                <span>{activity.metadata.achievement}</span>
                              </div>
                            )}
                            {activity.metadata.level && (
                              <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-full text-sm">
                                <Zap size={14} className="text-red-500" />
                                <span>Level {activity.metadata.level}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-6 text-neutral-400">
                          <button
                            onClick={() => handleLike(activity.id)}
                            className={`flex items-center gap-2 hover:text-red-500 transition ${
                              activity.isLiked ? 'text-red-500' : ''
                            }`}
                          >
                            <Heart size={18} fill={activity.isLiked ? 'currentColor' : 'none'} />
                            <span className="text-sm">{activity.likes}</span>
                          </button>
                          
                          <button className="flex items-center gap-2 hover:text-blue-500 transition">
                            <MessageCircle size={18} />
                            <span className="text-sm">{activity.comments}</span>
                          </button>
                          
                          <button className="flex items-center gap-2 hover:text-green-500 transition">
                            <Share2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Load More */}
        {!loading && activities.length > 0 && (
          <div className="text-center mt-8">
            <button className="px-6 py-3 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition font-medium">
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
