// MUST be imported first — patches async error propagation globally
import "express-async-errors";
import dns from "dns";
dns.setDefaultResultOrder("ipv4first");

import app from "./src/app";
import { connectDB } from "./src/config/db";
import { env } from "./src/config/env";

let server: ReturnType<typeof app.listen>;

async function start(): Promise<void> {
  
  await connectDB();

  server = app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT} [${env.NODE_ENV}]`);
  });
}

function shutdown(reason: string, error?: unknown): void {
  console.error(`[Shutdown] Reason: ${reason}`, error ?? "");
  server?.close(() => {
    console.log("HTTP server closed.");
    process.exit(1);
  });
}

process.on("uncaughtException", (error: Error) => {
  console.error("[uncaughtException]", error);
  shutdown("uncaughtException", error);
});

process.on("unhandledRejection", (reason: unknown) => {
  console.error("[unhandledRejection]", reason);
  shutdown("unhandledRejection", reason);
});

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
