import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { initializeDatabase } from '@/lib/migrations/init';

// Middleware to check admin auth
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
    // Initialize database (creates tables if they don't exist)
    await initializeDatabase();

    // Build WHERE clause for agent filtering
    const agentWhereClause = user.role === 'AGENT' ? sql`WHERE assigned_to = ${user.userId}` : sql``;
    const agentAndClause = user.role === 'AGENT' ? sql`AND assigned_to = ${user.userId}` : sql``;

    // Get lead statistics (filtered by agent if applicable)
    const totalLeads = await sql`SELECT COUNT(*) as count FROM leads ${agentWhereClause}`;
    const hotLeads = await sql`SELECT COUNT(*) as count FROM leads WHERE status = 'HOT' ${agentAndClause}`;
    const warmLeads = await sql`SELECT COUNT(*) as count FROM leads WHERE status = 'WARM' ${agentAndClause}`;
    const lostLeads = await sql`SELECT COUNT(*) as count FROM leads WHERE status = 'COLD' ${agentAndClause}`;
    
    // Clients unified into general_enquiries (filtered by agent if applicable)
    const totalClients = await sql`SELECT COUNT(*) as count FROM general_enquiries ${agentWhereClause}`;
    
    // Get enquiry count (filtered by agent if applicable)
    const totalEnquiries = await sql`SELECT COUNT(*) as count FROM general_enquiries ${agentWhereClause}`;
    
    // Get recent leads (last 5, filtered by agent if applicable)
    const recentLeads = await sql`
      SELECT id, name, phone, email, project_name, price, status, created_at 
      FROM leads 
      ${agentWhereClause}
      ORDER BY created_at DESC 
      LIMIT 5
    `;

    const total = parseInt(totalLeads[0].count);
    const hot = parseInt(hotLeads[0].count);
    const warm = parseInt(warmLeads[0].count);
    const lost = parseInt(lostLeads[0].count);
    const clients = parseInt(totalClients[0].count);
    const enquiries = parseInt(totalEnquiries[0].count);

    return NextResponse.json({
      stats: {
        total,
        hot,
        warm,
        lost,
        clients,
        enquiries,
        conversionRate: total > 0 ? ((hot / total) * 100).toFixed(1) : 0,
        lostRate: total > 0 ? ((lost / total) * 100).toFixed(1) : 0,
      },
      recentLeads,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

