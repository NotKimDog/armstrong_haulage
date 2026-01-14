import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareDB } from '@/app/api/lib/cloudflare';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const db = await getCloudflareDB();

    const result = await db.query(
      `SELECT emailNotifications, pushNotifications, marketingEmails, publicProfile, 
              showStats, theme, accentColor, showUserId, showEmail
       FROM user_settings WHERE userId = ?`,
      [userId]
    );

    if (!result.results?.length) {
      // Return defaults
      return NextResponse.json({
        emailNotifications: true,
        pushNotifications: false,
        marketingEmails: false,
        publicProfile: true,
        showStats: true,
        theme: 'dark',
        accentColor: 'blue',
        showUserId: false,
        showEmail: false,
      });
    }

    return NextResponse.json(result.results[0]);
  } catch (error: any) {
    console.error('Fetch settings error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const settings = await request.json();
    const db = await getCloudflareDB();

    await db.query(
      `INSERT INTO user_settings (userId, emailNotifications, pushNotifications, marketingEmails, 
                                   publicProfile, showStats, theme, accentColor, showUserId, showEmail, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(userId) DO UPDATE SET
       emailNotifications = excluded.emailNotifications,
       pushNotifications = excluded.pushNotifications,
       marketingEmails = excluded.marketingEmails,
       publicProfile = excluded.publicProfile,
       showStats = excluded.showStats,
       theme = excluded.theme,
       accentColor = excluded.accentColor,
       showUserId = excluded.showUserId,
       showEmail = excluded.showEmail,
       updatedAt = CURRENT_TIMESTAMP`,
      [
        userId,
        settings.emailNotifications ?? true,
        settings.pushNotifications ?? false,
        settings.marketingEmails ?? false,
        settings.publicProfile ?? true,
        settings.showStats ?? true,
        settings.theme ?? 'dark',
        settings.accentColor ?? 'blue',
        settings.showUserId ?? false,
        settings.showEmail ?? false,
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Settings updated',
    });
  } catch (error: any) {
    console.error('Update settings error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update settings' },
      { status: 500 }
    );
  }
}
