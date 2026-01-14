import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareDB } from '@/app/api/lib/cloudflare';

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('authToken')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const updates = await request.json();
    const db = await getCloudflareDB();

    // Get user from token
    const sessionResult = await db.query(
      `SELECT userId FROM auth_sessions WHERE token = ? AND expiresAt > CURRENT_TIMESTAMP`,
      [token]
    );

    if (!sessionResult.results?.length) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const userId = sessionResult.results[0].userId;

    // Build dynamic update query
    const fields = [];
    const values: any[] = [];

    if (updates.displayName) {
      fields.push('displayName = ?');
      values.push(updates.displayName);
    }
    if (updates.bio) {
      fields.push('bio = ?');
      values.push(updates.bio);
    }
    if (updates.location) {
      fields.push('location = ?');
      values.push(updates.location);
    }
    if (updates.website) {
      fields.push('website = ?');
      values.push(updates.website);
    }
    if (updates.photoURL) {
      fields.push('photoURL = ?');
      values.push(updates.photoURL);
    }
    if (updates.bannerURL) {
      fields.push('bannerURL = ?');
      values.push(updates.bannerURL);
    }

    if (fields.length === 0) {
      return NextResponse.json({ success: true, message: 'No changes' });
    }

    fields.push('updatedAt = CURRENT_TIMESTAMP');
    values.push(userId);

    await db.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return NextResponse.json({
      success: true,
      message: 'Profile updated',
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update profile' },
      { status: 500 }
    );
  }
}
