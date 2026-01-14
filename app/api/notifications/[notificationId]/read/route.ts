import { NextRequest, NextResponse } from "next/server";
import { getDatabase, ref, update } from "firebase/database";
import { app } from "@/app/api/lib/firebase";

export async function POST(request: NextRequest, ctx: any) {
  try {
    const resolvedParams = await ctx.params;
    const notificationId = resolvedParams.notificationId as string;

    if (!notificationId) {
      return NextResponse.json(
        { error: "Notification ID required" },
        { status: 400 }
      );
    }

    const database = getDatabase(app);
    
    // Get the request body to find the userId
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      );
    }

    const notificationRef = ref(database, `users/${userId}/notifications/${notificationId}`);
    
    await update(notificationRef, {
      read: true,
      readAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, message: "Notification marked as read" });
  } catch (error: any) {
    console.error("Mark as read error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to mark notification as read" },
      { status: 500 }
    );
  }
}

