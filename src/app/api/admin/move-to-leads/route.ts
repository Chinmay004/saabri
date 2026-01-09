import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { initializeDatabase } from '@/lib/migrations/init';

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

export async function POST(request: NextRequest) {
  const user = checkAuth(request);
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  if (request.method !== 'POST') {
    return NextResponse.json(
      { error: 'Method not allowed' },
      { status: 405 }
    );
  }

  try {
    await initializeDatabase();

    const { sourceId, sourceType, leadData } = await request.json();

    if (!sourceId || !sourceType || !['client', 'enquiry'].includes(sourceType)) {
      return NextResponse.json(
        { error: 'Invalid source ID or type' },
        { status: 400 }
      );
    }

    if (!leadData) {
      return NextResponse.json(
        { error: 'Lead data is required' },
        { status: 400 }
      );
    }

    let name = leadData.name || '';
    let email = leadData.email || '';
    let phone = leadData.phone || '';

    // Get source data
    if (sourceType === 'client') {
      const client = await sql`
        SELECT first_name, last_name, email, phone FROM clients WHERE id = ${sourceId}
      `;

      if (client.length === 0) {
        return NextResponse.json(
          { error: 'Client not found' },
          { status: 404 }
        );
      }

      name = leadData.name || `${client[0].first_name || ''} ${client[0].last_name || ''}`.trim();
      email = leadData.email || client[0].email || '';
      phone = leadData.phone || client[0].phone || '';
    } else if (sourceType === 'enquiry') {
      const enquiry = await sql`
        SELECT first_name, last_name, email, phone, assigned_to FROM general_enquiries WHERE id = ${sourceId}
      `;

      if (enquiry.length === 0) {
        return NextResponse.json(
          { error: 'Enquiry not found' },
          { status: 404 }
        );
      }

      // Agents can only move enquiries assigned to them
      if (user.role === 'AGENT' && enquiry[0].assigned_to !== user.userId) {
        return NextResponse.json(
          { error: 'You can only move enquiries assigned to you' },
          { status: 403 }
        );
      }

      name = leadData.name || `${enquiry[0].first_name || ''} ${enquiry[0].last_name || ''}`.trim();
      email = leadData.email || enquiry[0].email;
      phone = leadData.phone || enquiry[0].phone || '';
    }

    // Validate phone if provided
    if (phone) {
      const cleanPhone = phone.replace(/\s/g, '');
      const phoneRegex = /^[+]?[\d\s()-]{7,20}$/;
      if (!phoneRegex.test(cleanPhone)) {
        return NextResponse.json(
          { error: 'Please enter a valid phone number' },
          { status: 400 }
        );
      }
    }

    // Determine assigned_to: if agent is moving, assign to them; otherwise use leadData.assigned_to if provided
    let assignedTo = null;
    if (user.role === 'AGENT') {
      assignedTo = user.userId;
    } else if (leadData.assigned_to !== undefined && leadData.assigned_to !== null && leadData.assigned_to !== '') {
      assignedTo = parseInt(leadData.assigned_to, 10);
      if (isNaN(assignedTo)) {
        assignedTo = null;
      }
    }

    // Create lead
    const result = await sql`
      INSERT INTO leads (
        name,
        phone,
        email,
        project_name,
        price,
        type,
        intent,
        event,
        sales_stage,
        status,
        job_title,
        employer,
        property_interests,
        notes,
        client_folder_link,
        nationality,
        date_of_birth,
        home_address,
        assigned_to
      )
      VALUES (
        ${name},
        ${phone},
        ${email || null},
        ${leadData.projectName || null},
        ${leadData.price || null},
        ${leadData.type || null},
        ${leadData.intent || null},
        ${leadData.event || null},
        ${leadData.salesStage || 'New Inquiry'},
        ${leadData.status || 'HOT'},
        ${leadData.job_title || null},
        ${leadData.employer || null},
        ${leadData.property_interests || null},
        ${leadData.notes || null},
        ${leadData.client_folder_link || null},
        ${leadData.nationality || null},
        ${leadData.date_of_birth || null},
        ${leadData.home_address || null},
        ${assignedTo}
      )
      RETURNING *
    `;

    return NextResponse.json({ success: true, lead: result[0] }, { status: 201 });
  } catch (error) {
    console.error('Move to leads error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

