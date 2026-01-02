/**
 * Migration Script to Add assigned_to Column
 * 
 * This script adds the assigned_to column to leads and general_enquiries tables
 * if they don't already exist.
 * 
 * Usage:
 *   npx tsx scripts/migrate-assigned-to.ts
 */

import { neon } from '@neondatabase/serverless';
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

if (!DATABASE_URL) {
  console.error('\x1b[31m❌ Error: DATABASE_URL not found in environment variables\x1b[0m');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function migrate() {
  try {
    console.log('🔄 Running migration to add assigned_to columns...\n');

    // Add assigned_to to leads table
    try {
      await sql`
        ALTER TABLE leads 
        ADD COLUMN assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL;
      `;
      console.log('✅ Added assigned_to column to leads table');
    } catch (e: any) {
      if (e.message?.includes('already exists') || e.message?.includes('duplicate')) {
        console.log('ℹ️  assigned_to column already exists in leads table');
      } else {
        throw e;
      }
    }

    // Add assigned_to to general_enquiries table
    try {
      await sql`
        ALTER TABLE general_enquiries 
        ADD COLUMN assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL;
      `;
      console.log('✅ Added assigned_to column to general_enquiries table');
    } catch (e: any) {
      if (e.message?.includes('already exists') || e.message?.includes('duplicate')) {
        console.log('ℹ️  assigned_to column already exists in general_enquiries table');
      } else {
        throw e;
      }
    }

    console.log('\n\x1b[32m✅ Migration completed successfully!\x1b[0m');
  } catch (error: any) {
    console.error('\n\x1b[31m❌ Migration failed:\x1b[0m', error.message);
    process.exit(1);
  }
}

migrate();

