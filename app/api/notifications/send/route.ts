import { NextRequest, NextResponse } from "next/server";
import { getDatabase, ref, child, get, push, set } from "firebase/database";
import { app } from "@/app/api/lib/firebase";

export async function POST(request: NextRequest) {
  try {
    const { recipientId, title, message, type, relatedUserId } = await request.json();

    if (!recipientId || !title || !message) {
      return NextResponse.json(
        { error: "Recipient ID, title, and message are required" },
        { status: 400 }
      );
    }

    const database = getDatabase(app);
    
    // Verify recipient exists
    const userRef = ref(database, `users/${recipientId}`);
    const userSnapshot = await get(userRef);
    if (!userSnapshot.exists()) {
      return NextResponse.json(
        { error: "Recipient user not found" },
        { status: 404 }
      );
    }

    // Create notification with unique ID
    const notificationsRef = child(ref(database), `users/${recipientId}/notifications`);
    const newNotificationRef = push(notificationsRef);
    
    const notification = {
      title,
      message,
      type: type || "general",
      relatedUserId: relatedUserId || null,
      read: false,
      createdAt: new Date().toISOString(),
    };

    await set(newNotificationRef, notification);

    console.log(`Notification sent to ${recipientId}: ${title}`);

    return NextResponse.json({
      success: true,
      message: "Notification sent successfully",
      notificationId: newNotificationRef.key,
    });
  } catch (error: any) {
    console.error("Send notification error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send notification" },
      { status: 500 }
    );
  }
}
