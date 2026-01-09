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
    // Initialize database (creates tables if they don't exist) - only once
    await initializeDatabase();

    // Build WHERE clause for agent filtering
    const agentWhereClause = user.role === 'AGENT' ? sql`WHERE assigned_to = ${user.userId}` : sql``;
    const agentAndClause = user.role === 'AGENT' ? sql`AND assigned_to = ${user.userId}` : sql``;

    // Parallelize all database queries for better performance
    const [
      totalLeads,
      hotLeads,
      warmLeads,
      lostLeads,
      totalClients,
      totalEnquiries,
      recentLeads,
      revenuePipeline,
      leadsNeedingAttention
    ] = await Promise.all([
      // Get lead statistics (filtered by agent if applicable)
      sql`SELECT COUNT(*) as count FROM leads ${agentWhereClause}`,
      sql`SELECT COUNT(*) as count FROM leads WHERE status = 'HOT' ${agentAndClause}`,
      sql`SELECT COUNT(*) as count FROM leads WHERE status = 'WARM' ${agentAndClause}`,
      sql`SELECT COUNT(*) as count FROM leads WHERE status = 'COLD' ${agentAndClause}`,
      
      // Clients unified into general_enquiries (filtered by agent if applicable)
      sql`SELECT COUNT(*) as count FROM general_enquiries ${agentWhereClause}`,
      
      // Get enquiry count (filtered by agent if applicable)
      sql`SELECT COUNT(*) as count FROM general_enquiries ${agentWhereClause}`,
      
      // Get recent leads (last 5, filtered by agent if applicable)
      sql`
        SELECT id, name, phone, email, project_name, price, status, created_at 
        FROM leads 
        ${agentWhereClause}
        ORDER BY created_at DESC 
        LIMIT 5
      `,

      // Get revenue pipeline (sum of all lead prices)
      user.role === 'AGENT' 
        ? sql`
            SELECT COALESCE(SUM(price), 0) as total_revenue
            FROM leads 
            WHERE price IS NOT NULL AND price > 0 AND assigned_to = ${user.userId}
          `
        : sql`
            SELECT COALESCE(SUM(price), 0) as total_revenue
            FROM leads 
            WHERE price IS NOT NULL AND price > 0
          `,

      // Get leads needing attention (hot and warm leads)
      user.role === 'AGENT'
        ? sql`
            SELECT id, name, email, phone, status, sales_stage, project_name, price, assigned_to, created_at
            FROM leads 
            WHERE (status = 'HOT' OR status = 'WARM') AND assigned_to = ${user.userId}
            ORDER BY 
              CASE WHEN status = 'HOT' THEN 1 ELSE 2 END,
              created_at DESC
            LIMIT 5
          `
        : sql`
            SELECT id, name, email, phone, status, sales_stage, project_name, price, assigned_to, created_at
            FROM leads 
            WHERE (status = 'HOT' OR status = 'WARM') AND assigned_to IS NULL
            ORDER BY 
              CASE WHEN status = 'HOT' THEN 1 ELSE 2 END,
              created_at DESC
            LIMIT 5
          `
    ]);

    const total = parseInt(totalLeads[0].count);
    const hot = parseInt(hotLeads[0].count);
    const warm = parseInt(warmLeads[0].count);
    const lost = parseInt(lostLeads[0].count);
    const clients = parseInt(totalClients[0].count);
    const enquiries = parseInt(totalEnquiries[0].count);
    const pipelineValue = parseFloat(revenuePipeline[0].total_revenue) || 0;

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
        pipelineValue,
      },
      recentLeads,
      leadsNeedingAttention: leadsNeedingAttention.map((lead: any) => ({
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        status: lead.status,
        sales_stage: lead.sales_stage,
        project_name: lead.project_name,
        price: lead.price,
        assigned_to: lead.assigned_to,
        created_at: lead.created_at,
      })),
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

