import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/twitch/callback`;

  if (!clientId || !redirectUri) {
    res.status(500).send('TWITCH_CLIENT_ID or redirect URI is not configured.');
    return;
  }

  const scope = encodeURIComponent('user:read:email');
  const url = `https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=${clientId}&scope=${scope}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}`;

  // Redirect the user to Twitch's OAuth2 authorization page
  res.redirect(url);
}
