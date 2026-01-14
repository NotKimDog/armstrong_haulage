"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { 
  TrendingUp, 
  Users, 
  Activity, 
  Truck, 
  Award,
  Clock,
  MapPin,
  DollarSign,
  Target,
  BarChart3
} from 'lucide-react';

// Chart.js imports removed to avoid dependency issues
// Using placeholder charts instead

interface UserStats {
  totalMiles: number;
  totalJobs: number;
  totalEarnings: number;
  avgRating: number;
  activeTime: number;
  favoriteRoute: string;
  completionRate: number;
  rank: number;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  timestamp: number;
  miles?: number;
  earnings?: number;
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await fetchAnalytics(user.uid);
      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, timeRange]);

  const fetchAnalytics = async (userId: string) => {
    try {
      const statsRes = await fetch(`/api/user/stats/${userId}`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      const activityRes = await fetch(`/api/user/activity/${userId}`);
      if (activityRes.ok) {
        const activityData = await activityRes.json();
        setRecentActivity(activityData);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white pt-32">
      {/* Header */}
      <div className="bg-neutral-900 border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <BarChart3 className="text-blue-500" size={32} />
                Analytics Dashboard
              </h1>
              <p className="text-neutral-400 mt-1">Track your performance and progress</p>
            </div>
            <div className="flex gap-2">
              {(['week', 'month', 'year'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-lg transition ${
                    timeRange === range
                      ? 'bg-blue-600 text-white'
                      : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <Truck size={32} className="text-blue-100" />
              <span className="text-blue-100 text-sm font-medium">+12%</span>
            </div>
            <div className="text-3xl font-bold mb-1">{stats?.totalMiles?.toLocaleString() || 0}</div>
            <div className="text-blue-100 text-sm">Total Miles Driven</div>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <Award size={32} className="text-green-100" />
              <span className="text-green-100 text-sm font-medium">+8%</span>
            </div>
            <div className="text-3xl font-bold mb-1">{stats?.totalJobs?.toLocaleString() || 0}</div>
            <div className="text-green-100 text-sm">Jobs Completed</div>
          </div>

          <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <DollarSign size={32} className="text-purple-100" />
              <span className="text-purple-100 text-sm font-medium">+15%</span>
            </div>
            <div className="text-3xl font-bold mb-1">${stats?.totalEarnings?.toLocaleString() || 0}</div>
            <div className="text-purple-100 text-sm">Total Earnings</div>
          </div>

          <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <Target size={32} className="text-orange-100" />
              <span className="text-orange-100 text-sm font-medium">Rank #{stats?.rank || 0}</span>
            </div>
            <div className="text-3xl font-bold mb-1">{stats?.avgRating?.toFixed(1) || 0}★</div>
            <div className="text-orange-100 text-sm">Average Rating</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Performance Overview */}
          <div className="lg:col-span-2 bg-neutral-900 rounded-lg p-6 border border-neutral-800">
            <h3 className="text-xl font-bold mb-6">Performance Overview</h3>
            <div className="h-64 flex items-center justify-center text-neutral-500">
              <div className="text-center">
                <TrendingUp size={48} className="mx-auto mb-4 text-neutral-700" />
                <p>Chart visualization would go here</p>
                <p className="text-sm mt-2">Install chart library for full visualization</p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-neutral-900 rounded-lg p-6 border border-neutral-800">
            <h3 className="text-xl font-bold mb-6">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="text-blue-500" size={20} />
                  <span className="text-sm">Active Time</span>
                </div>
                <span className="font-bold">{Math.floor((stats?.activeTime || 0) / 60)}h</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <MapPin className="text-green-500" size={20} />
                  <span className="text-sm">Favorite Route</span>
                </div>
                <span className="font-bold text-sm">{stats?.favoriteRoute || 'N/A'}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Target className="text-purple-500" size={20} />
                  <span className="text-sm">Completion Rate</span>
                </div>
                <span className="font-bold">{stats?.completionRate || 0}%</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Users className="text-orange-500" size={20} />
                  <span className="text-sm">Global Rank</span>
                </div>
                <span className="font-bold">#{stats?.rank || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-neutral-900 rounded-lg p-6 border border-neutral-800">
          <h3 className="text-xl font-bold mb-6">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-4 p-4 bg-neutral-800 rounded-lg">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Activity size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{activity.description}</p>
                    <p className="text-sm text-neutral-400">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                  {activity.miles && (
                    <div className="text-right">
                      <p className="font-bold text-blue-500">{activity.miles} mi</p>
                      {activity.earnings && (
                        <p className="text-sm text-green-500">${activity.earnings}</p>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-neutral-500">
                <Activity size={48} className="mx-auto mb-4 text-neutral-700" />
                <p>No recent activity</p>
                <p className="text-sm mt-2">Start driving to see your activity here</p>
              </div>
            )}
          </div>
        </div>

        {/* Goals & Achievements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <div className="bg-neutral-900 rounded-lg p-6 border border-neutral-800">
            <h3 className="text-xl font-bold mb-6">Weekly Goals</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Miles Goal</span>
                  <span className="text-sm font-bold">750/1000 mi</span>
                </div>
                <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Jobs Goal</span>
                  <span className="text-sm font-bold">12/15 jobs</span>
                </div>
                <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                  <div className="h-full bg-green-600 rounded-full" style={{ width: '80%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Earnings Goal</span>
                  <span className="text-sm font-bold">$4,500/$5,000</span>
                </div>
                <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-600 rounded-full" style={{ width: '90%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-neutral-900 rounded-lg p-6 border border-neutral-800">
            <h3 className="text-xl font-bold mb-6">Recent Achievements</h3>
            <div className="space-y-3">
              {[
                { name: '1000 Miles', icon: '🚚', date: '2 days ago' },
                { name: 'Perfect Week', icon: '⭐', date: '1 week ago' },
                { name: 'Speed Demon', icon: '⚡', date: '2 weeks ago' },
              ].map((achievement, i) => (
                <div key={i} className="flex items-center gap-4 p-3 bg-neutral-800 rounded-lg">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                    {achievement.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{achievement.name}</p>
                    <p className="text-sm text-neutral-400">{achievement.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
