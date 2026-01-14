import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../lib/firebaseDb';
import { ref, push, child } from 'firebase/database';

interface LogEntry {
  timestamp: number;
  userId?: string;
  action: string;
  actionType: 'login' | 'logout' | 'update' | 'delete' | 'create' | 'system' | 'error';
  details?: any;
  ipAddress?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { userId, action, actionType, details } = await request.json();

    const logEntry: LogEntry = {
      timestamp: Date.now(),
      userId,
      action,
      actionType,
      details,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    };

    const db = getDb();
    const logsRef = ref(db, 'system_logs');
    
    // Push the log entry
    await push(logsRef, logEntry);

    return NextResponse.json({ success: true, timestamp: logEntry.timestamp });
  } catch (error) {
    console.error('Error logging activity:', error);
    return NextResponse.json(
      { error: 'Failed to log activity' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '100');
    const actionType = searchParams.get('actionType');

    const db = getDb();
    const logsRef = ref(db, 'system_logs');
    
    // Note: For production, you'd want to use Firestore for better querying
    // This is a simplified approach

    return NextResponse.json({
      logs: [],
      total: 0,
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logs' },
      { status: 500 }
    );
  }
}
