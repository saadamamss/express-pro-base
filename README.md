# Express Base

A production-ready Express.js API template with authentication, caching, logging, and testing built-in.

---

## Features

### Security
- JWT authentication with access/refresh tokens
- Token versioning for token revocation
- Account lockout after 5 failed login attempts
- Password hashing with bcrypt (12 rounds)
- Role-based access control (USER, ADMIN, MODERATOR)
- Rate limiting per route

### Data & Caching
- PostgreSQL with Prisma ORM
- Redis caching for user data
- Cache invalidation on mutations

### Logging
- Winston logger with JSON files
- Request ID tracing
- Error logging with stack traces

### API Documentation
- Swagger UI at `/docs`

### Testing
- Jest with ts-jest
- Unit tests for services

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env` and fill in values:
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost:5432/mydb
JWT_SECRET=your_secret_key
JWT_REFRESH_SECRET=your_refresh_secret
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 3. Database Setup
```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Run Development Server
```bash
npm run dev
```

Server runs at `http://localhost:3000/api/v1`

---

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|------------|------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login user | No |
| POST | `/auth/verify-email` | Verify email | No |
| POST | `/auth/forgot-password` | Request password reset | No |
| POST | `/auth/reset-password` | Reset password | No |
| POST | `/auth/refresh` | Refresh access token | No |
| POST | `/auth/logout` | Logout user | Yes |
| GET | `/auth/me` | Get current user | Yes |

### Users

| Method | Endpoint | Description | Auth |
|--------|----------|------------|------|
| GET | `/users` | List users | Yes |
| GET | `/users/:id` | Get user by ID | Yes |
| POST | `/users` | Create user | ADMIN |
| PATCH | `/users/:id` | Update user | ADMIN |
| DELETE | `/users/:id` | Delete user | ADMIN |

### Upload

| Method | Endpoint | Description | Auth |
|--------|----------|------------|------|
| POST | `/upload/image` | Upload image | Yes |
| POST | `/upload/file` | Upload file | Yes |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health` | Health check |

---

## Scripts

```bash
npm run dev       # Development server
npm run build    # Build for production
npm run start     # Run production server
npm run test     # Run tests
npm run test:watch # Watch mode
npm run test:cov  # Coverage report
npm run lint     # TypeScript check
```

---

## Project Structure

```
src/
├── app.ts                 # Express app setup
├── server.ts              # Server entry point
├── config/
│   └── env.ts            # Environment validation
├── lib/
│   ├── prisma.ts        # Prisma client
│   ├── redis.ts         # Redis client
│   ├── logger.ts        # Winston logger
│   └── swagger.ts      # Swagger config
├── helpers/
│   ├── token.ts        # JWT helpers
│   ├── pagination.ts   # Pagination utils
│   └── response.ts     # Response helpers
├── middleware/
│   ├── auth.middleware.ts
│   ├── error.middleware.ts
│   ├── logging.middleware.ts
│   ├── validate.middleware.ts
│   ├── roles.middleware.ts
│   └── rate-limit.middleware.ts
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.routes.ts
│   │   └── auth.schema.ts
│   ├── users/
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.routes.ts
│   │   └── users.schema.ts
│   ├── mail/
│   │   └── mail.service.ts
│   └── upload/
│       ├── upload.controller.ts
│       ├── upload.service.ts
│       └── upload.routes.ts
└── types/
    └── express.d.ts     # Express type extensions
```

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| NODE_ENV | Environment | development |
| PORT | Server port | 3000 |
| DATABASE_URL | PostgreSQL connection string | - |
| JWT_SECRET | JWT signing secret | - |
| JWT_EXPIRES_IN | Access token expiry | 15m |
| JWT_REFRESH_SECRET | Refresh token secret | - |
| JWT_REFRESH_EXPIRES_IN | Refresh token expiry | 7d |
| REDIS_HOST | Redis host | localhost |
| REDIS_PORT | Redis port | 6379 |
| REDIS_PASSWORD | Redis password | - |
| MAIL_HOST | SMTP host | - |
| MAIL_PORT | SMTP port | 587 |
| MAIL_USER | SMTP username | - |
| MAIL_PASS | SMTP password | - |
| MAIL_FROM | From email address | - |

---

## Testing

### Run Tests
```bash
npm test
```

### Run with Coverage
```bash
npm run test:cov
```

---

## License

ISC