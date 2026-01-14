import { NextRequest, NextResponse } from 'next/server';
import { getAuthService } from '@/app/api/lib/cloudflare-auth';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('authToken')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const authService = await getAuthService();
    await authService.signOut(token);

    const response = NextResponse.json({
      success: true,
      message: 'Signed out successfully',
    });

    response.cookies.delete('authToken');

    return response;
  } catch (error: any) {
    console.error('Sign out error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sign out' },
      { status: 500 }
    );
  }
}
