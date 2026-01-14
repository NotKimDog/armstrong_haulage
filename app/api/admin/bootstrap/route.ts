import { NextRequest, NextResponse } from 'next/server';
import { setUserAdmin } from '../../lib/firebaseDb';

// IMPORTANT: This endpoint should only be used to set the FIRST admin
// After setting the first admin, this endpoint should be removed or secured
// Only use this once to bootstrap your admin user

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, secretKey } = body;

    // Add a secret key check for security (set this in your environment variables)
    const BOOTSTRAP_SECRET = process.env.ADMIN_BOOTSTRAP_SECRET || 'your-secret-key-here';
    
    if (secretKey !== BOOTSTRAP_SECRET) {
      return NextResponse.json(
        { error: 'Invalid secret key' },
        { status: 403 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    // Set the user as admin
    const success = await setUserAdmin(userId, true);
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: 'User successfully set as admin. Please remove or secure this endpoint now.',
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to set admin status' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error bootstrapping admin:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
