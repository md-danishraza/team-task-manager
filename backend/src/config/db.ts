// backend/src/config/db.ts
/*
When using tsx watch, server constantly restarts. If we instantiate a new Pool and PrismaClient on every reload, we will quickly exhaust Supabase's connection limit. This pattern attaches the Prisma instance to the global object in development so it is reused across hot reloads.
*/

// import { PrismaClient } from "@prisma/client";
// importing from custom output for prisma client (in schema.prisma)
import { PrismaClient } from "../../prisma/generated/client/index.js";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL!;

// 1. Create the pg Pool
// Runtime uses the Pooled connection (Port 6543)
const pool = new Pool({ connectionString });

// 2. Instantiate the Prisma adapter
const adapter = new PrismaPg(pool, {
  schema: "taskmanager",
});

// 3. Global singleton pattern for hot-reloading
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
