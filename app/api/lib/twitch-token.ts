let cachedToken: string | null = null;
let tokenExpiry = 0;

export async function getTwitchAppToken(): Promise<string | null> {
  const now = Date.now();
  if (cachedToken && now < tokenExpiry) return cachedToken;

  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  try {
    const res = await fetch(
      `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
      { method: 'POST', cache: 'no-store' }
    );
    if (!res.ok) return null;
    const data = await res.json();
    cachedToken = data.access_token;
    // expires_in is in seconds
    tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // 60s buffer
    return cachedToken;
  } catch (err) {
    console.error('Error fetching Twitch token:', err);
    return null;
  }
}
