import { NextRequest, NextResponse } from 'next/server';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBjFMr1lRiwcUkXgB9kqsWTpii7OH_YM2c",
  authDomain: "armstrong-haulage.firebaseapp.com",
  databaseURL: "https://armstrong-haulage-default-rtdb.firebaseio.com",
  projectId: "armstrong-haulage",
  storageBucket: "armstrong-haulage.firebasestorage.app",
  messagingSenderId: "293936768104",
  appId: "1:293936768104:web:5c5fb048a052d12a2c07dd",
  measurementId: "G-7HJHDPKP7K"
};

// Note: This is a simplified verification. In production, you should use
// Firebase Admin SDK to verify the token server-side
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('authToken')?.value;

    if (!token) {
      return NextResponse.json(
        { user: null, authenticated: false },
        { status: 200 }
      );
    }

    // Token validation would be done via Firebase Admin SDK in production
    // For now, we accept the token if it exists
    return NextResponse.json({
      authenticated: true,
      token,
    });
  } catch (error: any) {
    console.error('Verify error:', error);
    return NextResponse.json(
      { user: null, authenticated: false, error: error.message },
      { status: 200 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { valid: false },
        { status: 400 }
      );
    }

    // Token validation would be done via Firebase Admin SDK in production
    return NextResponse.json({
      valid: true,
    });
  } catch (error: any) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      { valid: false, error: error.message },
      { status: 400 }
    );
  }
}
