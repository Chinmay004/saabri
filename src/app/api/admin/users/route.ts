import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { initializeDatabase } from '@/lib/migrations/init';
import bcrypt from 'bcryptjs';

// Middleware to check admin auth
function checkAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== 'ADMIN') {
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
    
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    
    let users;
    if (role) {
      users = await sql`
        SELECT id, email, name, role, phone, profile_image, created_at, updated_at
        FROM users
        WHERE role = ${role} AND role IN ('ADMIN', 'AGENT')
        ORDER BY created_at DESC
      `;
    } else {
      users = await sql`
        SELECT id, email, name, role, phone, profile_image, created_at, updated_at
        FROM users
        WHERE role IN ('ADMIN', 'AGENT')
        ORDER BY created_at DESC
      `;
    }

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Users API error:', error);
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

  try {
    await initializeDatabase();
    
    const { email, password, name, role, phone } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['ADMIN', 'AGENT'];
    const userRole = role || 'AGENT';
    if (!validRoles.includes(userRole)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be ADMIN or AGENT' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existing = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const result = await sql`
      INSERT INTO users (email, password, name, role, phone)
      VALUES (${email}, ${hashedPassword}, ${name || null}, ${userRole}, ${phone || null})
      RETURNING id, email, name, role, phone, profile_image, created_at, updated_at
    `;

    return NextResponse.json({ user: result[0] }, { status: 201 });
  } catch (error: any) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
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
    
    const { id, email, password, name, role, phone } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existing = await sql`
      SELECT id, email FROM users WHERE id = ${id}
    `;

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // If email is being changed, check if new email already exists
    if (email && email !== existing[0].email) {
      const emailCheck = await sql`
        SELECT id FROM users WHERE email = ${email} AND id != ${id}
      `;
      if (emailCheck.length > 0) {
        return NextResponse.json(
          { error: 'Email already in use by another user' },
          { status: 409 }
        );
      }
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

    // Validate password if provided
    if (password && password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Validate role if provided
    if (role) {
      const validRoles = ['ADMIN', 'AGENT'];
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { error: 'Invalid role. Must be ADMIN or AGENT' },
          { status: 400 }
        );
      }
    }

    // Build update query using template literals
    const updateFields: any[] = [];
    
    if (email !== undefined) updateFields.push(sql`email = ${email}`);
    if (name !== undefined) updateFields.push(sql`name = ${name || null}`);
    if (role !== undefined) updateFields.push(sql`role = ${role}`);
    if (phone !== undefined) updateFields.push(sql`phone = ${phone || null}`);
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 12);
      updateFields.push(sql`password = ${hashedPassword}`);
    }
    updateFields.push(sql`updated_at = NOW()`);

    if (updateFields.length === 0) {
      // No updates provided, return current user
      const current = await sql`
        SELECT id, email, name, role, phone, profile_image, created_at, updated_at
        FROM users WHERE id = ${id}
      `;
      return NextResponse.json({ user: current[0] });
    }

    // Build SET clause by manually joining SQL fragments
    // Since sql.join doesn't exist, we'll build it differently
    let setClause = updateFields[0];
    for (let i = 1; i < updateFields.length; i++) {
      setClause = sql`${setClause}, ${updateFields[i]}`;
    }

    const result = await sql`
      UPDATE users 
      SET ${setClause}
      WHERE id = ${id}
      RETURNING id, email, name, role, phone, profile_image, created_at, updated_at
    `;

    return NextResponse.json({ user: result[0] });
  } catch (error: any) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
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
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Prevent deleting yourself
    if (parseInt(id, 10) === user.userId) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existing = await sql`
      SELECT id FROM users WHERE id = ${id}
    `;

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Delete user
    await sql`DELETE FROM users WHERE id = ${id}`;

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

