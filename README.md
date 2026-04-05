# Finance Dashboard Backend

A production-quality REST API backend for a Finance Dashboard application. Built with Node.js, TypeScript, Express.js, and MongoDB, it provides comprehensive financial record management, multi-role authentication, and rich analytics endpoints.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Language | TypeScript (strict mode) |
| Framework | Express.js |
| Database | MongoDB + Mongoose ODM |
| Validation | Zod |
| Auth | JWT (jsonwebtoken) |
| Password hashing | bcryptjs |
| Environment | dotenv |
| Security | helmet, cors |
| Logging | morgan |
| Error handling | express-async-errors |
| Date utilities | dayjs |

---

## Folder Structure

```
server/
├── src/
│   ├── config/
│   │   ├── db.ts                  # MongoDB connection via Mongoose
│   │   └── env.ts                 # Typed, validated environment variables
│   ├── controllers/
│   │   ├── auth.controller.ts     # Register, login, me, change-password
│   │   ├── user.controller.ts     # User CRUD + stats
│   │   ├── record.controller.ts   # Record CRUD + tag management
│   │   └── dashboard.controller.ts# Analytics endpoints
│   ├── routes/
│   │   ├── index.ts               # Mounts all sub-routers
│   │   ├── auth.routes.ts         # /api/auth/*
│   │   ├── user.routes.ts         # /api/users/*
│   │   ├── record.routes.ts       # /api/records/*
│   │   ├── tag.routes.ts          # /api/tags/*
│   │   └── dashboard.routes.ts    # /api/dashboard/*
│   ├── models/
│   │   ├── user.model.ts          # User schema + bcrypt pre-save hook
│   │   ├── record.model.ts        # Financial record schema + soft-delete pre-find
│   │   └── tag.model.ts           # Tag schema
│   ├── services/
│   │   ├── auth.service.ts        # Auth business logic + JWT generation
│   │   ├── user.service.ts        # User CRUD + per-user aggregations
│   │   ├── record.service.ts      # Record CRUD + tag management
│   │   └── analytics.service.ts   # All MongoDB aggregation pipelines
│   ├── middlewares/
│   │   ├── authenticate.ts        # JWT verification → req.user
│   │   ├── authorize.ts           # Role-based guard factory
│   │   ├── validate.ts            # Zod body/query validation
│   │   └── errorHandler.ts        # Global error handler
│   ├── utils/
│   │   ├── ApiError.ts            # Custom error class with factory methods
│   │   ├── ApiResponse.ts         # Consistent JSON response wrapper
│   │   ├── asyncHandler.ts        # Wraps async handlers, forwards to next()
│   │   └── pagination.ts          # Pagination helpers
│   ├── schemas/
│   │   ├── auth.schema.ts         # Zod schemas for auth endpoints
│   │   ├── user.schema.ts         # Zod schemas for user management
│   │   └── record.schema.ts       # Zod schemas for records + filters
│   ├── types/
│   │   └── express.d.ts           # Augments Express Request with req.user
│   ├── app.ts                     # Express app factory
│   └── seed.ts                    # Database seed script
├── server.ts                      # Entry point
├── package.json
├── tsconfig.json
└── .env.example
```

---

## Environment Setup

Copy `.env.example` to `.env` and fill in the values:

```env
PORT=5000                                              # HTTP port (default: 5000)
MONGODB_URI=mongodb://localhost:27017/finance_dashboard # MongoDB connection string
JWT_SECRET=your_super_secret_jwt_key_change_this       # JWT signing secret (keep private)
JWT_EXPIRES_IN=7d                                      # Token expiry (e.g. 7d, 24h)
NODE_ENV=development                                   # development | production
```

---

## Installation

```bash
# 1. Clone the repository
git clone <repo-url>

# 2. Enter the server directory
cd server

# 3. Install dependencies
npm install

# 4. Set up environment
cp .env.example .env
# Then edit .env with your MongoDB URI and JWT secret

# 5. (Optional) Seed the database with sample data
npm run seed

# 6. Start the development server
npm run dev
```

The server will start at `http://localhost:5000`.  
Health check: `GET http://localhost:5000/health`

---

## API Reference

All successful responses follow this shape:
```json
{
  "success": true,
  "message": "Human readable message",
  "data": {}
}
```

All error responses:
```json
{
  "success": false,
  "message": "Error description",
  "errors": [{ "field": "email", "message": "Invalid email" }]
}
```

Paginated responses include:
```json
{
  "success": true,
  "data": {
    "results": [],
    "pagination": { "page": 1, "limit": 10, "total": 100, "totalPages": 10 }
  }
}
```

---

### Auth

| Method | Endpoint | Auth | Role | Body | Description |
|--------|----------|------|------|------|-------------|
| POST | /api/auth/register | No | — | `name, email, password` | Register new user (viewer role) |
| POST | /api/auth/login | No | — | `email, password` | Login, returns JWT token |
| GET | /api/auth/me | Yes | All | — | Get current authenticated user |
| PATCH | /api/auth/change-password | Yes | All | `currentPassword, newPassword` | Change own password |

---

### Users

| Method | Endpoint | Auth | Role | Params/Body | Description |
|--------|----------|------|------|-------------|-------------|
| POST | /api/users | Yes | Admin | `name, email, password, role?, status?` | Create user with any role |
| GET | /api/users | Yes | Admin, Analyst | `page, limit, status, role, search` | List users with filters |
| GET | /api/users/:id | Yes | Admin, Analyst | — | Get user by ID |
| PATCH | /api/users/:id | Yes | Admin | `name?, email?, role?, status?` | Update user |
| DELETE | /api/users/:id | Yes | Admin | — | Soft deactivate user (sets status=inactive) |
| GET | /api/users/:id/stats | Yes | Admin, Analyst | — | Financial summary for a specific user |

---

### Records

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | /api/records | Yes | Admin, Analyst | Create a financial record |
| GET | /api/records | Yes | All | List records (role-scoped) |
| GET | /api/records/:id | Yes | All | Get single record (ownership enforced for viewers) |
| PATCH | /api/records/:id | Yes | Admin, Analyst | Update record |
| DELETE | /api/records/:id | Yes | Admin | Soft-delete record (sets isDeleted=true) |
| PATCH | /api/records/:id/restore | Yes | Admin | Restore a soft-deleted record |

#### GET /api/records — Query Parameters

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page (default: 10, max: 100) |
| `type` | `income` \| `expense` | Filter by transaction type |
| `category` | string | Partial match on category (case-insensitive) |
| `tags` | string | Comma-separated tag IDs: `tag1id,tag2id` |
| `search` | string | Searches both `notes` and `category` fields |
| `startDate` | ISO date | Inclusive start of date range |
| `endDate` | ISO date | Inclusive end of date range |
| `userId` | string | Admin/Analyst only — filter by specific user |
| `sortBy` | `date` \| `amount` \| `category` | Sort field (default: `date`) |
| `sortOrder` | `asc` \| `desc` | Sort direction (default: `desc`) |

---

### Tags

| Method | Endpoint | Auth | Role | Body | Description |
|--------|----------|------|------|------|-------------|
| GET | /api/tags | Yes | All | — | List all tags (sorted by name) |
| POST | /api/tags | Yes | Admin, Analyst | `name, color?` | Create a tag |
| DELETE | /api/tags/:id | Yes | Admin | — | Delete tag + remove from all records |

---

### Dashboard / Analytics

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | /api/dashboard/summary | Yes | All | Top-level summary cards |
| GET | /api/dashboard/monthly | Yes | All | Month-by-month income/expense data |
| GET | /api/dashboard/categories | Yes | All | Category breakdown with percentages |
| GET | /api/dashboard/category-trends | Yes | All | Category spend per month (grouped bar chart) |
| GET | /api/dashboard/user-stats | Yes | Admin, Analyst | Per-user income/expense totals |
| GET | /api/dashboard/user-category/:userId | Yes | Admin, Analyst | Category breakdown for a specific user |

#### GET /api/dashboard/summary

Query params: `userId` (admin/analyst), `startDate`, `endDate`

Returns:
```json
{
  "totalIncome": 12000,
  "totalExpense": 8500,
  "netBalance": 3500,
  "savingsRate": "29.17",
  "recordCount": 45,
  "recentActivity": [...],
  "topExpenseCategory": { "category": "Rent", "total": 3000, "percentage": 35.29 }
}
```

#### GET /api/dashboard/monthly

Query params: `userId` (admin/analyst), `year`

Returns array of:
```json
{ "month": 1, "year": 2024, "monthLabel": "Jan", "totalIncome": 5000, "totalExpense": 3200, "netBalance": 1800, "count": 8 }
```

#### GET /api/dashboard/categories

Query params: `userId` (admin/analyst), `type` (income|expense), `startDate`, `endDate`

Returns array of (pie chart data):
```json
{ "category": "Rent", "total": 3000, "count": 3, "percentage": 35.29 }
```

#### GET /api/dashboard/category-trends

Query params: `userId` (admin/analyst), `year`

Returns array of (grouped bar chart data):
```json
{
  "month": 3, "year": 2024, "monthLabel": "Mar",
  "categories": [
    { "category": "Rent", "total": 1200, "count": 1 },
    { "category": "Food", "total": 450, "count": 5 }
  ]
}
```

#### GET /api/dashboard/user-stats (Admin/Analyst only)

Query params: `startDate`, `endDate`

Returns array of:
```json
{ "userId": "...", "userName": "Alice", "userEmail": "alice@example.com", "totalIncome": 8000, "totalExpense": 5000, "netBalance": 3000, "recordCount": 20 }
```

#### GET /api/dashboard/user-category/:userId (Admin/Analyst only)

Query params: `startDate`, `endDate`

Returns:
```json
{
  "income": [{ "category": "Salary", "total": 5000, "percentage": 100 }],
  "expense": [{ "category": "Rent", "total": 1200, "percentage": 40 }]
}
```

---

## Role Permissions Matrix

| Action | Viewer | Analyst | Admin |
|--------|:------:|:-------:|:-----:|
| View own records | ✓ | ✓ | ✓ |
| View all records | ✗ | ✗ | ✓ |
| View other user records | ✗ | ✓ | ✓ |
| Create records | ✗ | ✓ | ✓ |
| Update own records | ✗ | ✓ | ✓ |
| Update any record | ✗ | ✗ | ✓ |
| Delete records | ✗ | ✗ | ✓ |
| Restore deleted records | ✗ | ✗ | ✓ |
| Create/manage tags | ✗ | ✓ | ✓ |
| Delete tags | ✗ | ✗ | ✓ |
| View users | ✗ | ✓ | ✓ |
| Create/update users | ✗ | ✗ | ✓ |
| View own analytics | ✓ | ✓ | ✓ |
| View other users' analytics | ✗ | ✓ | ✓ |
| View per-user stats | ✗ | ✓ | ✓ |

---

## Assumptions Made

- **Tags are global** — not per-user. Any analyst or admin can use any tag on records.
- **Soft delete** is used for records (`isDeleted` flag). Records are never physically removed.
- **Deactivating a user** (status: inactive) prevents login but preserves all their financial data.
- **Category is a free-text field** — no predefined list — allowing maximum flexibility.
- **Amounts are always positive** — the `type` field (income/expense) determines direction.
- **savingsRate** is `(netBalance / totalIncome) * 100` and returns `"0.00"` when totalIncome is 0.
- **Analyst** can view other users' records but cannot delete or create records on behalf of other users.
- **Date filtering** uses inclusive ranges (`>= startDate`, `<= endDate`).
- **Seed script is idempotent** — running it again clears and re-seeds the database.

---

## Tradeoffs

- **Full aggregation pipelines** for all analytics — chosen over in-memory aggregation to ensure correctness at scale.
- **Free-text category vs enum** — chose free-text for flexibility. A future enhancement would add a Category model.
- **Single JWT (no refresh token)** — kept auth simple. A production system should add refresh token rotation.
- **No rate limiting** — not implemented. Add `express-rate-limit` as middleware when needed.
- **Global tags** — simpler model for the current scope; per-user tags would require scoping all tag lookups.
