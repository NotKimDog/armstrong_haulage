import { NextApiRequest, NextApiResponse } from 'next';
import { getDatabase, ref as dbRef, update, get } from 'firebase/database';
import { initializeApp } from 'firebase/app';

// Initialize Firebase if needed
let app: any;
try {
  const { app: firebaseApp } = require('@/app/api/lib/firebase');
  app = firebaseApp;
} catch {
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

  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/twitch/callback`;

  if (!clientId || !clientSecret || !redirectUri) {
    res.status(500).send('Twitch OAuth env vars not configured');
    return;
  }

  try {
    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('grant_type', 'authorization_code');
    params.append('code', code as string);
    params.append('redirect_uri', redirectUri);

    console.log('Twitch token exchange - client_id:', clientId.substring(0, 10) + '...');

    const tokenRes = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!tokenRes.ok) {
      const txt = await tokenRes.text();
      console.error('Twitch token exchange failed:', txt);
      res.status(500).send('Token exchange failed: ' + txt);
      return;
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token as string | undefined;
    if (!accessToken) {
      res.status(500).send('No access token received');
      return;
    }

    console.log('Twitch token received, fetching user...');

    const userRes = await fetch('https://api.twitch.tv/helix/users', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Client-ID': clientId,
      },
    });

    if (!userRes.ok) {
      const txt = await userRes.text();
      console.error('Failed fetching Twitch user:', txt);
      res.status(500).send('Failed fetching Twitch user: ' + txt);
      return;
    }

    const userData = await userRes.json();
    const user = userData.data?.[0];
    if (!user) {
      res.status(500).send('No user data received');
      return;
    }

    const twitchUserData = {
      id: user.id,
      username: user.login,
      displayName: user.display_name,
      avatar: user.profile_image_url,
      connectedAt: new Date().toISOString(),
    };

    // Encode and redirect to success page
    const encodedData = Buffer.from(JSON.stringify(twitchUserData)).toString('base64');
    res.redirect(`/twitch/success?user=${encodedData}`);
  } catch (error) {
    console.error('Twitch OAuth error:', error);
    res.status(500).send('Internal server error');
  }
}
