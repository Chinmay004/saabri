import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'http://tm-backend-qfaf.onrender.com/api/projects';

// Cache duration: 5 minutes for filtered searches, 10 minutes for general queries
const CACHE_DURATION_FILTERED = 300; // 5 minutes
const CACHE_DURATION_GENERAL = 600; // 10 minutes

// Simple in-memory cache (for production, consider using Redis or similar)
const cache = new Map<string, { data: any; timestamp: number; duration: number }>();

function getCacheKey(body: any, page: string, limit: string): string {
  // Create a stable cache key from filters and pagination
  const sortedBody = JSON.stringify(body, Object.keys(body || {}).sort());
  return `projects:${sortedBody}:${page}:${limit}`;
}

function getCacheDuration(body: any): number {
  // If there are filters, use shorter cache duration
  const hasFilters = body && Object.keys(body).length > 0;
  return hasFilters ? CACHE_DURATION_FILTERED : CACHE_DURATION_GENERAL;
}

export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '20';

    // Get the request body (filters)
    const body = await request.json();

    // Check cache
    const cacheKey = getCacheKey(body, page, limit);
    const cached = cache.get(cacheKey);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < cached.duration * 1000) {
      // Return cached response with appropriate headers
      return NextResponse.json(cached.data, {
        headers: {
          'Cache-Control': `public, s-maxage=${cached.duration}, stale-while-revalidate=${cached.duration * 2}`,
          'X-Cache': 'HIT',
        },
      });
    }

    // Build the URL with query parameters
    const url = new URL(API_BASE_URL);
    url.searchParams.append('page', page);
    url.searchParams.append('limit', limit);

    // Log request for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('=== API Proxy Request ===');
      console.log('URL:', url.toString());
      console.log('Filters:', JSON.stringify(body, null, 2));
    }

    // Forward the request to the backend API with Next.js fetch caching
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      // Cache the external API response for 5 minutes
      next: { revalidate: 300 },
    });

    // Log response for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('=== API Proxy Response ===');
      console.log('Status:', response.status);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend API error:', response.status, errorText);
      return NextResponse.json(
        { 
          success: false, 
          message: `API error: ${response.status} ${response.statusText}`,
          data: [],
          error: errorText 
        },
        { 
          status: response.status,
          headers: {
            'Cache-Control': 'no-store',
          },
        }
      );
    }

    const data = await response.json();
    
    // Store in cache
    const cacheDuration = getCacheDuration(body);
    cache.set(cacheKey, {
      data,
      timestamp: now,
      duration: cacheDuration,
    });

    // Clean up old cache entries (keep last 100 entries)
    if (cache.size > 100) {
      const entries = Array.from(cache.entries());
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
      cache.clear();
      entries.slice(0, 100).forEach(([key, value]) => cache.set(key, value));
    }

    // Return response with caching headers
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': `public, s-maxage=${cacheDuration}, stale-while-revalidate=${cacheDuration * 2}`,
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch properties',
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}

