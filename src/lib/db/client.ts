import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import * as schema from "./schemas"

let _db: PostgresJsDatabase<typeof schema> | null = null

function getConnectionString(): string {
  const connectionString =
    import.meta.env.DATABASE_URL ?? process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL environment variable is not set. Please add it to your .env file.",
    )
  }

  return connectionString
}

function getDb(): PostgresJsDatabase<typeof schema> {
  if (!_db) {
    const connectionString = getConnectionString()
    const client = postgres(connectionString)
    _db = drizzle(client, { schema })
  }
  return _db
}

export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(_target, prop) {
    return getDb()[prop as keyof PostgresJsDatabase<typeof schema>]
  },
})
