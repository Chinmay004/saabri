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
    return await getEnquiries(request, user!);
  } catch (error) {
    console.error('General enquiries API error:', error);
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

  // Both admins and agents can create enquiries
  try {
    await initializeDatabase();
    return await createEnquiry(request, user);
  } catch (error) {
    console.error('General enquiries API error:', error);
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
    return await updateEnquiry(request, user);
  } catch (error) {
    console.error('General enquiries API error:', error);
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

  try {
    await initializeDatabase();
    
    // Read request body once
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }
    
    // Agents can only delete enquiries assigned to them
    if (user.role === 'AGENT') {
      // Check if enquiry is assigned to this agent
      const enquiryCheck = await sql`SELECT assigned_to FROM general_enquiries WHERE id = ${id}`;
      if (enquiryCheck.length === 0) {
        return NextResponse.json(
          { error: 'Enquiry not found' },
          { status: 404 }
        );
      }
      
      if (enquiryCheck[0].assigned_to !== user.userId) {
        return NextResponse.json(
          { error: 'You can only delete enquiries assigned to you' },
          { status: 403 }
        );
      }
    }
    
    return await deleteEnquiry(id);
  } catch (error) {
    console.error('General enquiries API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getEnquiries(request: NextRequest, user: any) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  const status = searchParams.get('status');
  const assignedTo = searchParams.get('assignedTo');

  // Pagination params (defaults)
  const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
  const pageSize = Math.max(parseInt(searchParams.get('pageSize') || '10', 10), 1);
  const offset = (page - 1) * pageSize;

  // Initialize database (creates table if doesn't exist)
  await initializeDatabase();

  const filters: any[] = [];

  // If user is AGENT, only show enquiries assigned to them
  if (user.role === 'AGENT') {
    filters.push(sql`e.assigned_to = ${user.userId}`);
  }

  if (status && status !== 'all') {
    filters.push(sql`e.status = ${status.toUpperCase()}`);
  }

  if (assignedTo && assignedTo !== 'all' && user.role === 'ADMIN') {
    if (assignedTo === 'unassigned') {
      filters.push(sql`e.assigned_to IS NULL`);
    } else {
      filters.push(sql`e.assigned_to = ${parseInt(assignedTo, 10)}`);
    }
  }

  if (search) {
    const q = `%${search.toLowerCase()}%`;
    filters.push(
      sql`(
        LOWER(e.first_name) LIKE ${q} OR
        LOWER(e.last_name) LIKE ${q} OR
        LOWER(e.email) LIKE ${q} OR
        LOWER(e.subject) LIKE ${q} OR
        LOWER(e.message) LIKE ${q}
      )`
    );
  }

  // Build WHERE clause manually (since sql.join doesn't exist)
  let whereClause = sql``;
  if (filters.length > 0) {
    let clause = filters[0];
    for (let i = 1; i < filters.length; i++) {
      clause = sql`${clause} AND ${filters[i]}`;
    }
    whereClause = sql`WHERE ${clause}`;
  }

  const totalResult = await sql`SELECT COUNT(*)::int AS count FROM general_enquiries e ${whereClause}`;
  const total = totalResult?.[0]?.count || 0;

  const enquiries = await sql`
    SELECT 
      e.*,
      u.id as assigned_user_id,
      u.name as assigned_user_name,
      u.email as assigned_user_email
    FROM general_enquiries e
    LEFT JOIN users u ON e.assigned_to = u.id
    ${whereClause}
    ORDER BY e.created_at DESC
    LIMIT ${pageSize} OFFSET ${offset}
  `;

  return NextResponse.json({
    enquiries,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
    },
  });
}

async function createEnquiry(request: NextRequest, user: any) {
  const {
    first_name,
    last_name,
    email,
    phone,
    subject,
    message,
    event,
    job_title,
    employer,
    property_interests,
    notes,
    client_folder_link,
    nationality,
    date_of_birth,
    home_address,
    assigned_to,
  } = await request.json();

  // Validate required fields
  if (!email || !phone) {
    return NextResponse.json(
      { error: 'Email and phone are required' },
      { status: 400 }
    );
  }

  await initializeDatabase();

  // Determine assignment: if agent creates enquiry, auto-assign to them
  // If admin creates enquiry, use the assigned_to value from request (can be null)
  let finalAssignedTo = null;
  if (user.role === 'AGENT') {
    finalAssignedTo = user.userId;
  } else if (assigned_to !== undefined && assigned_to !== null && assigned_to !== '') {
    finalAssignedTo = parseInt(assigned_to, 10);
    if (isNaN(finalAssignedTo)) {
      finalAssignedTo = null;
    }
  }

  const result = await sql`
    INSERT INTO general_enquiries (
      first_name,
      last_name,
      email,
      phone,
      subject,
      message,
      event,
      job_title,
      employer,
      property_interests,
      notes,
      client_folder_link,
      nationality,
      date_of_birth,
      home_address,
      status,
      assigned_to
    )
    VALUES (
      ${first_name || null},
      ${last_name || null},
      ${email},
      ${phone},
      ${subject || 'Manual Entry'},
      ${message || 'N/A'},
      ${event || null},
      ${job_title || null},
      ${employer || null},
      ${property_interests || null},
      ${notes || null},
      ${client_folder_link || null},
      ${nationality || null},
      ${date_of_birth || null},
      ${home_address || null},
      'HOT',
      ${finalAssignedTo}
    )
    RETURNING *
  `;

  return NextResponse.json({ enquiry: result[0] }, { status: 201 });
}

async function updateEnquiry(request: NextRequest, user: any) {
  const { id, ...updates } = await request.json();

  if (!id) {
    return NextResponse.json(
      { error: 'ID is required' },
      { status: 400 }
    );
  }

  // Agents can only update enquiries assigned to them
  if (user.role === 'AGENT') {
    const enquiryCheck = await sql`SELECT assigned_to FROM general_enquiries WHERE id = ${id}`;
    if (enquiryCheck.length === 0 || enquiryCheck[0].assigned_to !== user.userId) {
      return NextResponse.json(
        { error: 'You can only update enquiries assigned to you' },
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

  // Build update fields manually (since sql.join doesn't exist)
  const updateFields: any[] = [];
  
  if (updates.first_name !== undefined) updateFields.push(sql`first_name = ${updates.first_name || null}`);
  if (updates.last_name !== undefined) updateFields.push(sql`last_name = ${updates.last_name || null}`);
  if (updates.email !== undefined) updateFields.push(sql`email = ${updates.email}`);
  if (updates.phone !== undefined) updateFields.push(sql`phone = ${updates.phone}`);
  if (updates.subject !== undefined) updateFields.push(sql`subject = ${updates.subject || null}`);
  if (updates.event !== undefined) updateFields.push(sql`event = ${updates.event || null}`);
  if (updates.message !== undefined) updateFields.push(sql`message = ${updates.message || null}`);
  if (updates.job_title !== undefined) updateFields.push(sql`job_title = ${updates.job_title || null}`);
  if (updates.employer !== undefined) updateFields.push(sql`employer = ${updates.employer || null}`);
  if (updates.property_interests !== undefined) updateFields.push(sql`property_interests = ${updates.property_interests || null}`);
  if (updates.notes !== undefined) updateFields.push(sql`notes = ${updates.notes || null}`);
  if (updates.client_folder_link !== undefined) updateFields.push(sql`client_folder_link = ${updates.client_folder_link || null}`);
  if (updates.nationality !== undefined) updateFields.push(sql`nationality = ${updates.nationality || null}`);
  if (updates.date_of_birth !== undefined) updateFields.push(sql`date_of_birth = ${updates.date_of_birth || null}`);
  if (updates.home_address !== undefined) updateFields.push(sql`home_address = ${updates.home_address || null}`);
  if (updates.status !== undefined) updateFields.push(sql`status = ${updates.status}`);
  if (assignedToValue !== undefined) updateFields.push(sql`assigned_to = ${assignedToValue}`);
  
  updateFields.push(sql`updated_at = NOW()`);

  if (updateFields.length === 0) {
    // No fields to update, just return the enquiry
    const current = await sql`SELECT * FROM general_enquiries WHERE id = ${id}`;
    if (current.length === 0) {
      return NextResponse.json(
        { error: 'Enquiry not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ enquiry: current[0] });
  }

  // Build SET clause manually
  let setClause = updateFields[0];
  for (let i = 1; i < updateFields.length; i++) {
    setClause = sql`${setClause}, ${updateFields[i]}`;
  }

  const result = await sql`
    UPDATE general_enquiries 
    SET ${setClause}
    WHERE id = ${id}
    RETURNING *
  `;

  if (result.length === 0) {
    return NextResponse.json(
      { error: 'Enquiry not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ enquiry: result[0] });
}

async function deleteEnquiry(id: number) {
  await sql`DELETE FROM general_enquiries WHERE id = ${id}`;

  return NextResponse.json({ success: true });
}

