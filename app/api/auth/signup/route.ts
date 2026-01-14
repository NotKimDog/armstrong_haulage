import { NextRequest, NextResponse } from 'next/server';
import { signUp as firebaseSignUp } from '@/app/api/lib/firebaseAuth';
import { getDatabase, ref, set } from 'firebase/database';
import { app } from '@/app/api/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const { email, password, displayName } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const user = await firebaseSignUp(email, password, displayName);

    // Initialize stats in Firebase for the new user
    try {
      const database = getDatabase(app);
      const userRef = ref(database, `users/${user.uid}/stats`);
      await set(userRef, {
        followers: 0,
        following: 0,
        views: 0,
      });
    } catch (statsError) {
      console.warn('Failed to initialize user stats:', statsError);
      // Don't fail the signup just because stats initialization failed
    }

    return NextResponse.json({
      user,
      success: true,
      message: 'Account created successfully. Please sign in.',
    });
  } catch (error: any) {
    console.error('Sign up error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create account' },
      { status: 400 }
    );
  }
}
