import { NextRequest, NextResponse } from "next/server";
import { getDatabase, ref, child, get } from "firebase/database";
import { app } from "@/app/api/lib/firebase";

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      );
    }

    const database = getDatabase(app);
    const snapshot = await get(child(ref(database), `users/${userId}/notifications`));

    let notifications: any[] = [];
    if (snapshot.exists()) {
      const notificationsObj = snapshot.val();
      notifications = Object.entries(notificationsObj).map(([id, data]: [string, any]) => ({
        id,
        ...data,
      }));
      // Sort by date, newest first
      notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return NextResponse.json({ notifications });
  } catch (error: any) {
    console.error("Fetch notifications error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
