"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "../../app/api/lib/firebase";

export default function DiscordSuccess() {
  const router = useRouter();

  useEffect(() => {
    const processAuth = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        
        // Try to get the new auth_data (contains token)
        const authDataParam = params.get('auth_data');
        if (authDataParam) {
          try {
            const decoded = atob(decodeURIComponent(authDataParam));
            const authData = JSON.parse(decoded);
            const { user, token, discordData } = authData;

            console.log('Discord success - received auth token for user:', user.uid);

            // Store user info in localStorage
            const mapped = {
              displayName: user.displayName,
              email: user.email,
              photoURL: user.photoURL,
              uid: user.uid,
            };
            try {
              localStorage.setItem('user', JSON.stringify(mapped));
            } catch {}

            // Dispatch auth event
            try {
              window.dispatchEvent(new CustomEvent('auth-change', { detail: mapped }));
            } catch {}

            // Store auth token in localStorage for persistence
            try {
              localStorage.setItem('authToken', token);
            } catch {}

            // Redirect to home or profile
            setTimeout(() => {
              router.replace('/');
            }, 500);
          } catch (e) {
            console.error('Failed to parse auth_data payload', e);
            router.replace('/login');
          }
          return;
        }

        // Fallback: try old discord_user param (for backward compatibility)
        const discordUserParam = params.get('discord_user');
        if (discordUserParam) {
          try {
            const decoded = atob(decodeURIComponent(discordUserParam));
            const parsed = JSON.parse(decoded);
            const photoURL = parsed.avatar_url || parsed.avatar || undefined;
            const mapped = {
              displayName: parsed.username ? `${parsed.username}#${parsed.discriminator}` : parsed.id,
              email: parsed.email || undefined,
              photoURL,
              uid: parsed.id,
            };
            try {
              localStorage.setItem('user', JSON.stringify(mapped));
            } catch {}

            try {
              window.dispatchEvent(new CustomEvent('auth-change', { detail: mapped }));
            } catch {}

            console.log('Discord success: using legacy mode');
            setTimeout(() => {
              router.replace('/profile');
            }, 500);
          } catch (e) {
            console.error('Failed to parse discord_user payload', e);
            router.replace('/login');
          }
          return;
        }

        // No auth data found
        router.replace('/login');
      } catch (e) {
        console.error('Discord success error:', e);
        router.replace('/login');
      }
    };

    processAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-neutral-900 text-white p-8 rounded-lg">Signing you in…</div>
    </div>
  );
}
