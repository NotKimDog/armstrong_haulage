import { useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

export function useUserActivityTracking() {
  useEffect(() => {
    const auth = getAuth();
    let periodicIntervalRef: NodeJS.Timeout | null = null;

    const trackActivity = async (userId: string, status: string = 'online') => {
      try {
        // Update user's activity and status
        await fetch('/api/admin/active-users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, status }),
        });
      } catch (error) {
        console.error('Error tracking user activity:', error);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Track activity immediately on auth state change
        trackActivity(user.uid, 'online');

        // Set up periodic activity updates (every 90 seconds)
        // This is the ONLY source of updates to prevent spam
        periodicIntervalRef = setInterval(() => {
          trackActivity(user.uid, 'online');
        }, 90 * 1000);

        return () => {
          if (periodicIntervalRef) clearInterval(periodicIntervalRef);
        };
      } else {
        // User logged out
        if (periodicIntervalRef) clearInterval(periodicIntervalRef);
      }
    });

    return () => {
      unsubscribe();
      if (periodicIntervalRef) clearInterval(periodicIntervalRef);
    };
  }, []);
}
