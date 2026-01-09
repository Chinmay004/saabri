import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/migrations/init';

/**
 * Database Initialization API Route
 * 
 * This endpoint initializes the database tables.
 * It's safe to call multiple times - it won't recreate existing tables.
 * 
 * GET /api/admin/init
 */
export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    return NextResponse.json({ 
      success: true, 
      message: 'Database initialized successfully' 
    });
  } catch (error: any) {
    console.error('Database initialization error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to initialize database' 
      },
      { status: 500 }
    );
  }
}

