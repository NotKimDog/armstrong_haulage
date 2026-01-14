import { NextResponse } from 'next/server';
import { getTwitchAppToken } from '@/app/api/lib/twitch-token';

// This endpoint proxies platform checks (server-side) so client can call safely.
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const platform = url.searchParams.get('platform') || '';
    const id = url.searchParams.get('id') || '';

    if (!platform || !id) return NextResponse.json({ isLive: false }, { status: 400 });

    // Use same logic as previously in server action
    // Minimal copy of logic from app/actions/getStreamStatus
    if (platform === 'Twitch') {
      const clientId = process.env.TWITCH_CLIENT_ID;
      if (!clientId) return NextResponse.json({ isLive: false }, { status: 200 });

      const accessToken = await getTwitchAppToken();
      if (!accessToken) return NextResponse.json({ isLive: false }, { status: 200 });

      // Get user
      const userRes = await fetch(`https://api.twitch.tv/helix/users?login=${id}`, { headers: { 'Client-ID': clientId, Authorization: `Bearer ${accessToken}` }, next: { revalidate: 3600 } });
      if (!userRes.ok) return NextResponse.json({ isLive: false }, { status: 200 });
      const userData = await userRes.json();
      const user = userData.data?.[0];
      const userId = user?.id;
      const profileImage = user?.profile_image_url;
      if (!userId) return NextResponse.json({ isLive: false }, { status: 200 });

      const streamRes = await fetch(`https://api.twitch.tv/helix/streams?user_id=${userId}`, { headers: { 'Client-ID': clientId, Authorization: `Bearer ${accessToken}` }, next: { revalidate: 30 } });
      if (!streamRes.ok) return NextResponse.json({ isLive: false }, { status: 200 });
      const streamData = await streamRes.json();
      const isLive = streamData.data && streamData.data.length > 0;

      // current viewer count when live
      const viewerCount = isLive ? streamData.data[0]?.viewer_count : undefined;

      // follower count (channels/followers endpoint returns total)
      let followers: number | undefined;
      try {
        const followersRes = await fetch(`https://api.twitch.tv/helix/channels/followers?broadcaster_id=${userId}`, { headers: { 'Client-ID': clientId, Authorization: `Bearer ${accessToken}` }, next: { revalidate: 3600 } });
        if (followersRes.ok) {
          const followersData = await followersRes.json();
          followers = followersData.total;
        }
      } catch (err) { console.error('Twitch followers error', err); }

      let lastLive = isLive ? new Date().toISOString() : undefined;
      if (!isLive) {
        const videoRes = await fetch(`https://api.twitch.tv/helix/videos?user_id=${userId}&first=1&type=archive`, { headers: { 'Client-ID': clientId, Authorization: `Bearer ${accessToken}` }, next: { revalidate: 300 } });
        const videoData = await videoRes.json();
        lastLive = videoData.data?.[0]?.created_at;
      }

      return NextResponse.json({ isLive, lastLive, followers, viewerCount, profileImage });
    }

    if (platform === 'YouTube') {
      const apiKey = process.env.YOUTUBE_API_KEY;
      if (!apiKey) return NextResponse.json({ isLive: false }, { status: 200 });

      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${id}&type=video&eventType=live&key=${apiKey}`, { next: { revalidate: 60 } });
      if (!res.ok) return NextResponse.json({ isLive: false }, { status: 200 });
      const data = await res.json();
      const isLive = data.items && data.items.length > 0;
      const videoId = isLive ? data.items[0].id.videoId : undefined;

      let channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics&key=${apiKey}`;
      if (id.startsWith('@')) {
        channelUrl += `&forHandle=${encodeURIComponent(id)}`;
      } else {
        channelUrl += `&id=${id}`;
      }

      const channelRes = await fetch(channelUrl, { next: { revalidate: 3600 } });
      const channelData = await channelRes.json();
      const channelItem = channelData.items?.[0];
      const followers = channelItem?.statistics?.subscriberCount ? Number(channelItem.statistics.subscriberCount) : undefined;
      const profileImage = channelItem?.snippet?.thumbnails?.high?.url || channelItem?.snippet?.thumbnails?.default?.url;

      // Try to fetch concurrent viewers for the live video when available
      let viewerCount: number | undefined;
      if (isLive && videoId) {
        try {
          const vidRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails,statistics&id=${videoId}&key=${apiKey}`, { next: { revalidate: 30 } });
          if (vidRes.ok) {
            const vidData = await vidRes.json();
            const details = vidData.items?.[0]?.liveStreamingDetails;
            const stats = vidData.items?.[0]?.statistics;
            viewerCount = details?.concurrentViewers ? Number(details.concurrentViewers) : (stats?.viewCount ? Number(stats.viewCount) : undefined);
          }
        } catch (err) {
          console.warn('YouTube viewers fetch failed', err);
        }
      }

      let lastLive = isLive ? new Date().toISOString() : undefined;
      if (!isLive) {
        const activityRes = await fetch(`https://www.googleapis.com/youtube/v3/activities?part=snippet&channelId=${id}&maxResults=1&key=${apiKey}`, { next: { revalidate: 600 } });
        const activityData = await activityRes.json();
        lastLive = activityData.items?.[0]?.snippet?.publishedAt;
      }

      return NextResponse.json({ isLive, videoId, followers, lastLive, viewerCount, profileImage });
    }

    return NextResponse.json({ isLive: false }, { status: 200 });
  } catch (error) {
    console.error('Stream status error:', error);
    return NextResponse.json({ isLive: false }, { status: 500 });
  }
}
