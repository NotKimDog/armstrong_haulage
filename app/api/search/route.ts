import { NextRequest, NextResponse } from 'next/server';
import { 
  parseSearchQuery, 
  performSearch, 
  searchUsers,
  type User,
} from '@/app/api/lib/search';

/**
 * Advanced search endpoint
 * GET /api/search?q=query&type=users&sort=recent&page=1&limit=20
 */
export async function GET(request: NextRequest) {
  try {
    const query = parseSearchQuery(request);
    const type = request.nextUrl.searchParams.get('type') || 'users';

    if (!query.q) {
      return NextResponse.json({
        success: true,
        results: {
          items: [],
          total: 0,
          page: 1,
          pageSize: query.limit || 20,
          totalPages: 0,
        },
        timestamp: Date.now(),
      });
    }

    if (type === 'users') {
      // Example: search from mock data (replace with real database query)
      const mockUsers: User[] = [
        {
          id: '1',
          displayName: 'John Trucker',
          slug: 'john-trucker',
          email: 'john@example.com',
          photoURL: 'https://via.placeholder.com/150',
        },
        {
          id: '2',
          displayName: 'Jane Driver',
          slug: 'jane-driver',
          email: 'jane@example.com',
          photoURL: 'https://via.placeholder.com/150',
        },
      ];

      const results = searchUsers(mockUsers, query.q);

      return NextResponse.json({
        success: true,
        results: performSearch(
          results,
          query,
          ['displayName', 'email', 'slug'] as any
        ),
        timestamp: Date.now(),
      });
    }

    return NextResponse.json({
      success: true,
      results: {
        items: [],
        total: 0,
        page: 1,
        pageSize: query.limit || 20,
        totalPages: 0,
      },
      type,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}
