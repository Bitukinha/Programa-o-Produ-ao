import { Pool } from "pg";

// Server-only Postgres pool (Neon). The .server.ts suffix keeps this out of
// the client bundle. Reused across server function invocations via globalThis
// so dev HMR doesn't leak connections.
declare global {
  var __pgPool: Pool | undefined;
}

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Missing DATABASE_URL environment variable.");
  }
  return new Pool({ connectionString });
}

export const pool = globalThis.__pgPool ?? (globalThis.__pgPool = createPool());
