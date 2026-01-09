import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// Middleware to check admin/agent auth
function checkAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded || (decoded.role !== 'ADMIN' && decoded.role !== 'AGENT')) {
    return null;
  }
  return decoded;
}

export async function GET(request: NextRequest) {
  const user = checkAuth(request);
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Get all users (admins and agents) for assignment
    const teamMembers = await sql`
      SELECT id, email, name, role, phone
      FROM users
      WHERE role IN ('ADMIN', 'AGENT')
      ORDER BY name, email
    `;

    return NextResponse.json({ teamMembers });
  } catch (error) {
    console.error('Team members API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

