import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDatabase } from '@/app/api/lib/firebaseAdmin';

/**
 * Handle OAuth sign-in or account creation
 * POST body should contain: email, displayName, photoURL (optional), provider (optional), providerId (optional)
 * 
 * This endpoint prevents duplicate accounts by:
 * 1. Checking if email already exists
 * 2. Checking if provider is already connected to an account
 * 3. Merging provider connections if account exists
 */
export async function POST(request: NextRequest) {
  try {
    const { email, displayName, photoURL, provider, providerId } = await request.json();

    if (!email || !displayName) {
      return NextResponse.json(
        { error: 'Email and displayName are required' },
        { status: 400 }
      );
    }

    const adminAuth = getAdminAuth();
    const adminDb = getAdminDatabase();

    let user: any;
    let isNew = false;
    let isProviderNew = false;

    try {
      // Try to get existing user by email
      user = await adminAuth.getUserByEmail(email);
      console.log('Existing user found by email:', user.uid);
    } catch (error: any) {
      // User doesn't exist by email, check if provider is connected to someone else
      if (error.code === 'auth/user-not-found') {
        // Check if this provider is already connected to another account
        if (provider && providerId) {
          const connectionsSnapshot = await adminDb
            .ref('users')
            .orderByChild(`connections/${provider}/id`)
            .equalTo(providerId)
            .once('value');

          if (connectionsSnapshot.exists()) {
            // Provider already connected to an account
            const existingUserId = Object.keys(connectionsSnapshot.val())[0];
            user = await adminAuth.getUser(existingUserId);
            console.log('Found existing user with provider connection:', user.uid);
            isProviderNew = false;
          } else {
            // No existing user or provider connection - create new account
            user = await adminAuth.createUser({
              email: email,
              displayName: displayName,
              photoURL: photoURL || undefined,
            });
            console.log('New user created:', user.uid);
            isNew = true;
            isProviderNew = true;

            // Initialize user profile in database
            await adminDb.ref(`users/${user.uid}`).set({
              id: user.uid,
              email: user.email || '',
              displayName: displayName,
              photoURL: photoURL || undefined,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            });

            // Initialize user stats
            await adminDb.ref(`users/${user.uid}/stats`).set({
              followers: 0,
              following: 0,
              views: 0,
            });
          }
        } else {
          // No provider info, just create new account
          user = await adminAuth.createUser({
            email: email,
            displayName: displayName,
            photoURL: photoURL || undefined,
          });
          console.log('New user created (no provider info):', user.uid);
          isNew = true;
          isProviderNew = true;

          // Initialize user profile in database
          await adminDb.ref(`users/${user.uid}`).set({
            id: user.uid,
            email: user.email || '',
            displayName: displayName,
            photoURL: photoURL || undefined,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });

          // Initialize user stats
          await adminDb.ref(`users/${user.uid}/stats`).set({
            followers: 0,
            following: 0,
            views: 0,
          });
        }
      } else {
        throw error;
      }
    }

    // If this is an existing user with a new provider connection, add the connection
    if (!isNew && provider && providerId && isProviderNew) {
      // Check if provider not already connected
      const existingConnections = await adminDb.ref(`users/${user.uid}/connections/${provider}`).once('value');
      
      if (!existingConnections.exists()) {
        // Add the provider connection
        await adminDb.ref(`users/${user.uid}/connections/${provider}`).set({
          id: providerId,
          displayName: displayName,
          photoURL: photoURL || undefined,
          connectedAt: Date.now(),
        });
        console.log(`Added ${provider} connection to existing user:`, user.uid);
      } else {
        console.log(`${provider} already connected to user:`, user.uid);
      }
    } else if (isNew && provider && providerId) {
      // For new users, add the provider connection
      await adminDb.ref(`users/${user.uid}/connections/${provider}`).set({
        id: providerId,
        displayName: displayName,
        photoURL: photoURL || undefined,
        connectedAt: Date.now(),
      });
      console.log(`Added ${provider} connection to new user:`, user.uid);
    }

    // Create a custom token for the user
    const customToken = await adminAuth.createCustomToken(user.uid);

    const response = NextResponse.json({
      success: true,
      isNew,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || displayName,
        photoURL: user.photoURL || photoURL || undefined,
      },
      token: customToken,
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
      { status: 400 }
    );
  }
}
