import { NextApiRequest, NextApiResponse } from 'next';
import { getDatabase, ref as dbRef, update, get } from 'firebase/database';
import { initializeApp } from 'firebase/app';

// Initialize Firebase if needed
let app: any;
try {
  // Try to use existing app from firebase config
  const { app: firebaseApp } = require('@/app/api/lib/firebase');
  app = firebaseApp;
} catch {
  // Fallback if needed
  const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  };
  app = initializeApp(firebaseConfig);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const code = Array.isArray(req.query.code) ? req.query.code[0] : req.query.code;
  if (!code) {
    res.status(400).send('Missing code');
    return;
  }

  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    res.status(500).send('Discord OAuth env vars not configured');
    return;
  }

  try {
    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('grant_type', 'authorization_code');
    params.append('code', code as string);
    params.append('redirect_uri', redirectUri);

    console.log('Discord token exchange - client_id:', clientId.substring(0, 10) + '...');

    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!tokenRes.ok) {
      const txt = await tokenRes.text();
      console.error('Discord token exchange failed:', txt);
      res.status(500).send('Token exchange failed: ' + txt);
      return;
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token as string | undefined;
    if (!accessToken) {
      res.status(500).send('No access token received');
      return;
    }

    console.log('Discord token received, fetching user...');

    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userRes.ok) {
      const txt = await userRes.text();
      console.error('Failed fetching Discord user:', txt);
      res.status(500).send('Failed fetching Discord user: ' + txt);
      return;
    }

    const user = await userRes.json();
    console.log('Discord user fetched:', user.id, user.username);

    // Build a usable avatar URL (handles animated avatars and defaults)
    let avatarUrl: string | null = null;
    try {
      if (user.avatar) {
        const isAnimated = String(user.avatar).startsWith('a_');
        const ext = isAnimated ? 'gif' : 'png';
        avatarUrl = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}?size=128`;
      } else if (user.discriminator !== undefined && user.discriminator !== null) {
        const idx = parseInt(user.discriminator, 10) % 5;
        avatarUrl = `https://cdn.discordapp.com/embed/avatars/${idx}.png?size=128`;
      }
    } catch (e) {
      avatarUrl = null;
    }

    // For now we simply redirect to frontend with a base64-encoded payload.
    // Include avatarUrl so the client can immediately show a profile picture.
    // TODO: Exchange this for a server session / Firebase custom token to sign the user in.
    const payloadObj: Record<string, unknown> = {
      id: user.id,
      username: user.username,
      discriminator: user.discriminator,
    };
    if (avatarUrl) payloadObj.avatar_url = avatarUrl;

    const payload = encodeURIComponent(Buffer.from(JSON.stringify(payloadObj)).toString('base64'));

    // Redirect to a small client page that will store the discord payload in localStorage
    res.redirect(`/discord/success?discord_user=${payload}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Unexpected error');
  }
}
