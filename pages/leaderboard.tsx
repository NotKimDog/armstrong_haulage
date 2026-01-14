"use client";
import { useEffect, useState } from 'react';
import { Trophy, Medal, TrendingUp, Truck, Award, Star, Crown } from 'lucide-react';
import { motion } from 'framer-motion';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  photoURL?: string;
  totalMiles: number;
  totalJobs: number;
  totalEarnings: number;
  avgRating: number;
  level: number;
  change: number; // Position change from last week
}

type LeaderboardCategory = 'miles' | 'jobs' | 'earnings' | 'rating';

export default function LeaderboardPage() {
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [category, setCategory] = useState<LeaderboardCategory>('miles');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'allTime'>('month');

  useEffect(() => {
    fetchLeaderboard();
  }, [category, timeRange]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/leaderboard?category=${category}&range=${timeRange}`);
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (cat: LeaderboardCategory) => {
    const labels = {
      miles: 'Total Miles',
      jobs: 'Jobs Completed',
      earnings: 'Total Earnings',
      rating: 'Average Rating'
    };
    return labels[cat];
  };

  const getCategoryValue = (entry: LeaderboardEntry, cat: LeaderboardCategory) => {
    switch (cat) {
      case 'miles':
        return `${entry.totalMiles.toLocaleString()} mi`;
      case 'jobs':
        return `${entry.totalJobs} jobs`;
      case 'earnings':
        return `$${entry.totalEarnings.toLocaleString()}`;
      case 'rating':
        return `${entry.avgRating.toFixed(1)} ★`;
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="text-yellow-400" size={24} />;
    if (rank === 2) return <Medal className="text-gray-400" size={24} />;
    if (rank === 3) return <Medal className="text-orange-400" size={24} />;
    return null;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/50';
    if (rank === 2) return 'from-gray-400/20 to-gray-500/20 border-gray-400/50';
    if (rank === 3) return 'from-orange-400/20 to-orange-500/20 border-orange-400/50';
    return 'from-neutral-800/50 to-neutral-900/50 border-neutral-700/50';
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white pt-32">
      {/* Header */}
      <div className="bg-gradient-to-r from-neutral-900 via-red-900/20 to-neutral-900 border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="inline-block mb-4"
            >
              <Trophy className="text-yellow-400" size={64} />
            </motion.div>
            <h1 className="text-4xl font-bold mb-2">Leaderboard</h1>
            <p className="text-neutral-400 text-lg">Compete with the best drivers worldwide</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-8 space-y-4">
          {/* Category Selection */}
          <div className="flex flex-wrap gap-3 justify-center">
            {(['miles', 'jobs', 'earnings', 'rating'] as LeaderboardCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition ${
                  category === cat
                    ? 'bg-red-600 text-white'
                    : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                }`}
              >
                {cat === 'miles' && <Truck size={20} />}
                {cat === 'jobs' && <Award size={20} />}
                {cat === 'earnings' && <TrendingUp size={20} />}
                {cat === 'rating' && <Star size={20} />}
                {getCategoryLabel(cat)}
              </button>
            ))}
          </div>

          {/* Time Range Selection */}
          <div className="flex gap-2 justify-center">
            {(['week', 'month', 'allTime'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg transition ${
                  timeRange === range
                    ? 'bg-neutral-700 text-white'
                    : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                }`}
              >
                {range === 'week' && 'This Week'}
                {range === 'month' && 'This Month'}
                {range === 'allTime' && 'All Time'}
              </button>
            ))}
          </div>
        </div>

        {/* Top 3 Podium */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {leaderboard.slice(0, 3).map((entry, index) => {
            const podiumOrder = [1, 0, 2]; // Second place, First place, Third place
            const realIndex = podiumOrder.indexOf(index);
            const realEntry = leaderboard[realIndex];
            if (!realEntry) return null;

            return (
              <motion.div
                key={realEntry.userId}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative ${index === 1 ? 'md:-mt-8' : ''}`}
              >
                <div className={`bg-gradient-to-br ${getRankColor(realEntry.rank)} border rounded-lg p-6 text-center`}>
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    {getRankIcon(realEntry.rank)}
                  </div>
                  
                  <div className="w-24 h-24 bg-neutral-700 rounded-full mx-auto mb-4 mt-2 overflow-hidden">
                    {realEntry.photoURL ? (
                      <img src={realEntry.photoURL} alt={realEntry.displayName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl font-bold">
                        {realEntry.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  
                  <div className={`text-6xl font-bold mb-2 ${
                    realEntry.rank === 1 ? 'text-yellow-400' :
                    realEntry.rank === 2 ? 'text-gray-400' :
                    'text-orange-400'
                  }`}>
                    #{realEntry.rank}
                  </div>
                  
                  <h3 className="text-xl font-bold mb-1">{realEntry.displayName}</h3>
                  <div className="text-2xl font-bold text-red-500 mb-2">
                    {getCategoryValue(realEntry, category)}
                  </div>
                  
                  <div className="flex items-center justify-center gap-2 text-sm text-neutral-400">
                    <span className="px-2 py-1 bg-neutral-700 rounded">Level {realEntry.level}</span>
                    {realEntry.change !== 0 && (
                      <span className={`flex items-center gap-1 ${
                        realEntry.change > 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        <TrendingUp size={16} className={realEntry.change < 0 ? 'rotate-180' : ''} />
                        {Math.abs(realEntry.change)}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Full Leaderboard */}
        <div className="bg-neutral-900 rounded-lg border border-neutral-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-800 border-b border-neutral-700">
                <tr>
                  <th className="text-left px-6 py-4 font-semibold">Rank</th>
                  <th className="text-left px-6 py-4 font-semibold">Driver</th>
                  <th className="text-left px-6 py-4 font-semibold">Level</th>
                  <th className="text-right px-6 py-4 font-semibold">{getCategoryLabel(category)}</th>
                  <th className="text-right px-6 py-4 font-semibold">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-neutral-500">
                      Loading leaderboard...
                    </td>
                  </tr>
                ) : leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-neutral-500">
                      No entries found
                    </td>
                  </tr>
                ) : (
                  leaderboard.map((entry, index) => (
                    <motion.tr
                      key={entry.userId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-neutral-800/50 transition"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getRankIcon(entry.rank)}
                          <span className={`text-2xl font-bold ${
                            entry.rank <= 3 ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500' : ''
                          }`}>
                            #{entry.rank}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-neutral-700 rounded-full overflow-hidden flex-shrink-0">
                            {entry.photoURL ? (
                              <img src={entry.photoURL} alt={entry.displayName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-lg font-bold">
                                {entry.displayName.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <span className="font-medium">{entry.displayName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-neutral-800 rounded-full text-sm font-medium">
                          Level {entry.level}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-lg font-bold text-red-500">
                          {getCategoryValue(entry, category)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {entry.change !== 0 ? (
                          <div className={`flex items-center justify-end gap-1 ${
                            entry.change > 0 ? 'text-green-500' : 'text-red-500'
                          }`}>
                            <TrendingUp size={16} className={entry.change < 0 ? 'rotate-180' : ''} />
                            <span className="font-medium">{Math.abs(entry.change)}</span>
                          </div>
                        ) : (
                          <span className="text-neutral-500">-</span>
                        )}
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
