import { NextRequest, NextResponse } from "next/server";
import { getDatabase, ref, update, get } from "firebase/database";
import { app } from "../../../lib/firebase";

export async function POST(request: NextRequest) {
  try {
    const { email, uid } = await request.json();

    if (!email || !uid) {
      return NextResponse.json(
        { error: "Email and UID required" },
        { status: 400 }
      );
    }

    // Get Firebase Realtime Database instance
    const database = getDatabase(app);
    const userRef = ref(database, `users/${uid}`);
    
    // First check if user exists
    const snapshot = await get(userRef);
    if (!snapshot.exists()) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Update verified field to true
    await update(userRef, {
      verified: true,
      verifiedAt: new Date().toISOString(),
    });

    console.log(`Email verified for user ${uid} (${email})`);

    return NextResponse.json(
      { success: true, message: "Email verified successfully" },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Failed to verify email:", error);
    const errorMsg =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: `Failed to verify email: ${errorMsg}` },
      { status: 500 }
    );
  }
}
