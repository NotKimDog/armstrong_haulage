import { NextRequest, NextResponse } from "next/server";
import { getDatabase, ref, remove } from "firebase/database";
import { app } from "@/app/api/lib/firebase";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ notificationId: string }> }) {
  try {
    const { notificationId } = await params;

    if (!notificationId) {
      return NextResponse.json(
        { error: "Notification ID required" },
        { status: 400 }
      );
    }

    // Get userId from request body
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      );
    }

    const database = getDatabase(app);
    const notificationRef = ref(database, `users/${userId}/notifications/${notificationId}`);
    
    await remove(notificationRef);

    return NextResponse.json({ success: true, message: "Notification deleted" });
  } catch (error: any) {
    console.error("Delete notification error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete notification" },
      { status: 500 }
    );
  }
}
