import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const code = Array.isArray(req.query.code) ? req.query.code[0] : req.query.code;
  if (!code) return res.status(400).send('Missing code');

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const redirectUri = process.env.GITHUB_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return res.status(500).send('GitHub OAuth env vars not configured');
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const txt = await tokenRes.text();
      console.error('GitHub token exchange failed:', txt);
      return res.status(500).send('Token exchange failed');
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token as string | undefined;
    if (!accessToken) return res.status(500).send('No access token received');

    // Get user info
    const userRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userRes.ok) {
      const txt = await userRes.text();
      console.error('Failed fetching GitHub user:', txt);
      return res.status(500).send('Failed fetching GitHub user');
    }

    const user = await userRes.json();

    // Call our OAuth sign-in endpoint to create/signin user in Firebase
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const host = req.headers.host || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    const oauthSignInRes = await fetch(`${baseUrl}/api/auth/oauth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email || `github_${user.id}@armstronghaulage.com`,
        displayName: user.login,
        photoURL: user.avatar_url,
        provider: 'github',
      }),
    });

    if (!oauthSignInRes.ok) {
      const errorText = await oauthSignInRes.text();
      console.error('Failed to sign in with GitHub:', errorText);
      return res.status(500).send('Failed to sign in with GitHub');
    }

    const authData = await oauthSignInRes.json();

    // Encode the response data to pass to success page
    const payload = encodeURIComponent(
      Buffer.from(
        JSON.stringify({
          user: authData.user,
          token: authData.token,
          githubData: {
            id: user.id,
            username: user.login,
            avatar: user.avatar_url,
          },
        })
      ).toString('base64')
    );

    // Redirect to success page with auth token
    return res.redirect(`/github/success?auth_data=${payload}`);
  } catch (err) {
    console.error(err);
    return res.status(500).send('Unexpected error');
  }
}
