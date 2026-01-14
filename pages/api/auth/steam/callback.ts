import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      'openid.ns': openidNs,
      'openid.op_endpoint': openidOpEndpoint,
      'openid.claimed_id': claimedId,
      'openid.identity': identity,
      'openid.return_to': returnTo,
      'openid.response_nonce': responseNonce,
      'openid.assoc_handle': assocHandle,
      'openid.signed': signed,
      'openid.sig': sig,
      'openid.mode': mode,
    } = req.query;

    if (mode === 'cancel') {
      res.redirect('/profile');
      return;
    }

    if (!claimedId || typeof claimedId !== 'string') {
      res.redirect('/profile');
      return;
    }

    // Extract Steam ID from the claimed_id URL
    // Format: https://steamcommunity.com/openid/id/STEAMID64
    const steamIdMatch = claimedId.match(/\/(\d+)$/);
    if (!steamIdMatch) {
      res.redirect('/profile');
      return;
    }

    const steamId = steamIdMatch[1];

    // Fetch Steam user profile
    const steamApiUrl = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${process.env.STEAM_API_KEY}&steamids=${steamId}`;
    const profileRes = await fetch(steamApiUrl);

    if (!profileRes.ok) {
      console.error('Failed to fetch Steam profile');
      res.redirect('/profile');
      return;
    }

    const profileData = await profileRes.json();
    const players = profileData.response?.players;

    if (!players || players.length === 0) {
      console.error('Steam profile not found');
      res.redirect('/profile');
      return;
    }

    const player = players[0];
    const steamUser = {
      id: player.steamid,
      username: player.personaname,
      avatar_url: player.avatarfull,
    };

    // Encode the Steam user info
    const payload = encodeURIComponent(Buffer.from(JSON.stringify(steamUser)).toString('base64'));

    // Redirect to success page with steam_user param
    res.redirect(`/steam/success?steam_user=${payload}`);
  } catch (err) {
    console.error('Steam OAuth error:', err);
    res.status(500).send('Authentication failed');
  }
}
