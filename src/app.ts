import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from 'swagger-ui-express';
import { env } from "./config/env";
import router from "./routes/index";
import { errorHandler } from "./middlewares/errorHandler";
import { ApiError } from "./utils/ApiError";

// Load swagger documentation
let swaggerDocument: any = {};
try {
  swaggerDocument = require('../swagger_output.json');
} catch (err) {
  console.log('Swagger documentation not found. Run: npm run swagger');
}

const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(cors({ origin: "*", credentials: true }));

// HTTP request logger — development only
if (env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Body parsers
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Swagger API documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    defaultModelsExpandDepth: 1,
    docExpansion: 'list',
  },
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Finance Dashboard API Documentation',
}));

// Mount all API routes
app.use("/", router);



// 404 handler for unmatched routes
app.use((_req: Request, _res: Response, next: NextFunction) => {
  next(ApiError.notFound("Route not found"));
});

// Global error handler — must be last
app.use(errorHandler);

export default app;
