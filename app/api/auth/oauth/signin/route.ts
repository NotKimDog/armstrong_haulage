import { NextRequest, NextResponse } from 'next/server';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getDatabase, ref, get, set } from 'firebase/database';
import { app } from '@/app/api/lib/firebase';

/**
 * Handle OAuth sign-in or account creation
 * POST body should contain: email, displayName, photoURL (optional), provider (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const { email, displayName, photoURL, provider } = await request.json();

    if (!email || !displayName) {
      return NextResponse.json(
        { error: 'Email and displayName are required' },
        { status: 400 }
      );
    }

    const auth = getAuth(app);
    const database = getDatabase(app);
    const tempPassword = Math.random().toString(36).slice(-20);

    let user: any;
    let isNew = false;

    try {
      // Try to sign in with email and temp password
      const userCredential = await signInWithEmailAndPassword(auth, email, tempPassword);
      user = userCredential.user;
    } catch (signInError: any) {
      // User doesn't exist, create new account
      if (signInError.code === 'auth/user-not-found' || signInError.code === 'auth/wrong-password') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, tempPassword);
        user = userCredential.user;
        isNew = true;

        // Initialize user profile
        const userRef = ref(database, `users/${user.uid}`);
        await set(userRef, {
          id: user.uid,
          email: user.email || '',
          displayName: displayName,
          photoURL: photoURL || undefined,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

        // Initialize user stats
        const statsRef = ref(database, `users/${user.uid}/stats`);
        await set(statsRef, {
          followers: 0,
          following: 0,
          views: 0,
        });
      } else {
        throw signInError;
      }
    }

    // Get ID token for the user
    const idToken = await user.getIdToken();

    const response = NextResponse.json({
      success: true,
      isNew,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: displayName,
        photoURL: photoURL || undefined,
      },
      token: idToken,
    });

    // Set auth cookie
    response.cookies.set('authToken', idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('OAuth sign in error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sign in with OAuth provider' },
      { status: 400 }
    );
  }
}
