import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const nonce = crypto.randomBytes(16).toString('hex');
  const steamRealmUrl = encodeURIComponent(
    process.env.STEAM_REDIRECT_URI || 'http://localhost:3000/api/auth/steam/callback'
  );

  const steamAuthUrl = `https://steamcommunity.com/openid/login?openid.ns=http://specs.openid.net/auth/2.0&openid.identity=http://specs.openid.net/auth/2.0/identifier_select&openid.claimed_id=http://specs.openid.net/auth/2.0/identifier_select&openid.mode=checkid_setup&openid.return_to=${steamRealmUrl}&openid.realm=${steamRealmUrl}&openid.response_nonce=${nonce}`;

  res.redirect(steamAuthUrl);
}
