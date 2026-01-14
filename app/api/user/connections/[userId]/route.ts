import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, ref as dbRef, update, get } from 'firebase/database';
import { app } from '@/app/api/lib/firebase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const database = getDatabase(app);
    
    const snapshot = await get(dbRef(database, `users/${userId}/connections`));
    const connections = snapshot.val() || {};
    
    return NextResponse.json(connections);
  } catch (error: any) {
    console.error('Error fetching connections:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch connections' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const body = await request.json();
    const { platform, connection } = body;

    if (!platform || !connection) {
      return NextResponse.json(
        { error: 'Platform and connection data required' },
        { status: 400 }
      );
    }

    const database = getDatabase(app);
    const connectionPath = `users/${userId}/connections/${platform}`;
    
    await update(dbRef(database, connectionPath), {
      id: connection.id,
      username: connection.username,
      avatar: connection.avatar || null,
      connectedAt: Date.now(),
    });

    return NextResponse.json({
      success: true,
      message: `${platform} connection saved`,
    });
  } catch (error: any) {
    console.error('Error saving connection:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save connection' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const { platform } = await request.json();

    if (!platform) {
      return NextResponse.json(
        { error: 'Platform required' },
        { status: 400 }
      );
    }

    const database = getDatabase(app);
    const connectionPath = `users/${userId}/connections/${platform}`;
    
    // Use update with null value to delete
    const updates: Record<string, any> = {};
    updates[connectionPath] = null;
    await update(dbRef(database, `users/${userId}`), updates);

    return NextResponse.json({
      success: true,
      message: `${platform} connection removed`,
    });
  } catch (error: any) {
    console.error('Error deleting connection:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete connection' },
      { status: 500 }
    );
  }
}
