import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = process.env.GITHUB_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    res.status(500).send('GITHUB_CLIENT_ID or GITHUB_REDIRECT_URI is not configured.');
    return;
  }

  const scope = encodeURIComponent('user:email');
  const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=${scope}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}`;

  res.redirect(url);
}
