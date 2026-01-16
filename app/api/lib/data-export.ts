import { NextRequest, NextResponse } from 'next/server';

export interface UserDataExport {
  userId: string;
  profile: Record<string, any>;
  settings: Record<string, any>;
  stats: Record<string, any>;
  exportedAt: string;
  version: string;
}

/**
 * Export user data in JSON format
 */
export async function handleExportUserData(request: NextRequest, userId: string) {
  try {
    // Fetch user profile
    const profileRes = await fetch(`${request.headers.get('origin')}/api/user/profile/${userId}`, {
      headers: {
        'Cookie': request.headers.get('cookie') || '',
      },
    });

    if (!profileRes.ok) {
      throw new Error('Failed to fetch user profile');
    }

    const profile = await profileRes.json();

    // Build export data
    const exportData: UserDataExport = {
      userId,
      profile: profile,
      settings: profile.settings || {},
      stats: profile.stats || {},
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };

    // Return as downloadable JSON
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="user-data-${userId}-${Date.now()}.json"`,
      },
    });
  } catch (error) {
    console.error('Error exporting user data:', error);
    return NextResponse.json(
      { error: 'Failed to export user data' },
      { status: 500 }
    );
  }
}

/**
 * Validate exported user data format
 */
export function validateUserDataExport(data: any): data is UserDataExport {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.userId === 'string' &&
    typeof data.profile === 'object' &&
    typeof data.exportedAt === 'string' &&
    typeof data.version === 'string'
  );
}

/**
 * Import and merge user data
 */
export async function handleImportUserData(
  request: NextRequest,
  userId: string,
  importData: UserDataExport
) {
  try {
    // Validate import data
    if (!validateUserDataExport(importData)) {
      return NextResponse.json(
        { error: 'Invalid user data format' },
        { status: 400 }
      );
    }

    // Verify ownership
    if (importData.userId !== userId) {
      return NextResponse.json(
        { error: 'User data does not belong to this account' },
        { status: 403 }
      );
    }

    // Update user profile with imported data
    const updateRes = await fetch(
      `${request.headers.get('origin')}/api/user/profile`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('cookie') || '',
        },
        body: JSON.stringify(importData.profile),
      }
    );

    if (!updateRes.ok) {
      throw new Error('Failed to update user profile');
    }

    return NextResponse.json({
      success: true,
      message: 'User data imported successfully',
      importedFields: Object.keys(importData.profile),
    });
  } catch (error) {
    console.error('Error importing user data:', error);
    return NextResponse.json(
      { error: 'Failed to import user data' },
      { status: 500 }
    );
  }
}

/**
 * Generate data portability report
 */
export async function generateDataPortabilityReport(userId: string) {
  try {
    const report = {
      userId,
      generatedAt: new Date().toISOString(),
      dataCategories: {
        profile: ['name', 'email', 'photo', 'bio', 'location', 'website'],
        settings: ['notifications', 'privacy', 'theme', 'language'],
        stats: ['followers', 'following', 'views', 'achievements'],
        activity: ['login_history', 'profile_updates', 'achievements_unlocked'],
      },
      fileFormats: ['JSON', 'CSV'],
      retentionPolicy: {
        activeData: 'indefinite',
        deletedData: '90 days',
        backupData: '30 days',
      },
    };

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error generating portability report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}
