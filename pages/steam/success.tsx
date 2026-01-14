"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../app/api/lib/firebase";

export default function SteamSuccess() {
  const router = useRouter();

  useEffect(() => {
    const saveConnection = async (userId: string, steamData: any) => {
      try {
        const photoURL = steamData.avatar_url || undefined;
        const response = await fetch(`/api/user/connections/${userId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platform: 'steam',
            connection: {
              id: steamData.id,
              username: steamData.username || steamData.id,
              avatar: photoURL,
            },
          }),
        });
        
        if (response.ok) {
          console.log('Steam connection saved to profile');
        } else {
          console.error('Failed to save Steam connection');
        }
      } catch (error) {
        console.error('Error saving Steam connection:', error);
      } finally {
        // Redirect to profile to see the connection
        setTimeout(() => router.replace('/profile'), 1000);
      }
    };

    try {
      const params = new URLSearchParams(window.location.search);
      const su = params.get('steam_user');
      if (su) {
        try {
          const decoded = atob(decodeURIComponent(su));
          const parsed = JSON.parse(decoded);
          const photoURL = parsed.avatar_url || undefined;

          console.log('Steam success: user ->', parsed);

          // Check if user is already authenticated in Firebase
          const currentUser = auth.currentUser;
          if (currentUser) {
            console.log('Steam - current user already authenticated:', currentUser.uid);
            saveConnection(currentUser.uid, parsed);
          } else {
            console.log('Steam - no current user, waiting for auth state...');
            // Wait for auth to be ready
            let unsubscribe: (() => void) | null = null;
            let completed = false;
            const timeout = setTimeout(() => {
              if (unsubscribe && !completed) {
                unsubscribe();
              }
              // If auth didn't load after 5 seconds, redirect anyway
              if (!completed) {
                console.warn('Auth timeout - redirecting');
                router.replace('/profile');
              }
            }, 5000);

            unsubscribe = onAuthStateChanged(auth, async (user) => {
              if (user && !completed) {
                completed = true;
                clearTimeout(timeout);
                if (unsubscribe) unsubscribe();
                saveConnection(user.uid, parsed);
              }
            });
          }
        } catch (e) {
          console.error('Failed to parse steam_user payload', e);
          router.replace('/profile');
        }
      } else {
        router.replace('/profile');
      }
    } catch (e) {
      console.error(e);
      router.replace('/profile');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-neutral-900 text-white p-8 rounded-lg">Signing you in…</div>
    </div>
  );
}
