"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../app/api/lib/firebase";

export default function DiscordSuccess() {
  const router = useRouter();

  useEffect(() => {
    const saveConnection = async (userId: string, discordData: any) => {
      try {
        const photoURL = discordData.avatar_url || discordData.avatar || undefined;
        const response = await fetch(`/api/user/connections/${userId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platform: 'discord',
            connection: {
              id: discordData.id,
              username: discordData.username || discordData.id,
              avatar: photoURL,
            },
          }),
        });
        
        console.log('Discord connection API response:', response.status);
        if (response.ok) {
          console.log('Discord connection saved to profile');
        } else {
          const errorText = await response.text();
          console.error('Failed to save Discord connection:', response.status, errorText);
        }
      } catch (error) {
        console.error('Error saving Discord connection:', error);
      } finally {
        // Redirect to profile to see the connection
        console.log('Discord - redirecting to profile');
        setTimeout(() => router.replace('/profile'), 1000);
      }
    };

    try {
      const params = new URLSearchParams(window.location.search);
      const du = params.get('discord_user');
      if (du) {
        try {
          const decoded = atob(decodeURIComponent(du));
          const parsed = JSON.parse(decoded);
          const photoURL = parsed.avatar_url || parsed.avatar || undefined;
          const mapped = { displayName: parsed.username ? `${parsed.username}#${parsed.discriminator}` : parsed.id, email: parsed.email || undefined, photoURL, uid: parsed.id };
          try { localStorage.setItem('user', JSON.stringify(mapped)); } catch {}

          // Small debug flag to help diagnose cross-origin/redirect issues
          try { localStorage.setItem('discord_last', JSON.stringify({ time: Date.now(), userId: mapped.uid })); } catch {}

          // Notify other listeners in this tab. Emit both events so consumers listening
          // for either 'discord-auth' or generic 'auth-change' will react.
          try { window.dispatchEvent(new CustomEvent('discord-auth', { detail: mapped })); } catch {}
          try { window.dispatchEvent(new CustomEvent('auth-change', { detail: mapped })); } catch {}

          console.log('Discord success: mapped user ->', mapped);

          // Check if user is already authenticated in Firebase
          const currentUser = auth.currentUser;
          if (currentUser) {
            console.log('Discord - current user already authenticated:', currentUser.uid);
            saveConnection(currentUser.uid, parsed);
          } else {
            console.log('Discord - no current user, waiting for auth state...');
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
              console.log('Discord success - auth state changed, user:', user?.uid);
              if (user && !completed) {
                completed = true;
                clearTimeout(timeout);
                console.log('Discord - user authenticated, saving connection for user:', user.uid);
                if (unsubscribe) unsubscribe();
                saveConnection(user.uid, parsed);
              }
            });
          }
        } catch (e) {
          console.error('Failed to parse discord_user payload', e);
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
