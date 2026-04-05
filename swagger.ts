import swaggerAutogen from 'swagger-autogen';
import { env } from './src/config/env';

const doc = {
  info: {
    title: 'Finance Dashboard API',
    description: `
A comprehensive REST API for financial record management with multi-role authentication and rich analytics.

**Base URL:** ${env.NODE_ENV === 'production' ? 'https://zorvyn-assignment-mz7e.onrender.com' : `http://localhost:${env.PORT}`}

## Authentication
- Use JWT tokens obtained from the login endpoint
- Include token in Authorization header: \`Authorization: Bearer <token>\`
- All protected endpoints require authentication

## Roles & Permissions
- **Viewer**: Can view own records and analytics
- **Analyst**: Can create/manage records, view other users' data
- **Admin**: Full access including user management and system administration

## Response Format
All responses follow a consistent format:
\`\`\`json
{
  "success": true,
  "message": "Success message",
  "data": { }
}
\`\`\`

Error responses:
\`\`\`json
{
  "success": false,
  "message": "Error description",
  "errors": [{ "field": "fieldName", "message": "Error detail" }]
}
\`\`\`
    `,
    version: '1.0.0',
    contact: {
      name: 'Finance Dashboard Support',
      email: 'support@financedashboard.com',
    },
  },
  servers: [
    {
      url: env.NODE_ENV === 'production' 
        ? 'https://zorvyn-assignment-mz7e.onrender.com'
        : `http://localhost:${env.PORT}`,
      description: env.NODE_ENV === 'production' ? 'Production Server' : 'Development Server',
    },
  ],
  schemes: [env.NODE_ENV === 'production' ? 'https' : 'http'],
  consumes: ['application/json'],
  produces: ['application/json'],
  securityDefinitions: {
    bearerAuth: {
      type: 'apiKey',
      name: 'Authorization',
      in: 'header',
      description: 'JWT Token in format: Bearer <token>',
    },
  },
  definitions: {
    User: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '65abc123def456' },
        name: { type: 'string', example: 'John Doe' },
        email: { type: 'string', example: 'john@example.com' },
        role: { type: 'string', enum: ['viewer', 'analyst', 'admin'], example: 'analyst' },
        status: { type: 'string', enum: ['active', 'inactive'], example: 'active' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
    FinancialRecord: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        userId: { type: 'string' },
        type: { type: 'string', enum: ['income', 'expense'], example: 'expense' },
        category: { type: 'string', example: 'Food' },
        amount: { type: 'number', example: 50.5 },
        notes: { type: 'string', example: 'Grocery shopping' },
        tags: { type: 'array', items: { type: 'string' } },
        date: { type: 'string', format: 'date-time' },
        isDeleted: { type: 'boolean', default: false },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
    Tag: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        name: { type: 'string', example: 'Emergency' },
        color: { type: 'string', example: '#FF5733' },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
    ApiResponse: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: { type: 'object' },
      },
    },
    PaginatedResponse: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            results: { type: 'array' },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'number' },
                limit: { type: 'number' },
                total: { type: 'number' },
                totalPages: { type: 'number' },
              },
            },
          },
        },
      },
    },
  },
};

const outputFile = './swagger_output.json';
const routes = ['./src/routes/index.ts'];

// Generate swagger documentation
swaggerAutogen({ openapi: '3.0.0' })(outputFile, routes, doc);
