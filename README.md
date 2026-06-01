# StaffClock Backend API

A production-ready Node.js backend for employee time tracking and workforce management with role-based access control.

## Features

- **Time & Attendance** - Clock in/out, break tracking, work duration calculation
- **Shift Scheduling** - Create, manage, and track employee shifts
- **Leave Management** - Request, approve, and track leave/PTO
- **User Management** - RBAC with Staff, Security, Admin, CEO roles
- **Email Verification** - Signup with email verification and password reset
- **Swagger Documentation** - Interactive API docs at `/api/docs`
- **Production Ready** - DATABASE_URL, SSL, graceful shutdown

## Architecture

```
src/
├── config/                 # Constants, environment, permissions
├── controllers/            # HTTP request handlers
├── database/
│   ├── config/             # Sequelize CLI config
│   ├── migrations/         # Database migrations
│   ├── models/             # Sequelize models (auto-loaded)
│   └── seeders/            # Database seeders
├── docs/                   # OpenAPI documentation (auto-loaded)
│   ├── schemas/            # Schema definitions
│   └── paths/              # Path definitions
├── emails/                 # Email service and templates
├── middleware/             # Auth, validation, error handling
├── routes/                 # API route definitions
├── services/               # Business logic layer
├── utils/                  # ApiResponse, AppError, Pagination
└── validators/             # Request validation
```

## Quick Start

```bash
# Install
npm install

# Configure
cp .env.example .env

# Database setup
createdb staffclock
npm run db:migrate
npm run db:seed

# Run
npm run dev
```

## Environment Variables

```bash
# Server
NODE_ENV=development
PORT=3000

# Database (URL-based for all environments)
DATABASE_URL=postgres://postgres:postgres@localhost:5432/staffclock

# JWT (REQUIRED in production)
JWT_SECRET=your-secret-min-32-chars

# Email (REQUIRED in production)
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your-password
SMTP_FROM=noreply@yourdomain.com

# App
APP_NAME=StaffClock
APP_URL=http://localhost:3000
```

## API Endpoints

### Authentication

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/signup` | Register account | Public |
| GET | `/api/auth/verify-email` | Verify email | Public |
| POST | `/api/auth/resend-verification` | Resend verification | Public |
| POST | `/api/auth/forgot-password` | Request password reset | Public |
| POST | `/api/auth/reset-password` | Reset password | Public |
| POST | `/api/auth/login` | Login | Public |
| POST | `/api/auth/logout` | Logout | Auth |
| GET | `/api/auth/me` | Get profile | Auth |
| PUT | `/api/auth/password` | Change password | Auth |

### Attendance

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/attendance/clock-in` | Clock in | All |
| POST | `/api/attendance/clock-out` | Clock out | All |
| POST | `/api/attendance/break/start` | Start break | All |
| POST | `/api/attendance/break/end` | End break | All |
| GET | `/api/attendance/status` | Current status | All |
| GET | `/api/attendance/my` | Own records | All |
| GET | `/api/attendance/my/summary` | Own summary | All |
| GET | `/api/attendance` | All records | Admin |
| GET | `/api/attendance/user/:userId` | User records | Admin |

### Shifts

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/shifts` | Create shift | Admin |
| POST | `/api/shifts/bulk` | Bulk create | Admin |
| GET | `/api/shifts/my` | Own shifts | All |
| GET | `/api/shifts` | All shifts | Admin |
| GET | `/api/shifts/week` | Week schedule | Admin |
| PUT | `/api/shifts/:id` | Update shift | Admin |
| POST | `/api/shifts/:id/cancel` | Cancel shift | Admin |
| DELETE | `/api/shifts/:id` | Delete shift | Admin |

### Leaves

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/leaves` | Request leave | All |
| GET | `/api/leaves/my` | Own requests | All |
| GET | `/api/leaves/my/balance` | Own balance | All |
| POST | `/api/leaves/:id/cancel` | Cancel request | All |
| GET | `/api/leaves` | All requests | Admin |
| GET | `/api/leaves/pending` | Pending requests | Admin |
| POST | `/api/leaves/:id/approve` | Approve | Admin |
| POST | `/api/leaves/:id/reject` | Reject | Admin |

### Users

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/users` | Create user | Admin |
| GET | `/api/users` | List users | Admin |
| GET | `/api/users/:id` | Get user | Admin |
| PUT | `/api/users/:id` | Update user | Admin |
| DELETE | `/api/users/:id` | Delete user | Admin |

### Departments & Locations

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/departments` | Create | Admin |
| GET | `/api/departments` | List | All |
| PUT | `/api/departments/:id` | Update | Admin |
| DELETE | `/api/departments/:id` | Delete | CEO |
| POST | `/api/locations` | Create | Admin |
| GET | `/api/locations` | List | All |
| PUT | `/api/locations/:id` | Update | Admin |
| DELETE | `/api/locations/:id` | Delete | CEO |

### Reports (Export)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/reports/attendance` | Export attendance records | Admin |
| GET | `/api/reports/attendance/summary` | Export attendance summary per employee | Admin |
| GET | `/api/reports/shifts` | Export shift schedule | Admin |
| GET | `/api/reports/leaves` | Export leave requests | Admin |

**Report Query Parameters:**
- `format` - `csv` (default) or `excel`
- `startDate` - Filter from date (YYYY-MM-DD)
- `endDate` - Filter to date (YYYY-MM-DD)
- `userId` - Filter by specific user
- `departmentId` - Filter by department
- `locationId` - Filter by location
- `status` - Filter by status (shifts/leaves)
- `type` - Filter by leave type

## Role Permissions

| Role | Level | Capabilities |
|------|-------|--------------|
| CEO | 4 | Full access, delete departments/locations |
| Admin | 3 | User/shift/leave management |
| Security | 2 | Limited read access |
| Staff | 1 | Own data only |

## Test Credentials

| Email | Password | Role |
|-------|----------|------|
| ceo@mtn-company.rw | Password123 | CEO |
| admin@mtn-company.rw | Password123 | Admin |
| security1@mtn-company.rw | Password123 | Security |
| developer1@mtn-company.rw | Password123 | Staff |

## Scripts

```bash
npm start                    # Production server
npm run dev                  # Development with watch
npm test                     # All tests
npm run test:unit            # Unit tests
npm run test:integration     # Integration tests
npm run db:migrate           # Run migrations
npm run db:seed              # Run seeders
npm run db:reset             # Reset database
```

## API Documentation

Interactive Swagger UI: `http://localhost:3000/api/docs`

## Deployment

```bash
# Heroku
heroku create app-name
heroku addons:create heroku-postgresql:hobby-dev
heroku config:set JWT_SECRET=secret SMTP_HOST=... SMTP_USER=... SMTP_PASS=...
git push heroku main
heroku run npm run db:migrate
```

## License

ISC
