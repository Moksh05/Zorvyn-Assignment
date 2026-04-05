# API Documentation

## Overview

This document provides comprehensive details about the Finance Dashboard API, including dummy users for testing, route access controls, request/response formats, and examples.

**Base URL:** `http://localhost:5000/api`  
**Authentication:** JWT Bearer tokens required for most endpoints  
**Content-Type:** `application/json`

## Dummy Users for Testing

The database is seeded with the following test users. Use these for testing different role permissions.

| Role    | Email                       | Password     | Permissions                               |
| ------- | --------------------------- | ------------ | ----------------------------------------- |
| admin   | admin@finance.com           | Admin@1234   | Full access to all endpoints              |
| analyst | analyst@finance.com         | Analyst@1234 | View/manage records, users, and analytics |
| viewer  | viewer@finance.com          | Viewer@1234  | Read-only access to own data              |
| viewer  | viewer2@finance.com         | Viewer@1234  | Read-only access to own data              |
| viewer  | viewertoanalyst@finance.com | Viewer@1234  | Viewer that can be upgraded to analyst    |

**Sample Data:**

- 5 users
- 5 global tags (food, transport, salary, rent, entertainment)
- 100 financial records across 6 months

## Authentication

### Login

**Endpoint:** `POST /api/auth/login`  
**Body:**

```json
{
  "email": "admin@finance.com",
  "password": "Admin@1234"
}
```

**Response:**

```json
{
  "statusCode": 200,
  "data": {
    "user": {
      "_id": "60d5ecb74b24c72b8c8b4567",
      "name": "Admin User",
      "email": "admin@finance.com",
      "role": "admin",
      "status": "active",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful",
  "success": true
}
```

Use the `token` in subsequent requests: `Authorization: Bearer <token>`

## API Endpoints

### Authentication Routes

#### Register User

**Endpoint:** `POST /api/auth/register`  
**Access:** Public  
**Description:** Create a new user account  
**Body:**

```json
{
  "name": "John Doe", // Required: string, 2-100 chars
  "email": "john@example.com", // Required: valid email
  "password": "password123" // Required: string, min 8 chars
}
```

**Response (201):**

```json
{
  "statusCode": 201,
  "data": {
    "user": {
      /* user object without password */
    },
    "token": "jwt_token_here"
  },
  "message": "Registration successful",
  "success": true
}
```

#### Get Current User

**Endpoint:** `GET /api/auth/me`  
**Access:** Authenticated users  
**Description:** Get profile of logged-in user  
**Response (200):**

```json
{
  "statusCode": 200,
  "data": {
    /* user object */
  },
  "message": "User fetched",
  "success": true
}
```

#### Change Password

**Endpoint:** `PATCH /api/auth/change-password`  
**Access:** Authenticated users  
**Description:** Update user password  
**Body:**

```json
{
  "currentPassword": "oldpassword123", // Required
  "newPassword": "newpassword123" // Required, min 8 chars
}
```

**Response (200):**

```json
{
  "statusCode": 200,
  "data": null,
  "message": "Password changed successfully",
  "success": true
}
```

### User Management Routes

#### Create User

**Endpoint:** `POST /api/users`  
**Access:** Admin only  
**Description:** Create a new user  
**Body:**

```json
{
  "name": "Jane Doe", // Required: string, 2-100 chars
  "email": "jane@example.com", // Required: valid email
  "password": "password123", // Required: string, min 8 chars
  "role": "viewer", // Optional: admin|analyst|viewer (default: viewer)
  "status": "active" // Optional: active|inactive (default: active)
}
```

**Response (201):** Same as register

#### Get All Users

**Endpoint:** `GET /api/users`  
**Access:** Admin/Analyst only  
**Description:** Get paginated list of users  
**Query Parameters:**

- `page`: number (default: 1)
- `limit`: number (default: 10, max: 100)
- `status`: active|inactive
- `role`: admin|analyst|viewer
- `search`: string (searches name/email)
  **Response (200):**

```json
{
  "statusCode": 200,
  "data": {
    "results": [
      /* array of user objects */
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "totalPages": 1
    }
  },
  "message": "Users fetched successfully",
  "success": true
}
```

#### Get User by ID

**Endpoint:** `GET /api/users/{id}`  
**Access:** Admin/Analyst only  
**Description:** Get specific user details  
**Response (200):** User object

#### Get User Statistics

**Endpoint:** `GET /api/users/{id}/stats`  
**Access:** Admin/Analyst only  
**Description:** Get financial statistics for a user  
**Response (200):**

```json
{
  "statusCode": 200,
  "data": {
    "totalIncome": 15000.0,
    "totalExpense": 8500.0,
    "categoryBreakdown": [
      {
        "category": "Food",
        "total": 2500.0,
        "count": 15,
        "percentage": 29.41
      }
    ],
    "monthlyTrend": [
      /* monthly data */
    ]
  },
  "message": "User stats fetched successfully",
  "success": true
}
```

#### Update User

**Endpoint:** `PATCH /api/users/{id}`  
**Access:** Admin only  
**Description:** Update user details (at least one field required)  
**Body:**

```json
{
  "name": "Updated Name", // Optional
  "email": "newemail@example.com", // Optional
  "status": "inactive", // Optional
  "role": "analyst" // Optional
}
```

**Response (200):** Updated user object

#### Delete User

**Endpoint:** `DELETE /api/users/{id}`  
**Access:** Admin only  
**Description:** Soft delete user (sets status to inactive)  
**Response (200):**

```json
{
  "statusCode": 200,
  "data": null,
  "message": "User deactivated successfully",
  "success": true
}
```

### Financial Record Routes

#### Create Record

**Endpoint:** `POST /api/records`  
**Access:** Admin/Analyst only  
**Description:** Create a new financial record  
**Body:**

```json
{
  "amount": 2500.0, // Required: number > 0
  "type": "income", // Required: income|expense
  "category": "Salary", // Required: string, 1-100 chars
  "date": "2024-01-15T00:00:00.000Z", // Optional: ISO date (default: now)
  "tags": ["tagId1", "tagId2"], // Optional: array of tag IDs
  "notes": "Monthly salary" // Optional: string, max 500 chars
}
```

**Response (201):** Created record object

#### Get Records

**Endpoint:** `GET /api/records`  
**Access:** Authenticated users  
**Description:** Get paginated list of records (users see only their own)  
**Query Parameters:**

- `page`: number (default: 1)
- `limit`: number (default: 10, max: 100)
- `type`: income|expense
- `category`: string
- `tags`: string (tag ID)
- `search`: string
- `startDate`: ISO date
- `endDate`: ISO date
- `userId`: string (Admin/Analyst can specify)
- `sortBy`: date|amount|category (default: date)
- `sortOrder`: asc|desc (default: desc)
  **Response (200):** Paginated records list

#### Get Record by ID

**Endpoint:** `GET /api/records/{id}`  
**Access:** Authenticated users (can only access own records unless admin/analyst)  
**Response (200):** Record object

#### Update Record

**Endpoint:** `PATCH /api/records/{id}`  
**Access:** Admin/Analyst only  
**Description:** Update record (at least one field required)  
**Body:** Same as create, all fields optional  
**Response (200):** Updated record object

#### Restore Record

**Endpoint:** `PATCH /api/records/{id}/restore`  
**Access:** Admin only  
**Description:** Restore a soft-deleted record  
**Response (200):** Restored record object

#### Delete Record

**Endpoint:** `DELETE /api/records/{id}`  
**Access:** Admin only  
**Description:** Soft delete record  
**Response (200):**

```json
{
  "statusCode": 200,
  "data": { "message": "Record deleted successfully" },
  "message": "Record deleted successfully",
  "success": true
}
```

### Tag Routes

#### Get All Tags

**Endpoint:** `GET /api/tags`  
**Access:** Authenticated users  
**Description:** Get all global tags  
**Response (200):** Array of tag objects

#### Create Tag

**Endpoint:** `POST /api/tags`  
**Access:** Admin/Analyst only  
**Description:** Create a new global tag  
**Body:**

```json
{
  "name": "travel", // Required: string, 1-50 chars
  "color": "#3b82f6" // Optional: hex color
}
```

**Response (201):** Created tag object

#### Delete Tag

**Endpoint:** `DELETE /api/tags/{id}`  
**Access:** Admin only  
**Description:** Delete a tag  
**Response (200):** Success message

### Dashboard Routes

#### Get Summary

**Endpoint:** `GET /api/dashboard/summary`  
**Access:** Authenticated users  
**Description:** Get financial summary (users see only their data unless admin/analyst)  
**Query Parameters:**

- `userId`: string (Admin/Analyst can specify)
- `startDate`: ISO date
- `endDate`: ISO date
  **Response (200):**

```json
{
  "statusCode": 200,
  "data": {
    "totalIncome": 15000.0,
    "totalExpense": 8500.0,
    "netBalance": 6500.0,
    "savingsRate": "43.33",
    "recordCount": 45,
    "recentActivity": [
      /* last 5 records */
    ],
    "topExpenseCategory": {
      "category": "Food",
      "total": 2500.0,
      "count": 15,
      "percentage": 29.41
    }
  },
  "message": "Dashboard summary fetched",
  "success": true
}
```

#### Get Monthly Data

**Endpoint:** `GET /api/dashboard/monthly`  
**Access:** Authenticated users  
**Query Parameters:**

- `userId`: string
- `year`: number
  **Response (200):** Array of monthly income/expense data

#### Get Category Breakdown

**Endpoint:** `GET /api/dashboard/categories`  
**Access:** Authenticated users  
**Query Parameters:**

- `userId`: string
- `type`: income|expense
- `startDate`: ISO date
- `endDate`: ISO date
  **Response (200):** Array of category data with percentages

#### Get Category Trends

**Endpoint:** `GET /api/dashboard/category-trends`  
**Access:** Authenticated users  
**Query Parameters:**

- `userId`: string
- `year`: number
  **Response (200):** Monthly category spending trends

#### Get Per-User Stats

**Endpoint:** `GET /api/dashboard/user-stats`  
**Access:** Admin/Analyst only  
**Query Parameters:**

- `startDate`: ISO date
- `endDate`: ISO date
  **Response (200):** Array of user statistics

#### Get Per-User Category Breakdown

**Endpoint:** `GET /api/dashboard/user-category/{userId}`  
**Access:** Admin/Analyst only  
**Query Parameters:**

- `startDate`: ISO date
- `endDate`: ISO date
  **Response (200):**

```json
{
  "statusCode": 200,
  "data": {
    "income": [
      /* category breakdown */
    ],
    "expense": [
      /* category breakdown */
    ]
  },
  "message": "Per-user category breakdown fetched",
  "success": true
}
```

## Error Responses

All endpoints return errors in this format:

```json
{
  "statusCode": 400,
  "message": "Error description",
  "success": false
}
```

Common status codes:

- `400`: Validation error
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Resource not found
- `409`: Conflict (duplicate email, etc.)
- `500`: Internal server error

## Testing

1. Run `npm run seed` to populate database
2. Start server: `npm run dev`
3. Use Postman or curl with the dummy users above

## Notes

- All dates are in ISO 8601 format
- Passwords are hashed with bcrypt (12 salt rounds)
- Records use soft delete (isDeleted flag)
- Tags are global (shared across all users)
- Pagination starts at page 1
- Amounts are stored as numbers (decimals allowed)
