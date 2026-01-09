import sql from '../db';

export async function initializeDatabase() {
  try {
    // Create users table if it doesn't exist
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

    // Create general_enquiries table (unified clients + enquiries)
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

    // Drop name column if it exists (consolidate to first_name/last_name)
    try {
      await sql`
        ALTER TABLE general_enquiries
        DROP COLUMN IF EXISTS name
      `;
    } catch (e) {
      // Ignore if column doesn't exist
    }

    // Create leads table if it doesn't exist
    try {
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
          home_address TEXT
        )
      `;
    } catch (e) {
      // Table might already exist, ignore error
    }

    // Add missing columns to leads table if they don't exist
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
      // ignore if already exists
    }

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

