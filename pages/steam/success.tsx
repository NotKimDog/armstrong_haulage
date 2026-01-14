"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SteamSuccess() {
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
            const { user, token, steamData } = authData;

            console.log('Steam success - received auth token for user:', user.uid);

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

            // Redirect to home
            setTimeout(() => {
              router.replace('/');
            }, 500);
          } catch (e) {
            console.error('Failed to parse auth_data payload', e);
            router.replace('/login');
          }
          return;
        }

        // Fallback: try old steam_user param (for backward compatibility)
        const steamUserParam = params.get('steam_user');
        if (steamUserParam) {
          try {
            const decoded = atob(decodeURIComponent(steamUserParam));
            const parsed = JSON.parse(decoded);
            const photoURL = parsed.avatar_url || undefined;
            const mapped = {
              displayName: parsed.username,
              email: undefined,
              photoURL,
              uid: parsed.id,
            };
            try {
              localStorage.setItem('user', JSON.stringify(mapped));
            } catch {}

            try {
              window.dispatchEvent(new CustomEvent('auth-change', { detail: mapped }));
            } catch {}

            console.log('Steam success: using legacy mode');
            setTimeout(() => {
              router.replace('/profile');
            }, 500);
          } catch (e) {
            console.error('Failed to parse steam_user payload', e);
            router.replace('/login');
          }
          return;
        }

        // No auth data found
        router.replace('/login');
      } catch (e) {
        console.error('Steam success error:', e);
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
