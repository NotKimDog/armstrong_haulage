import { NextRequest, NextResponse } from 'next/server';
import { createFirestoreToD1Migrator } from '@/app/api/lib/firestore-to-d1-migrator';

/**
 * Migration API endpoint
 * Run migration from Firebase to Cloudflare D1
 * 
 * POST /api/admin/migrate
 * Body: { firebaseUsers: [], firebaseProfiles: {} }
 */
export async function POST(request: NextRequest) {
  try {
    // Add authentication check in production
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.includes('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { users } = await request.json();

    if (!Array.isArray(users)) {
      return NextResponse.json(
        { error: 'Users must be an array' },
        { status: 400 }
      );
    }

    const migrator = await createFirestoreToD1Migrator();
    const results = await migrator.migrateUsers(users);

    return NextResponse.json({
      success: true,
      results,
      message: `Migration completed: ${results.successful} successful, ${results.failed} failed`,
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: error.message || 'Migration failed' },
      { status: 500 }
    );
  }
}

/**
 * Get migration status
 */
export async function GET(request: NextRequest) {
  try {
    const migrator = await createFirestoreToD1Migrator();
    const status = await migrator.getStatus();

    return NextResponse.json({
      success: true,
      status,
    });
  } catch (error: any) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get status' },
      { status: 500 }
    );
  }
}
