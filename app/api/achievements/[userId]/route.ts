import { NextRequest, NextResponse } from 'next/server';

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    // For now, return mock achievements
    // In production, fetch from Firebase based on userId
    const achievements: Achievement[] = [
      {
        id: '1',
        name: 'First Steps',
        description: 'Complete your first delivery',
        icon: '🚚',
        category: 'jobs',
        rarity: 'common',
        requirement: 'Complete 1 job',
        progress: 1,
        maxProgress: 1,
        unlocked: true,
        unlockedAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
        reward: { xp: 100 }
      },
      {
        id: '2',
        name: 'Road Warrior',
        description: 'Complete 100 deliveries',
        icon: '⚔️',
        category: 'jobs',
        rarity: 'rare',
        requirement: 'Complete 100 jobs',
        progress: 75,
        maxProgress: 100,
        unlocked: false,
        reward: { xp: 1000, credits: 500 }
      },
      {
        id: '3',
        name: 'Long Hauler',
        description: 'Drive 1,000 miles',
        icon: '🛣️',
        category: 'distance',
        rarity: 'common',
        requirement: 'Drive 1,000 miles total',
        progress: 1000,
        maxProgress: 1000,
        unlocked: true,
        unlockedAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
        reward: { xp: 500 }
      },
      {
        id: '4',
        name: 'Cross Country',
        description: 'Drive 10,000 miles',
        icon: '🌎',
        category: 'distance',
        rarity: 'epic',
        requirement: 'Drive 10,000 miles total',
        progress: 6750,
        maxProgress: 10000,
        unlocked: false,
        reward: { xp: 2500, credits: 1000 }
      },
      {
        id: '5',
        name: 'Perfect Rating',
        description: 'Maintain 5-star rating for 50 jobs',
        icon: '⭐',
        category: 'rating',
        rarity: 'epic',
        requirement: 'Complete 50 jobs with 5-star ratings',
        progress: 28,
        maxProgress: 50,
        unlocked: false,
        reward: { xp: 3000, credits: 1500 }
      },
      {
        id: '6',
        name: 'Speed Demon',
        description: 'Complete a job in record time',
        icon: '⚡',
        category: 'time',
        rarity: 'rare',
        requirement: 'Complete any job 30% faster than estimated',
        progress: 0,
        maxProgress: 1,
        unlocked: false,
        reward: { xp: 750, credits: 300 }
      },
      {
        id: '7',
        name: 'Night Owl',
        description: 'Complete 25 deliveries at night',
        icon: '🦉',
        category: 'special',
        rarity: 'rare',
        requirement: 'Complete 25 jobs between 10 PM and 6 AM',
        progress: 12,
        maxProgress: 25,
        unlocked: false,
        reward: { xp: 1500, credits: 750 }
      },
      {
        id: '8',
        name: 'Legendary Driver',
        description: 'Reach level 50',
        icon: '👑',
        category: 'special',
        rarity: 'legendary',
        requirement: 'Reach driver level 50',
        progress: 23,
        maxProgress: 50,
        unlocked: false,
        reward: { xp: 10000, credits: 5000 }
      },
      {
        id: '9',
        name: 'Marathon Runner',
        description: 'Drive for 100 hours',
        icon: '🏃',
        category: 'time',
        rarity: 'epic',
        requirement: 'Accumulate 100 hours of driving time',
        progress: 67,
        maxProgress: 100,
        unlocked: false,
        reward: { xp: 2000, credits: 1000 }
      },
      {
        id: '10',
        name: 'Early Bird',
        description: 'Complete 10 morning deliveries',
        icon: '🌅',
        category: 'special',
        rarity: 'common',
        requirement: 'Complete 10 jobs between 5 AM and 9 AM',
        progress: 10,
        maxProgress: 10,
        unlocked: true,
        unlockedAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
        reward: { xp: 300 }
      },
      {
        id: '11',
        name: 'Million Mile Club',
        description: 'Drive 1,000,000 miles',
        icon: '💎',
        category: 'distance',
        rarity: 'legendary',
        requirement: 'Drive 1,000,000 miles total',
        progress: 6750,
        maxProgress: 1000000,
        unlocked: false,
        reward: { xp: 50000, credits: 25000 }
      },
      {
        id: '12',
        name: 'Streak Master',
        description: 'Complete deliveries for 30 days straight',
        icon: '🔥',
        category: 'time',
        rarity: 'epic',
        requirement: 'Complete at least one job daily for 30 consecutive days',
        progress: 14,
        maxProgress: 30,
        unlocked: false,
        reward: { xp: 5000, credits: 2500 }
      }
    ];

    return NextResponse.json(achievements);
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 });
  }
}
