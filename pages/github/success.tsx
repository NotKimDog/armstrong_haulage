"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../app/api/lib/firebase";

export default function GitHubSuccess() {
  const router = useRouter();

  useEffect(() => {
    const saveConnection = async (userId: string, githubData: any) => {
      try {
        const photoURL = githubData.avatar_url || undefined;
        const response = await fetch(`/api/user/connections/${userId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platform: 'github',
            connection: {
              id: githubData.id,
              username: githubData.username || githubData.id,
              avatar: photoURL,
            },
          }),
        });
        
        if (response.ok) {
          console.log('GitHub connection saved to profile');
        } else {
          console.error('Failed to save GitHub connection');
        }
      } catch (error) {
        console.error('Error saving GitHub connection:', error);
      } finally {
        // Redirect to profile to see the connection
        setTimeout(() => router.replace('/profile'), 1000);
      }
    };

    try {
      const params = new URLSearchParams(window.location.search);
      const gu = params.get('github_user');
      if (gu) {
        try {
          const decoded = atob(decodeURIComponent(gu));
          const parsed = JSON.parse(decoded);
          const photoURL = parsed.avatar_url || undefined;
          
          console.log('GitHub success: user ->', parsed);

          // Check if user is already authenticated in Firebase
          const currentUser = auth.currentUser;
          if (currentUser) {
            console.log('GitHub - current user already authenticated:', currentUser.uid);
            saveConnection(currentUser.uid, parsed);
          } else {
            console.log('GitHub - no current user, waiting for auth state...');
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
          console.error('Failed to parse github_user payload', e);
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
