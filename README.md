# Saabri CRM System

A comprehensive Customer Relationship Management (CRM) system built with Next.js, featuring lead management, enquiry tracking, and team collaboration.

## Features

- **Lead Management**: Track leads with status (HOT/WARM/COLD), sales stages, and assignment
- **Enquiry Management**: Handle customer enquiries and convert them to leads
- **User Management**: Admin and Agent roles with role-based access control
- **Team Assignment**: Assign leads and enquiries to team members
- **Dashboard Analytics**: Real-time statistics and performance metrics
- **Responsive Design**: Modern UI with Tailwind CSS

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (Neon recommended - free tier available)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd saabri
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:
   ```env
   DATABASE_URL=postgresql://username:password@hostname/database?sslmode=require
   JWT_SECRET=your-secure-random-string-here
   ```

   **Getting a Database:**
   - Sign up at [neon.tech](https://neon.tech) (free tier available)
   - Create a new project and copy the connection string
   - Generate JWT_SECRET: `openssl rand -base64 32`

4. **Initialize the database**
   ```bash
   npm run setup-db
   ```

   This creates all tables and sets up:
   - Default admin user: `admin@saabri.com` / `admin123`
   - Two test agent accounts: `agent1@saabri.com` / `agent123` and `agent2@saabri.com` / `agent123`
   - Sample test data (5 enquiries and 5 leads)

   **Custom admin credentials:**
   ```bash
   ADMIN_EMAIL=your@email.com ADMIN_PASSWORD=yourpassword npm run setup-db
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Main site: `http://localhost:3000`
   - Admin panel: `http://localhost:3000/admin/login`
   - Default login: `admin@saabri.com` / `admin123`

## User Roles

### Admin
- Full access to all features
- Can create, edit, and delete users
- Can assign leads/enquiries to agents
- Can view all leads and enquiries
- Can manage all data

### Agent
- Access to dashboard and enquiries
- Can create enquiries (automatically assigned to themselves)
- Can only view leads/enquiries assigned to them
- Can convert assigned enquiries to leads (automatically assigned to themselves)
- Can edit assigned leads/enquiries
- Can delete assigned leads/enquiries
- Cannot create or delete users
- Cannot change assignments

## Database Schema

The system uses three main tables:

- **users**: Admin and agent accounts
- **general_enquiries**: Customer enquiries
- **leads**: Sales leads converted from enquiries

All tables include `assigned_to` foreign key for team assignment.

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Admin APIs (Require Bearer token)
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/leads` - List leads (with filters)
- `POST /api/admin/leads` - Create lead
- `PUT /api/admin/leads` - Update lead
- `DELETE /api/admin/leads` - Delete lead
- `GET /api/admin/enquiries` - List enquiries
- `POST /api/admin/enquiries` - Create enquiry
- `PUT /api/admin/enquiries` - Update enquiry
- `DELETE /api/admin/enquiries` - Delete enquiry
- `POST /api/admin/move-to-leads` - Convert enquiry to lead
- `GET /api/admin/team-members` - Get assignable team members
- `GET /api/admin/users` - List users
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users` - Update user
- `DELETE /api/admin/users` - Delete user

**Example API call:**
```bash
curl -X GET http://localhost:3000/api/admin/leads \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Troubleshooting

### DATABASE_URL not found
- Ensure `.env.local` exists in the root directory
- Verify `DATABASE_URL` is set correctly
- Restart the development server after adding environment variables

### Connection errors
- Verify your database connection string is correct
- Check if your database is accessible (not behind a firewall)
- For Neon, ensure you're using the correct connection string format

### Port already in use
```bash
npm run dev -- -p 3001
```

### User already exists
- The setup script skips duplicate users
- To reset, delete the user from the database first

## Security Notes

- Never commit `.env.local` to version control
- Use strong passwords for admin accounts
- Rotate `JWT_SECRET` regularly in production
- Keep your database connection string secure

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run setup-db` - Initialize database and create admin user
- `npm run migrate-assigned-to` - Add assignment columns to existing tables

## Project Structure

```
src/
├── app/
│   ├── admin/          # Admin panel pages
│   │   ├── dashboard/  # Dashboard with statistics
│   │   ├── enquiries/  # Enquiry management
│   │   ├── users/      # User management
│   │   └── login/      # Login page
│   └── api/            # API routes
│       └── admin/      # Admin API endpoints
├── components/
│   ├── admin/          # Admin-specific components
│   └── ...             # Shared components
└── lib/
    ├── db.ts           # Database connection
    ├── auth.ts         # Authentication utilities
    └── migrations/     # Database schema
```

## License

[Your License Here]
