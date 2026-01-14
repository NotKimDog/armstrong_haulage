"use server";

// Cache Twitch token in memory to avoid rate limits
let twitchAccessToken: string | null = null;
let twitchTokenExpiry: number = 0;

async function getTwitchToken(clientId: string, clientSecret: string) {
  const now = Date.now();
  if (twitchAccessToken && now < twitchTokenExpiry) {
    return twitchAccessToken;
  }

  try {
    const res = await fetch(
      `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
      { method: "POST", cache: "no-store" }
    );

    if (!res.ok) return null;

    const data = await res.json();
    twitchAccessToken = data.access_token;
    // Set expiry with 60s buffer
    twitchTokenExpiry = now + (data.expires_in * 1000) - 60000;
    return twitchAccessToken;
  } catch (error) {
    console.error("Error fetching Twitch token:", error);
    return null;
  }
}

export interface StreamStatus {
  isLive: boolean;
  videoId?: string;
  followers?: number;
  lastLive?: string;
}

export async function getStreamStatus(platform: string, id: string): Promise<StreamStatus> {
  // Mock response for localhost testing
  // Use 'test_live' as the username/channelId to simulate a live stream
  // Only allow the real channel ID to be mocked in development
  const isDev = process.env.NODE_ENV === 'development';
  if (id === 'test_live') 
    return { isLive: true, followers: 1250, lastLive: new Date().toISOString() };

  try {
    if (platform === "Twitch") {
      const clientId = process.env.TWITCH_CLIENT_ID;
      const clientSecret = process.env.TWITCH_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        console.error("Twitch API credentials missing");
        return { isLive: false, followers: undefined, lastLive: undefined };
      }

      const accessToken = await getTwitchToken(clientId, clientSecret);
      if (!accessToken) return { isLive: false, followers: undefined, lastLive: undefined };

      // 1. Get User ID (Required for other endpoints)
      const userRes = await fetch(
        `https://api.twitch.tv/helix/users?login=${id}`,
        { headers: { "Client-ID": clientId, Authorization: `Bearer ${accessToken}` }, next: { revalidate: 3600 } }
      );
      const userData = await userRes.json();
      const userId = userData.data?.[0]?.id;

      if (!userId) return { isLive: false };

      // 2. Check Stream
      const streamRes = await fetch(
        `https://api.twitch.tv/helix/streams?user_id=${userId}`,
        {
          headers: {
            "Client-ID": clientId,
            Authorization: `Bearer ${accessToken}`,
          },
          next: { revalidate: 30 }, // Cache for 30s
        }
      );
      
      if (!streamRes.ok) {
        console.error(`Twitch API Error: ${streamRes.status} ${streamRes.statusText}`);
        if (streamRes.status === 401) {
          twitchAccessToken = null; // Invalidate token if unauthorized
        }
        return { isLive: false };
      }

      const streamData = await streamRes.json();
      const isLive = streamData.data && streamData.data.length > 0;

      // 3. Get Follower Count
      let followers: number | undefined;
      try {
        const followersRes = await fetch(
          `https://api.twitch.tv/helix/channels/followers?broadcaster_id=${userId}`,
          { headers: { "Client-ID": clientId, Authorization: `Bearer ${accessToken}` }, next: { revalidate: 3600 } }
        );
        if (followersRes.ok) {
          const followersData = await followersRes.json();
          followers = followersData.total;
        }
      } catch (error) {
        console.error("Error fetching Twitch followers:", error);
      }

      // 4. Get Last Live Date (from Videos) if not live
      let lastLive = isLive ? new Date().toISOString() : undefined;
      if (!isLive) {
        const videoRes = await fetch(
          `https://api.twitch.tv/helix/videos?user_id=${userId}&first=1&type=archive`,
          { headers: { "Client-ID": clientId, Authorization: `Bearer ${accessToken}` }, next: { revalidate: 300 } }
        );
        const videoData = await videoRes.json();
        lastLive = videoData.data?.[0]?.created_at;
      }

      return { isLive, lastLive, followers };
    } 
    
    if (platform === "YouTube") {
      const apiKey = process.env.YOUTUBE_API_KEY;
      
      if (!apiKey) {
        console.error("YouTube API key missing");
        return { isLive: false, followers: undefined, lastLive: undefined };
      }

      // 1. Check Live Status (Search)
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${id}&type=video&eventType=live&key=${apiKey}`,
        { next: { revalidate: 60 } } // Cache for 60s
      );
      
      if (!res.ok) {
        console.error(`YouTube API Error: ${res.status} ${res.statusText}`);
        return { isLive: false };
      }

      const data = await res.json();
      const isLive = data.items && data.items.length > 0;
      const videoId = isLive ? data.items[0].id.videoId : undefined;

      // 2. Get Subscriber Count (Channels)
      let channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics&key=${apiKey}`;
      if (id.startsWith('@')) {
        channelUrl += `&forHandle=${encodeURIComponent(id)}`;
      } else {
        channelUrl += `&id=${id}`;
      }

      const channelRes = await fetch(
        channelUrl,
        { next: { revalidate: 3600 } } // Cache for 1 hour
      );
      const channelData = await channelRes.json();
      const followers = channelData.items?.[0]?.statistics?.subscriberCount ? Number(channelData.items[0].statistics.subscriberCount) : undefined;

      // 3. Get Last Live/Upload Date (Activities) if not live
      let lastLive = isLive ? new Date().toISOString() : undefined;
      if (!isLive) {
        const activityRes = await fetch(
          `https://www.googleapis.com/youtube/v3/activities?part=snippet&channelId=${id}&maxResults=1&key=${apiKey}`,
          { next: { revalidate: 600 } }
        );
        const activityData = await activityRes.json();
        lastLive = activityData.items?.[0]?.snippet?.publishedAt;
      }

      return { isLive, videoId, followers, lastLive };
    }
  } catch (error) {
    console.error(`Error checking ${platform} status:`, error);
    return { isLive: false };
  }
  
  return { isLive: false };
}