import { NextApiRequest, NextApiResponse } from 'next';

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

    // Call our OAuth sign-in endpoint to create/signin user in Firebase
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const host = req.headers.host || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    const oauthSignInRes = await fetch(`${baseUrl}/api/auth/oauth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email || `discord_${user.id}@armstronghaulage.com`,
        displayName: user.username,
        photoURL: avatarUrl,
        provider: 'discord',
        providerId: user.id,
      }),
    });

    if (!oauthSignInRes.ok) {
      const errorText = await oauthSignInRes.text();
      console.error('Failed to sign in with Discord:', errorText);
      res.status(500).send('Failed to sign in with Discord');
      return;
    }

    const authData = await oauthSignInRes.json();

    // Encode the response data to pass to success page
    const payload = encodeURIComponent(
      Buffer.from(
        JSON.stringify({
          user: authData.user,
          token: authData.token,
          discordData: {
            id: user.id,
            username: user.username,
            avatar: avatarUrl,
          },
        })
      ).toString('base64')
    );

    // Redirect to success page with auth token
    res.redirect(`/discord/success?auth_data=${payload}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Unexpected error');
  }
}
