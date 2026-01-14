import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = process.env.DISCORD_REDIRECT_URI; // e.g. https://yourdomain.com/api/auth/discord/callback

  if (!clientId || !redirectUri) {
    res.status(500).send('DISCORD_CLIENT_ID or DISCORD_REDIRECT_URI is not configured.');
    return;
  }

  const scope = encodeURIComponent('identify email');
  const url = `https://discord.com/api/oauth2/authorize?response_type=code&client_id=${clientId}&scope=${scope}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}`;

  // Redirect the user to Discord's OAuth2 authorization page
  res.redirect(url);
}
