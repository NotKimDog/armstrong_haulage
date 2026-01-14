"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { Award, Lock, Star, Trophy, Zap, Target, Crown, Shield, Truck, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'distance' | 'jobs' | 'time' | 'special' | 'rating';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirement: string;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  unlockedAt?: number;
  reward: {
    xp: number;
    credits?: number;
  };
}

export default function AchievementsPage() {
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await fetchAchievements(user.uid);
      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const fetchAchievements = async (userId: string) => {
    try {
      const res = await fetch(`/api/achievements/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setAchievements(data);
      }
    } catch (error) {
      console.error('Error fetching achievements:', error);
    }
  };

  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common':
        return 'from-gray-500 to-gray-600';
      case 'rare':
        return 'from-blue-500 to-blue-600';
      case 'epic':
        return 'from-purple-500 to-purple-600';
      case 'legendary':
        return 'from-yellow-500 to-orange-600';
    }
  };

  const getRarityBorder = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common':
        return 'border-gray-500/50';
      case 'rare':
        return 'border-blue-500/50';
      case 'epic':
        return 'border-purple-500/50';
      case 'legendary':
        return 'border-yellow-500/50';
    }
  };

  const getCategoryIcon = (category: Achievement['category']) => {
    switch (category) {
      case 'distance':
        return <MapPin size={16} />;
      case 'jobs':
        return <Truck size={16} />;
      case 'time':
        return <Zap size={16} />;
      case 'rating':
        return <Star size={16} />;
      case 'special':
        return <Trophy size={16} />;
    }
  };

  const filteredAchievements = achievements.filter(achievement => {
    if (filter === 'unlocked' && !achievement.unlocked) return false;
    if (filter === 'locked' && achievement.unlocked) return false;
    if (categoryFilter !== 'all' && achievement.category !== categoryFilter) return false;
    return true;
  });

  const stats = {
    total: achievements.length,
    unlocked: achievements.filter(a => a.unlocked).length,
    progress: Math.round((achievements.filter(a => a.unlocked).length / achievements.length) * 100) || 0
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white pt-32">
      {/* Header */}
      <div className="bg-gradient-to-r from-neutral-900 via-yellow-900/20 to-neutral-900 border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="inline-block mb-4"
            >
              <Trophy className="text-yellow-400" size={64} />
            </motion.div>
            <h1 className="text-4xl font-bold mb-2">Achievements</h1>
            <p className="text-neutral-400 text-lg mb-6">
              Complete challenges and unlock exclusive rewards
            </p>

            {/* Progress Stats */}
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-8 mb-4">
                <div>
                  <div className="text-3xl font-bold text-yellow-400">{stats.unlocked}</div>
                  <div className="text-sm text-neutral-400">Unlocked</div>
                </div>
                <div className="text-neutral-700">|</div>
                <div>
                  <div className="text-3xl font-bold">{stats.total}</div>
                  <div className="text-sm text-neutral-400">Total</div>
                </div>
                <div className="text-neutral-700">|</div>
                <div>
                  <div className="text-3xl font-bold text-green-400">{stats.progress}%</div>
                  <div className="text-sm text-neutral-400">Complete</div>
                </div>
              </div>

              <div className="h-3 bg-neutral-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.progress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-yellow-500 to-orange-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-wrap gap-3 justify-center">
            {(['all', 'unlocked', 'locked'] as const).map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`px-6 py-2 rounded-lg font-medium transition ${
                  filter === filterType
                    ? 'bg-yellow-600 text-white'
                    : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                }`}
              >
                {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            {(['all', 'distance', 'jobs', 'time', 'rating', 'special'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition ${
                  categoryFilter === cat
                    ? 'bg-neutral-700 text-white'
                    : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                }`}
              >
                {cat !== 'all' && getCategoryIcon(cat as Achievement['category'])}
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-12">
              <div className="text-neutral-500">Loading achievements...</div>
            </div>
          ) : filteredAchievements.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-neutral-900 rounded-lg border border-neutral-800">
              <Award size={48} className="mx-auto mb-4 text-neutral-700" />
              <p className="text-neutral-400">No achievements found</p>
            </div>
          ) : (
            filteredAchievements.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`relative bg-neutral-900 rounded-lg border-2 p-6 ${
                  achievement.unlocked
                    ? getRarityBorder(achievement.rarity)
                    : 'border-neutral-800'
                } ${!achievement.unlocked ? 'opacity-60' : ''}`}
              >
                {/* Rarity Badge */}
                <div className={`absolute top-3 right-3 px-2 py-1 rounded text-xs font-bold bg-gradient-to-r ${getRarityColor(achievement.rarity)}`}>
                  {achievement.rarity.toUpperCase()}
                </div>

                {/* Icon */}
                <div className="mb-4">
                  <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${getRarityColor(achievement.rarity)} flex items-center justify-center text-4xl mx-auto ${
                    !achievement.unlocked ? 'grayscale' : ''
                  }`}>
                    {achievement.unlocked ? achievement.icon : <Lock size={32} />}
                  </div>
                </div>

                {/* Content */}
                <div className="text-center">
                  <h3 className="text-xl font-bold mb-2">{achievement.name}</h3>
                  <p className="text-sm text-neutral-400 mb-4">{achievement.description}</p>

                  {/* Category Badge */}
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <span className="flex items-center gap-1 px-3 py-1 bg-neutral-800 rounded-full text-xs">
                      {getCategoryIcon(achievement.category)}
                      {achievement.category}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  {!achievement.unlocked && (
                    <div className="mb-4">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-neutral-400">Progress</span>
                        <span className="font-bold">
                          {achievement.progress}/{achievement.maxProgress}
                        </span>
                      </div>
                      <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${getRarityColor(achievement.rarity)}`}
                          style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Unlocked Date */}
                  {achievement.unlocked && achievement.unlockedAt && (
                    <div className="text-xs text-green-500 mb-4">
                      ✓ Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </div>
                  )}

                  {/* Rewards */}
                  <div className="flex items-center justify-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Zap size={16} className="text-yellow-500" />
                      <span className="font-bold">{achievement.reward.xp} XP</span>
                    </div>
                    {achievement.reward.credits && (
                      <div className="flex items-center gap-1">
                        <Crown size={16} className="text-green-500" />
                        <span className="font-bold">{achievement.reward.credits} Credits</span>
                      </div>
                    )}
                  </div>

                  {/* Requirement */}
                  <div className="mt-4 pt-4 border-t border-neutral-800">
                    <p className="text-xs text-neutral-500">{achievement.requirement}</p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
