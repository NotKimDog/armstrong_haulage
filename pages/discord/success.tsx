"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DiscordSuccess() {
  const router = useRouter();

  useEffect(() => {
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

          // Helpful console log for local debug while developing
          console.log('Discord success: mapped user ->', mapped);
        } catch (e) {
          console.error('Failed to parse discord_user payload', e);
        }
      }
    } catch (e) {
      console.error(e);
    }

    // Navigate to home without query params
    router.replace('/');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-neutral-900 text-white p-8 rounded-lg">Signing you in…</div>
    </div>
  );
}
