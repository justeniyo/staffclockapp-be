# StaffClock Backend API

Node.js + Express + Sequelize backend for employee time tracking and workforce management with role-based access control.

## Features

- Time and attendance — clock in/out with work hours
- Shift scheduling and roster management
- Leave requests with approval workflow
- User management with RBAC (Staff, Security, Admin, CEO)
- Email + OTP-based account verification and password reset
- CSV / Excel / PDF report exports
- Interactive Swagger docs at `/api/docs`
- Database health probe at `/health` (for Render/uptime monitors)

## Stack

- Express 4, Sequelize 6 (PostgreSQL)
- JWT auth (`jsonwebtoken`), bcrypt password hashing
- Validation via `express-validator` + `libphonenumber-js` for E.164 phones
- ExcelJS for `.xlsx`, PDFKit for `.pdf`, nodemailer for SMTP

## Project Layout

```
src/
├── config/          Constants, environment, role permissions
├── controllers/     HTTP handlers (thin — see base.controller.js for wrap())
├── database/
│   ├── config/      Sequelize CLI config
│   ├── migrations/  Schema migrations
│   ├── models/      Sequelize models (auto-loaded)
│   └── seeders/     Demo data
├── docs/            OpenAPI definitions (auto-loaded)
├── emails/          Email service + OTP templates
├── middleware/      auth, validate, error
├── routes/          API routes
├── services/        Business logic
├── utils/           ApiResponse, AppError, Pagination
└── validators/      Request validators
```

## Quick Start

```bash
npm install
cp .env.example .env
# Edit .env — at minimum, set DATABASE_URL and JWT_SECRET

# DB
createdb staffclock
npm run db:migrate
npm run db:seed

npm run dev    # Starts on http://localhost:3000
```

## Environment Variables

| Variable | Required | Default | Notes |
|---|---|---|---|
| `NODE_ENV` | no | `development` | |
| `PORT` | no | `3000` | Render sets this to `10000` |
| `HOST` | no | `0.0.0.0` | Must bind 0.0.0.0 in production |
| `DATABASE_URL` | **yes** | — | Postgres URL with `?sslmode=require` in prod |
| `JWT_SECRET` | **yes** | — | At least 32 chars; generate with `crypto.randomBytes(48).toString('hex')` |
| `JWT_EXPIRES_IN` | no | `7d` | |
| `BCRYPT_ROUNDS` | no | `10` | |
| `CORS_ORIGIN` | yes (prod) | `*` | Comma-separated allow-list |
| `APP_URL` | yes (prod) | `http://localhost:3000` | This backend's public URL |
| `FRONTEND_URL` | yes (prod) | `http://localhost:5173` | Used in welcome email "go to login" link |
| `SMTP_HOST` | no | — | Without SMTP, emails are logged to console |
| `SMTP_PORT` | no | `587` | |
| `SMTP_USER` | no | — | |
| `SMTP_PASS` | no | — | |
| `SMTP_FROM` | no | `noreply@staffclock.com` | |
| `VERIFICATION_TOKEN_EXPIRY` | no | `24` | Hours; OTP expiry for account verification |

## API Reference

### Authentication (OTP-based)

| Method | Endpoint | Body | Access |
|---|---|---|---|
| POST | `/api/auth/signup` | `{ email, password, firstName, lastName }` | Public |
| POST | `/api/auth/verify-email` | `{ email, otp }` | Public |
| POST | `/api/auth/resend-verification` | `{ email }` | Public |
| POST | `/api/auth/forgot-password` | `{ email }` | Public |
| POST | `/api/auth/verify-reset-otp` | `{ email, otp }` | Public |
| POST | `/api/auth/reset-password` | `{ email, otp, password }` | Public |
| POST | `/api/auth/login` | `{ email, password }` | Public |
| POST | `/api/auth/logout` | — | Auth |
| GET | `/api/auth/me` | — | Auth |
| PUT | `/api/auth/password` | `{ currentPassword, newPassword, confirmPassword }` | Auth |

### Attendance

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/attendance/clock-in` | All |
| POST | `/api/attendance/clock-out` | All |
| GET | `/api/attendance/status` | All |
| GET | `/api/attendance/my` | All |
| GET | `/api/attendance/my/summary` | All |
| GET | `/api/attendance` | Admin |
| GET | `/api/attendance/user/:userId` | Admin |

### Shifts, Leaves, Users, Departments, Locations

Standard CRUD. See Swagger UI at `/api/docs` for full schemas.

### Reports

| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/reports/attendance` | Admin |
| GET | `/api/reports/attendance/summary` | Admin |
| GET | `/api/reports/shifts` | Admin |
| GET | `/api/reports/leaves` | Admin |

Query: `format` (`csv` \| `excel` \| `pdf`), `startDate`, `endDate`, `userId`, `departmentId`, `locationId`, `status`, `type`.

### Health

| Method | Endpoint | Returns |
|---|---|---|
| GET | `/health` | `200` if DB reachable, `503` if degraded |

## Roles

| Role | Level | Capabilities |
|---|---|---|
| CEO | 4 | Full access; delete departments and locations |
| Admin | 3 | User / shift / leave / report management |
| Security | 2 | Read-only on assigned location |
| Staff | 1 | Own data; managers see direct reports |

## Test Credentials (after seeding)

All seeded users have password `Password123`.

| Email | Role |
|---|---|
| `ceo@staffclock.com` | CEO |
| `admin@staffclock.com` | Admin |
| `it.manager@staffclock.com` | Staff (Manager) |
| `security1@staffclock.com` | Security |
| `developer1@staffclock.com` | Staff |

## Scripts

```bash
npm start                 # Production
npm run dev               # Development (watch mode)
npm test                  # All tests
npm run test:unit         # Unit tests
npm run test:integration  # Integration tests
npm run db:migrate        # Run migrations
npm run db:seed           # Seed demo data
npm run db:reset          # Drop + recreate + migrate + seed
npm run db:setup          # Migrate + seed (first deploy)
```

## Deployment

See [DEPLOY.md](DEPLOY.md) for the recommended free-tier stack (Render + Neon + Cloudflare Pages) with step-by-step instructions and a `render.yaml` blueprint.

## License

ISC
