"use client";
import { useEffect, useState, useCallback } from 'react';
import LandingPage from '../components/LandingPage';

const CACHE_KEY = 'trucky_stats_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export default function Page() {
  const [miles, setMiles] = useState(0);
  const [members, setMembers] = useState(0);

  const fetchTruckyStats = useCallback(async () => {
    try {
      // Check cache first
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          setMiles(data.miles);
          setMembers(data.members);
          return;
        }
      }

      const res = await fetch('https://api.truckyapp.com/v1/vtc/public/company/40764', { 
        cache: 'no-store',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      if (!res.ok) return;
      const data = await res.json();
      const stats = data?.response;
      const kilometers = stats?.total_driven_distance || 0;
      const milesValue = Math.floor(kilometers * 0.621371);
      const membersValue = stats?.members_count || 0;
      
      // Cache the data
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: { miles: milesValue, members: membersValue },
        timestamp: Date.now()
      }));
      
      setMiles(milesValue);
      setMembers(membersValue);
    } catch (error) {
      console.error('Error fetching Trucky stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchTruckyStats();
  }, [fetchTruckyStats]);

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans">
      <LandingPage miles={miles} members={members} />
    </div>
  );
}
