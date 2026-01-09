/**
 * Database Setup Script
 * 
 * This script initializes the database tables and creates an admin user.
 * 
 * Usage:
 *   npx tsx scripts/setup-db.ts
 * 
 * Or with custom credentials:
 *   ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=password123 npx tsx scripts/setup-db.ts
 */

import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

// Load environment variables from .env.local
const envPath = resolve(process.cwd(), '.env.local');
if (existsSync(envPath)) {
  config({ path: envPath });
} else {
  // Also try .env as fallback
  config({ path: resolve(process.cwd(), '.env') });
}

// Get environment variables
const DATABASE_URL = process.env.DATABASE_URL;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@saabri.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Admin User';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

if (!DATABASE_URL) {
  console.error('\x1b[31m❌ Error: DATABASE_URL not found in environment variables\x1b[0m');
  console.error('\nPlease create a .env.local file in the root directory with:');
  console.error('  DATABASE_URL=postgresql://username:password@hostname/database?sslmode=require');
  console.error('  JWT_SECRET=your-secure-random-string\n');
  console.error('Example:');
  console.error('  1. Create .env.local file');
  console.error('  2. Add: DATABASE_URL=your_connection_string_here');
  console.error('  3. Run: npm run setup-db\n');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function initializeDatabase() {
  try {
    console.log('📦 Initializing database tables...');

    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'USER',
        phone VARCHAR(20),
        profile_image VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create general_enquiries table
    await sql`
      CREATE TABLE IF NOT EXISTS general_enquiries (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        event VARCHAR(255),
        message TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'HOT',
        job_title VARCHAR(255),
        employer VARCHAR(255),
        property_interests TEXT,
        notes TEXT,
        client_folder_link VARCHAR(500),
        nationality VARCHAR(255),
        date_of_birth DATE,
        home_address TEXT,
        assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Drop name column if it exists
    try {
      await sql`ALTER TABLE general_enquiries DROP COLUMN IF EXISTS name`;
    } catch (e) {
      // Ignore if column doesn't exist
    }

    // Create leads table
    await sql`
      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(255),
        property_id VARCHAR(255),
        status VARCHAR(50) DEFAULT 'HOT',
        sales_stage VARCHAR(255) DEFAULT 'New Inquiry',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        price FLOAT,
        project_name VARCHAR(255),
        type VARCHAR(100),
        intent VARCHAR(255),
        event VARCHAR(255),
        job_title VARCHAR(255),
        employer VARCHAR(255),
        property_interests TEXT,
        notes TEXT,
        client_folder_link VARCHAR(500),
        nationality VARCHAR(255),
        date_of_birth DATE,
        home_address TEXT,
        assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL
      )
    `;

    // Add missing columns to leads table
    try {
      await sql`
        ALTER TABLE leads ADD COLUMN IF NOT EXISTS job_title VARCHAR(255);
        ALTER TABLE leads ADD COLUMN IF NOT EXISTS employer VARCHAR(255);
        ALTER TABLE leads ADD COLUMN IF NOT EXISTS property_interests TEXT;
        ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes TEXT;
        ALTER TABLE leads ADD COLUMN IF NOT EXISTS client_folder_link VARCHAR(500);
        ALTER TABLE leads ADD COLUMN IF NOT EXISTS nationality VARCHAR(255);
        ALTER TABLE leads ADD COLUMN IF NOT EXISTS date_of_birth DATE;
        ALTER TABLE leads ADD COLUMN IF NOT EXISTS home_address TEXT;
        ALTER TABLE leads ADD COLUMN IF NOT EXISTS sales_stage VARCHAR(255) DEFAULT 'New Inquiry';
        ALTER TABLE leads ADD COLUMN IF NOT EXISTS intent VARCHAR(255);
        ALTER TABLE leads ADD COLUMN IF NOT EXISTS event VARCHAR(255);
        ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL;
      `;
    } catch (e) {
      // Ignore if columns already exist
    }

    // Add missing columns to general_enquiries table
    try {
      await sql`
        ALTER TABLE general_enquiries ADD COLUMN IF NOT EXISTS assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL;
      `;
    } catch (e) {
      // Ignore if column already exists
    }

    console.log('✅ Database tables initialized successfully');
  } catch (error: any) {
    console.error('❌ Database initialization error:', error.message);
    throw error;
  }
}

async function createAdminUser() {
  try {
    console.log('👤 Creating admin user...');

    // Check if user already exists
    const existing = await sql`SELECT id, email, role FROM users WHERE email = ${ADMIN_EMAIL}`;
    
    if (existing.length > 0) {
      if (existing[0].role === 'ADMIN') {
        console.log(`\x1b[33m⚠️  User ${ADMIN_EMAIL} is already an admin.\x1b[0m`);
        return;
      } else {
        // Update existing user to admin
        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);
        await sql`UPDATE users SET role = 'ADMIN', password = ${hashedPassword} WHERE email = ${ADMIN_EMAIL}`;
        console.log(`\x1b[32m✅ Updated ${ADMIN_EMAIL} to admin role.\x1b[0m`);
        return;
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

    // Create new admin user
    const result = await sql`
      INSERT INTO users (email, name, password, role)
      VALUES (${ADMIN_EMAIL}, ${ADMIN_NAME}, ${hashedPassword}, 'ADMIN')
      RETURNING id, email, name, role
    `;

    console.log('\x1b[32m✅ Admin user created successfully!\x1b[0m');
    console.log('\n📋 User details:');
    console.log(`   ID: ${result[0].id}`);
    console.log(`   Email: ${result[0].email}`);
    console.log(`   Name: ${result[0].name || '(not set)'}`);
    console.log(`   Role: ${result[0].role}`);
    console.log(`\n🔑 Login credentials:`);
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log(`\n🌐 You can now login at http://localhost:3000/admin/login`);
  } catch (error: any) {
    console.error('\x1b[31m❌ Error creating admin user:\x1b[0m', error.message);
    throw error;
  }
}

async function createAgentUsers() {
  try {
    console.log('👥 Creating agent users...');

    const agents = [
      { email: 'agent1@saabri.com', name: 'Agent One', password: 'agent123' },
      { email: 'agent2@saabri.com', name: 'Agent Two', password: 'agent123' },
    ];

    const createdAgents: any[] = [];

    for (const agent of agents) {
      // Check if user already exists
      const existing = await sql`SELECT id, email, role FROM users WHERE email = ${agent.email}`;
      
      if (existing.length > 0) {
        if (existing[0].role === 'AGENT') {
          console.log(`\x1b[33m⚠️  User ${agent.email} already exists as agent.\x1b[0m`);
          createdAgents.push(existing[0]);
          continue;
        } else {
          // Update existing user to agent
          const hashedPassword = await bcrypt.hash(agent.password, 12);
          const result = await sql`
            UPDATE users 
            SET role = 'AGENT', password = ${hashedPassword}, name = ${agent.name}
            WHERE email = ${agent.email}
            RETURNING id, email, name, role
          `;
          console.log(`\x1b[32m✅ Updated ${agent.email} to agent role.\x1b[0m`);
          createdAgents.push(result[0]);
          continue;
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(agent.password, 12);

      // Create new agent user
      const result = await sql`
        INSERT INTO users (email, name, password, role)
        VALUES (${agent.email}, ${agent.name}, ${hashedPassword}, 'AGENT')
        RETURNING id, email, name, role
      `;

      console.log(`\x1b[32m✅ Agent ${agent.name} created successfully!\x1b[0m`);
      createdAgents.push(result[0]);
    }

    console.log('\n📋 Agent credentials:');
    agents.forEach((agent, index) => {
      console.log(`   Agent ${index + 1}:`);
      console.log(`     Email: ${agent.email}`);
      console.log(`     Password: ${agent.password}`);
    });

    return createdAgents;
  } catch (error: any) {
    console.error('\x1b[31m❌ Error creating agent users:\x1b[0m', error.message);
    throw error;
  }
}

async function createTestData(agents: any[]) {
  try {
    console.log('\n📝 Creating test data...');

    if (agents.length < 2) {
      console.log('\x1b[33m⚠️  Need at least 2 agents to create test data. Skipping...\x1b[0m');
      return;
    }

    const agent1Id = agents[0].id;
    const agent2Id = agents[1].id;

    // Create test enquiries
    const testEnquiries = [
      {
        first_name: 'Ahmed',
        last_name: 'Al Mansoori',
        email: 'ahmed.almansoori@example.com',
        phone: '+971501234567',
        subject: 'Interested in 2 BHK Apartment',
        message: 'I am looking for a 2 BHK apartment in Dubai Marina area. Budget is around 1.5M AED.',
        status: 'HOT',
        event: 'Website Inquiry',
        job_title: 'Software Engineer',
        employer: 'Tech Corp',
        property_interests: '2 BHK, Dubai Marina',
        nationality: 'UAE',
        assigned_to: agent1Id,
      },
      {
        first_name: 'Sarah',
        last_name: 'Johnson',
        email: 'sarah.johnson@example.com',
        phone: '+971502345678',
        subject: 'Villa Inquiry - Palm Jumeirah',
        message: 'Looking for a luxury villa in Palm Jumeirah. Investment property.',
        status: 'WARM',
        event: 'Phone Call',
        job_title: 'Business Owner',
        employer: 'Johnson Enterprises',
        property_interests: 'Villa, Palm Jumeirah',
        nationality: 'UK',
        assigned_to: agent1Id,
      },
      {
        first_name: 'Mohammed',
        last_name: 'Hassan',
        email: 'mohammed.hassan@example.com',
        phone: '+971503456789',
        subject: 'Studio Apartment - Downtown Dubai',
        message: 'Interested in a studio apartment in Downtown Dubai for rental income.',
        status: 'HOT',
        event: 'Website Inquiry',
        job_title: 'Investment Advisor',
        employer: 'Finance Group',
        property_interests: 'Studio, Downtown Dubai',
        nationality: 'Lebanon',
        assigned_to: agent2Id,
      },
      {
        first_name: 'Emma',
        last_name: 'Williams',
        email: 'emma.williams@example.com',
        phone: '+971504567890',
        subject: '3 BHK Apartment - Business Bay',
        message: 'Looking for a 3 BHK apartment in Business Bay for primary residence.',
        status: 'WARM',
        event: 'Referral',
        job_title: 'Marketing Director',
        employer: 'Global Marketing',
        property_interests: '3 BHK, Business Bay',
        nationality: 'USA',
        assigned_to: agent2Id,
      },
      {
        first_name: 'Omar',
        last_name: 'Ibrahim',
        email: 'omar.ibrahim@example.com',
        phone: '+971505678901',
        subject: 'Penthouse - Burj Khalifa Area',
        message: 'Interested in a luxury penthouse near Burj Khalifa.',
        status: 'HOT',
        event: 'Website Inquiry',
        job_title: 'CEO',
        employer: 'Tech Innovations',
        property_interests: 'Penthouse, Burj Khalifa',
        nationality: 'Egypt',
        assigned_to: null, // Unassigned
      },
    ];

    // Create test leads
    const testLeads = [
      {
        name: 'Fatima Al Zaabi',
        phone: '+971506789012',
        email: 'fatima.alzaabi@example.com',
        project_name: 'Marina Bay Towers',
        price: 2500000,
        type: '2 BHK',
        status: 'HOT',
        sales_stage: 'Qualified Lead',
        intent: 'Investment Property',
        job_title: 'Real Estate Investor',
        employer: 'Al Zaabi Investments',
        property_interests: '2 BHK, Marina Bay',
        nationality: 'UAE',
        assigned_to: agent1Id,
      },
      {
        name: 'David Chen',
        phone: '+971507890123',
        email: 'david.chen@example.com',
        project_name: 'Palm Residences',
        price: 5000000,
        type: 'Villa',
        status: 'WARM',
        sales_stage: 'Initial Contact',
        intent: 'Primary Residence',
        job_title: 'Executive Director',
        employer: 'International Corp',
        property_interests: 'Villa, Palm Jumeirah',
        nationality: 'Singapore',
        assigned_to: agent1Id,
      },
      {
        name: 'Layla Mohammed',
        phone: '+971508901234',
        email: 'layla.mohammed@example.com',
        project_name: 'Downtown Heights',
        price: 1200000,
        type: '1 BHK',
        status: 'HOT',
        sales_stage: 'Proposal Sent',
        intent: 'Investment Property',
        job_title: 'Financial Analyst',
        employer: 'Bank of Dubai',
        property_interests: '1 BHK, Downtown',
        nationality: 'UAE',
        assigned_to: agent2Id,
      },
      {
        name: 'James Wilson',
        phone: '+971509012345',
        email: 'james.wilson@example.com',
        project_name: 'Business Bay Towers',
        price: 3200000,
        type: '3 BHK',
        status: 'WARM',
        sales_stage: 'Negotiation',
        intent: 'Primary Residence',
        job_title: 'Senior Manager',
        employer: 'Consulting Group',
        property_interests: '3 BHK, Business Bay',
        nationality: 'Australia',
        assigned_to: agent2Id,
      },
      {
        name: 'Noor Al Shamsi',
        phone: '+971500123456',
        email: 'noor.alshamsi@example.com',
        project_name: 'Luxury Penthouses',
        price: 8000000,
        type: 'Penthouse',
        status: 'HOT',
        sales_stage: 'Contract Review',
        intent: 'Investment Property',
        job_title: 'Property Developer',
        employer: 'Al Shamsi Developments',
        property_interests: 'Penthouse, Burj Khalifa',
        nationality: 'UAE',
        assigned_to: null, // Unassigned
      },
    ];

    // Insert test enquiries
    let enquiryCount = 0;
    for (const enquiry of testEnquiries) {
      try {
        await sql`
          INSERT INTO general_enquiries (
            first_name, last_name, email, phone, subject, message, status,
            event, job_title, employer, property_interests, nationality, assigned_to
          )
          VALUES (
            ${enquiry.first_name}, ${enquiry.last_name}, ${enquiry.email}, ${enquiry.phone},
            ${enquiry.subject}, ${enquiry.message}, ${enquiry.status}, ${enquiry.event},
            ${enquiry.job_title}, ${enquiry.employer}, ${enquiry.property_interests},
            ${enquiry.nationality}, ${enquiry.assigned_to}
          )
        `;
        enquiryCount++;
      } catch (e: any) {
        // Skip if duplicate or error
        if (!e.message?.includes('duplicate')) {
          console.log(`\x1b[33m⚠️  Could not create enquiry for ${enquiry.email}: ${e.message}\x1b[0m`);
        }
      }
    }

    // Insert test leads
    let leadCount = 0;
    for (const lead of testLeads) {
      try {
        await sql`
          INSERT INTO leads (
            name, phone, email, project_name, price, type, status, sales_stage,
            intent, job_title, employer, property_interests, nationality, assigned_to
          )
          VALUES (
            ${lead.name}, ${lead.phone}, ${lead.email}, ${lead.project_name},
            ${lead.price}, ${lead.type}, ${lead.status}, ${lead.sales_stage},
            ${lead.intent}, ${lead.job_title}, ${lead.employer}, ${lead.property_interests},
            ${lead.nationality}, ${lead.assigned_to}
          )
        `;
        leadCount++;
      } catch (e: any) {
        // Skip if duplicate or error
        if (!e.message?.includes('duplicate')) {
          console.log(`\x1b[33m⚠️  Could not create lead for ${lead.email}: ${e.message}\x1b[0m`);
        }
      }
    }

    console.log(`\x1b[32m✅ Created ${enquiryCount} test enquiries and ${leadCount} test leads!\x1b[0m`);
    console.log(`\n📊 Assignment Summary:`);
    console.log(`   - Enquiries assigned to Agent 1: 2`);
    console.log(`   - Enquiries assigned to Agent 2: 2`);
    console.log(`   - Unassigned enquiries: 1`);
    console.log(`   - Leads assigned to Agent 1: 2`);
    console.log(`   - Leads assigned to Agent 2: 2`);
    console.log(`   - Unassigned leads: 1`);
  } catch (error: any) {
    console.error('\x1b[31m❌ Error creating test data:\x1b[0m', error.message);
    throw error;
  }
}

async function setup() {
  try {
    console.log('🚀 Starting database setup...\n');
    
    await initializeDatabase();
    await createAdminUser();
    const agents = await createAgentUsers();
    await createTestData(agents);
    
    console.log('\n\x1b[32m✅ Database setup completed successfully!\x1b[0m');
    console.log('\n⚠️  Important:');
    console.log('   - Make sure JWT_SECRET is set in your .env.local file');
    console.log('   - Change the default admin password after first login');
    console.log('   - Keep your DATABASE_URL secure and never commit it to version control');
    console.log('\n📋 Test Accounts Created:');
    console.log('   Admin: admin@saabri.com / admin123');
    console.log('   Agent 1: agent1@saabri.com / agent123');
    console.log('   Agent 2: agent2@saabri.com / agent123');
    console.log('\n🌐 You can now login at http://localhost:3000/admin/login\n');
  } catch (error: any) {
    console.error('\n\x1b[31m❌ Setup failed:\x1b[0m', error.message);
    process.exit(1);
  }
}

setup();

