import dotenv from "dotenv";

dotenv.config();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  MONGO_DB_URI_TEST: process.env["MONGODB_URI_TEST"],
  PORT: parseInt(process.env["PORT"] ?? "5000", 10),
  MONGODB_URI: requireEnv("MONGODB_URI"),
  JWT_SECRET: requireEnv("JWT_SECRET"),
  JWT_EXPIRES_IN: process.env["JWT_EXPIRES_IN"] ?? "7d",
  NODE_ENV: process.env["NODE_ENV"] ?? "development",
};
