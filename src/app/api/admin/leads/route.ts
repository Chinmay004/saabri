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

export async function GET(request: NextRequest) {
  const user = checkAuth(request);
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    await initializeDatabase();
    return await getLeads(request, user);
  } catch (error) {
    console.error('Leads API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const user = checkAuth(request);
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Only admins can create leads
  if (user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Only admins can create leads' },
      { status: 403 }
    );
  }

  try {
    await initializeDatabase();
    return await createLead(request);
  } catch (error) {
    console.error('Leads API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const user = checkAuth(request);
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    await initializeDatabase();
    return await updateLead(request, user);
  } catch (error) {
    console.error('Leads API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const user = checkAuth(request);
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Only admins can delete leads
  if (user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Only admins can delete leads' },
      { status: 403 }
    );
  }

  try {
    await initializeDatabase();
    return await deleteLead(request);
  } catch (error) {
    console.error('Leads API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getLeads(request: NextRequest, user: any) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const search = searchParams.get('search');
  const assignedTo = searchParams.get('assignedTo');
  const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
  const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '10', 10), 1), 100);
  const offset = (page - 1) * pageSize;

  // Build WHERE conditions
  const conditions: any[] = [];
  
  // If user is AGENT, only show leads assigned to them
  if (user.role === 'AGENT') {
    conditions.push(sql`assigned_to = ${user.userId}`);
  }
  
  if (status && status !== 'all') {
    conditions.push(sql`status = ${status.toUpperCase()}`);
  }
  
  if (assignedTo && assignedTo !== 'all' && user.role === 'ADMIN') {
    if (assignedTo === 'unassigned') {
      conditions.push(sql`assigned_to IS NULL`);
    } else {
      conditions.push(sql`assigned_to = ${parseInt(assignedTo, 10)}`);
    }
  }
  
  if (search) {
    const searchTerm = `%${search.toLowerCase()}%`;
    conditions.push(sql`(LOWER(name) LIKE ${searchTerm} OR LOWER(project_name) LIKE ${searchTerm})`);
  }

  // Build WHERE clause manually (since sql.join doesn't exist)
  let whereClause = sql``;
  if (conditions.length > 0) {
    let clause = conditions[0];
    for (let i = 1; i < conditions.length; i++) {
      clause = sql`${clause} AND ${conditions[i]}`;
    }
    whereClause = sql`WHERE ${clause}`;
  }

  // Get total count
  const totalResult = await sql`
    SELECT COUNT(*) AS count FROM leads ${whereClause}
  `;

  // Get leads with assigned user info
  const leads = await sql`
    SELECT 
      l.*,
      u.id as assigned_user_id,
      u.name as assigned_user_name,
      u.email as assigned_user_email
    FROM leads l
    LEFT JOIN users u ON l.assigned_to = u.id
    ${whereClause}
    ORDER BY l.created_at DESC
    LIMIT ${pageSize} OFFSET ${offset}
  `;

  const total = parseInt(totalResult[0]?.count || '0', 10);
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  return NextResponse.json({
    leads,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
    },
  });
}

async function createLead(request: NextRequest) {
  const { name, phone, email, project_name, type, price, status, sales_stage } = await request.json();

  if (!name || !phone) {
    return NextResponse.json(
      { error: 'Name and phone are required' },
      { status: 400 }
    );
  }

  // Validate phone - allow digits, spaces, +, -, parentheses (7-20 chars)
  const cleanPhone = phone.replace(/\s/g, '');
  const phoneRegex = /^[+]?[\d\s()-]{7,20}$/;
  if (!phoneRegex.test(cleanPhone)) {
    return NextResponse.json(
      { error: 'Please enter a valid phone number' },
      { status: 400 }
    );
  }

  // Validate email if provided
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }
  }

  const result = await sql`
    INSERT INTO leads (
      name,
      phone,
      email,
      project_name,
      type,
      price,
      status,
      sales_stage
    )
    VALUES (
      ${name},
      ${phone},
      ${email || null},
      ${project_name || null},
      ${type || null},
      ${price || null},
      ${status || 'HOT'},
      ${sales_stage || 'New Inquiry'}
    )
    RETURNING *
  `;

  return NextResponse.json({ lead: result[0] }, { status: 201 });
}

async function updateLead(request: NextRequest, user: any) {
  const { id, ...updates } = await request.json();
  
  if (!id) {
    return NextResponse.json(
      { error: 'Lead ID is required' },
      { status: 400 }
    );
  }

  // Agents can only update leads assigned to them
  if (user.role === 'AGENT') {
    const leadCheck = await sql`SELECT assigned_to FROM leads WHERE id = ${id}`;
    if (leadCheck.length === 0 || leadCheck[0].assigned_to !== user.userId) {
      return NextResponse.json(
        { error: 'You can only update leads assigned to you' },
        { status: 403 }
      );
    }
    // Agents cannot change assignment
    if ('assigned_to' in updates) {
      delete updates.assigned_to;
    }
  }

  // Handle assigned_to separately to allow null values
  let assignedToValue: number | null | undefined = undefined;
  if ('assigned_to' in updates) {
    if (updates.assigned_to === null || updates.assigned_to === '' || updates.assigned_to === undefined) {
      assignedToValue = null;
    } else {
      assignedToValue = parseInt(updates.assigned_to, 10);
      if (isNaN(assignedToValue)) {
        assignedToValue = null;
      }
    }
  }

  // Build dynamic update - only update fields that are provided
  const updateFields: any[] = [];
  
  if (updates.name !== undefined) updateFields.push(sql`name = ${updates.name}`);
  if (updates.phone !== undefined) updateFields.push(sql`phone = ${updates.phone}`);
  if (updates.email !== undefined) updateFields.push(sql`email = ${updates.email}`);
  if (updates.project_name !== undefined) updateFields.push(sql`project_name = ${updates.project_name}`);
  if (updates.type !== undefined) updateFields.push(sql`type = ${updates.type}`);
  if (updates.price !== undefined) updateFields.push(sql`price = ${updates.price}`);
  if (updates.status !== undefined) updateFields.push(sql`status = ${updates.status}`);
  if (updates.sales_stage !== undefined) updateFields.push(sql`sales_stage = ${updates.sales_stage}`);
  if (updates.job_title !== undefined) updateFields.push(sql`job_title = ${updates.job_title}`);
  if (updates.employer !== undefined) updateFields.push(sql`employer = ${updates.employer}`);
  if (updates.property_interests !== undefined) updateFields.push(sql`property_interests = ${updates.property_interests}`);
  if (updates.notes !== undefined) updateFields.push(sql`notes = ${updates.notes}`);
  if (updates.client_folder_link !== undefined) updateFields.push(sql`client_folder_link = ${updates.client_folder_link}`);
  if (updates.nationality !== undefined) updateFields.push(sql`nationality = ${updates.nationality}`);
  if (updates.date_of_birth !== undefined) updateFields.push(sql`date_of_birth = ${updates.date_of_birth}`);
  if (updates.home_address !== undefined) updateFields.push(sql`home_address = ${updates.home_address}`);
  if (assignedToValue !== undefined) updateFields.push(sql`assigned_to = ${assignedToValue}`);
  
  updateFields.push(sql`updated_at = NOW()`);

  if (updateFields.length === 0) {
    // No fields to update, just return the lead
    const current = await sql`SELECT * FROM leads WHERE id = ${id}`;
    if (current.length === 0) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ lead: current[0] });
  }

  // Build SET clause by manually joining SQL fragments
  // Since sql.join doesn't exist, we'll build it differently
  let setClause = updateFields[0];
  for (let i = 1; i < updateFields.length; i++) {
    setClause = sql`${setClause}, ${updateFields[i]}`;
  }

  const result = await sql`
    UPDATE leads 
    SET ${setClause}
    WHERE id = ${id}
    RETURNING *
  `;

  if (result.length === 0) {
    return NextResponse.json(
      { error: 'Lead not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ lead: result[0] });
}

async function deleteLead(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { error: 'Lead ID is required' },
      { status: 400 }
    );
  }

  const result = await sql`DELETE FROM leads WHERE id = ${id} RETURNING id`;

  if (result.length === 0) {
    return NextResponse.json(
      { error: 'Lead not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ message: 'Lead deleted successfully' });
}

