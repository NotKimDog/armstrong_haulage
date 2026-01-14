import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  Auth,
  User,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { auth } from './firebase';
import { setUserProfile } from './firebaseDb';

export async function signUp(email: string, password: string, displayName?: string) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setUserProfile(user.uid, {
      id: user.uid,
      email: user.email || '',
      displayName: displayName || email.split('@')[0],
      photoURL: user.photoURL || undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return {
      uid: user.uid,
      email: user.email,
      displayName: displayName || email.split('@')[0],
    };
  } catch (error: any) {
    console.error('Sign up error:', error);
    throw new Error(error.message || 'Failed to create account');
  }
}

export async function signIn(email: string, password: string) {
  try {
    await setPersistence(auth, browserLocalPersistence);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const idToken = await user.getIdToken();

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      token: idToken,
    };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw new Error(error.message || 'Invalid email or password');
  }
}

export async function signOut() {
  try {
    await firebaseSignOut(auth);
    return true;
  } catch (error) {
    console.error('Sign out error:', error);
    return false;
  }
}

export function getCurrentUser(): User | null {
  return auth.currentUser;
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function getIdToken(): Promise<string | null> {
  try {
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken();
  } catch (error) {
    console.error('Error getting ID token:', error);
    return null;
  }
}

export async function verifyToken(token: string): Promise<{ uid: string; email: string } | null> {
  try {
    const response = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}
