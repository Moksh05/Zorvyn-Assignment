import mongoose from "mongoose";
import { env } from "./env";

export async function connectDB(): Promise<void> {
  try {
    console.log("Connecting to MongoDB...");

    const mongoUri =
      env.NODE_ENV === "development"
        ? env.MONGO_DB_URI_TEST
        : env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error("MongoDB URI is not defined");
    }

    await mongoose.connect(mongoUri);

    console.log(`MongoDB connected (${env.NODE_ENV})`);
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    throw error;
  }
}