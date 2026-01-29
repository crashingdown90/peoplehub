// @ai:cl - Prisma client singleton
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { withAuditExtension } from "./audit-middleware";

const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL;
  if (!url || url.includes("USER:PASSWORD")) {
    return null;
  }
  return url;
};

function createPrismaClient(): PrismaClient {
  const databaseUrl = getDatabaseUrl();

  if (!databaseUrl) {
    console.warn("⚠️  DATABASE_URL not configured. Database operations will fail.");

    // Create a mock client that throws helpful errors
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockClient: any = new Proxy(
      {},
      {
        get: (_target, prop) => {
          if (prop === "$connect" || prop === "$disconnect" || prop === "then") {
            return async () => { };
          }
          if (typeof prop === "string" && prop.startsWith("$")) {
            return () => {
              throw new Error(
                `Database not configured. Please set DATABASE_URL in .env file.`
              );
            };
          }
          // Return a proxy for model access (e.g., prisma.user)
          return new Proxy(
            () => { },
            {
              apply: () => {
                throw new Error(
                  `Database not configured. Please set DATABASE_URL in .env file.\n` +
                  `Example: DATABASE_URL="postgresql://user:password@localhost:5432/peoplehub"`
                );
              },
              get: (_t, p) => {
                if (p === "then") return undefined;
                return () => {
                  throw new Error(`Database not configured. Please set DATABASE_URL.`);
                };
              },
            }
          );
        },
      }
    );
    return mockClient as PrismaClient;
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const adapter = new PrismaPg(pool);

  const baseClient = new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

  // Wrap with audit extension for automatic audit logging
  return withAuditExtension(baseClient);
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
