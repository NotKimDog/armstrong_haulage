"use client";

import { useEffect, useState } from "react";

export default function DiscordDebug() {
  const [lsUser, setLsUser] = useState<any>(null);
  const [discordLast, setDiscordLast] = useState<any>(null);
  const [events, setEvents] = useState<string[]>([]);

  useEffect(() => {
    const read = () => {
      try { setLsUser(JSON.parse(localStorage.getItem('user') || 'null')); } catch { setLsUser(null); }
      try { setDiscordLast(JSON.parse(localStorage.getItem('discord_last') || 'null')); } catch { setDiscordLast(null); }
    };

    read();

    const handler = (e: Event) => {
      const d = (e as CustomEvent).detail;
      setEvents(prev => [`${new Date().toISOString()} -> ${JSON.stringify(d)}`].concat(prev).slice(0, 50));
      read();
    };

    window.addEventListener('discord-auth', handler as EventListener);
    window.addEventListener('auth-change', handler as EventListener);
    window.addEventListener('storage', () => read());

    return () => {
      window.removeEventListener('discord-auth', handler as EventListener);
      window.removeEventListener('auth-change', handler as EventListener);
      window.removeEventListener('storage', () => read());
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-4">Discord Debug</h1>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-neutral-900 p-4 rounded">
          <h2 className="font-semibold mb-2">localStorage.user</h2>
          <pre className="text-xs text-gray-300 max-h-64 overflow-auto">{JSON.stringify(lsUser, null, 2)}</pre>
        </div>
        <div className="bg-neutral-900 p-4 rounded">
          <h2 className="font-semibold mb-2">localStorage.discord_last</h2>
          <pre className="text-xs text-gray-300 max-h-64 overflow-auto">{JSON.stringify(discordLast, null, 2)}</pre>
        </div>
      </div>

      <div className="mt-6 bg-neutral-900 p-4 rounded">
        <h2 className="font-semibold mb-2">Recent Events</h2>
        <div className="text-xs text-gray-300 max-h-48 overflow-auto space-y-1">
          {events.length === 0 ? <div className="text-gray-500">No events yet. Trigger a Discord sign-in.</div> : events.map((e, i) => <div key={i} className="break-words">{e}</div>)}
        </div>
      </div>

      <div className="mt-6">
        <button onClick={() => { localStorage.removeItem('user'); localStorage.removeItem('discord_last'); setLsUser(null); setDiscordLast(null); setEvents([]); }} className="px-3 py-2 bg-red-600 rounded">Clear</button>
      </div>
    </div>
  );
}
