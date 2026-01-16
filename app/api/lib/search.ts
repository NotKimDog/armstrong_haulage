// Advanced Search and Filtering Utilities
import { NextRequest, NextResponse } from 'next/server';

export interface SearchQuery {
  q?: string;
  sort?: 'recent' | 'popular' | 'trending' | 'relevant';
  filter?: Record<string, any>;
  page?: number;
  limit?: number;
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Parse search query from request
 */
export function parseSearchQuery(request: NextRequest): SearchQuery {
  const url = new URL(request.url);
  const q = url.searchParams.get('q') || '';
  const sort = (url.searchParams.get('sort') || 'recent') as SearchQuery['sort'];
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20')));

  return { q, sort, page, limit };
}

/**
 * Filter array of items by query
 */
export function filterByQuery<T>(
  items: T[],
  query: string,
  searchFields: (keyof T)[]
): T[] {
  if (!query.trim()) return items;

  const lowerQuery = query.toLowerCase();
  return items.filter((item) =>
    searchFields.some((field) => {
      const value = item[field];
      if (value === null || value === undefined) return false;
      return String(value).toLowerCase().includes(lowerQuery);
    })
  );
}

/**
 * Sort items by specified field
 */
export function sortItems<T>(
  items: T[],
  sort: string,
  sortField?: keyof T
): T[] {
  const copy = [...items];

  if (sort === 'recent' && sortField) {
    return copy.sort((a, b) => {
      const aVal = a[sortField] as any;
      const bVal = b[sortField] as any;
      return (bVal || 0) - (aVal || 0);
    });
  }

  if (sort === 'popular') {
    return copy; // Implementation depends on data structure
  }

  return copy;
}

/**
 * Paginate array of items
 */
export function paginate<T>(items: T[], page: number, pageSize: number): SearchResult<T> {
  const total = items.length;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  return {
    items: items.slice(start, end),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Combined search, filter, sort and paginate
 */
export function performSearch<T>(
  items: T[],
  query: SearchQuery,
  searchFields: (keyof T)[],
  sortField?: keyof T
): SearchResult<T> {
  let results = items;

  if (query.q) {
    results = filterByQuery(results, query.q, searchFields);
  }

  if (query.sort && sortField) {
    results = sortItems(results, query.sort, sortField);
  }

  return paginate(results, query.page || 1, query.limit || 20);
}

/**
 * Efficient user search with caching
 */
export interface User {
  id: string;
  displayName?: string;
  email?: string;
  slug?: string;
  photoURL?: string;
}

export function searchUsers(users: User[], query: string): User[] {
  if (!query.trim()) return [];

  const lowerQuery = query.toLowerCase();
  return users.filter(
    (user) =>
      user.displayName?.toLowerCase().includes(lowerQuery) ||
      user.slug?.toLowerCase().includes(lowerQuery) ||
      user.email?.toLowerCase().includes(lowerQuery)
  );
}
