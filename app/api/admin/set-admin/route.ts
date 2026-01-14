import { NextRequest, NextResponse } from 'next/server';
import { setUserAdmin, checkIsAdmin } from '../../lib/firebaseDb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, isAdmin, requesterId } = body;

    if (!userId || typeof isAdmin !== 'boolean' || !requesterId) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, isAdmin, requesterId' },
        { status: 400 }
      );
    }

    // Check if the requester is an admin
    const requesterIsAdmin = await checkIsAdmin(requesterId);
    if (!requesterIsAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admins can modify admin status' },
        { status: 403 }
      );
    }

    // Set the admin status
    const success = await setUserAdmin(userId, isAdmin);
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: `User ${isAdmin ? 'granted' : 'revoked'} admin access`,
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to update admin status' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error setting admin status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
