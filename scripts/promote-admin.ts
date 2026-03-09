import { eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "../src/lib/db/schemas/index"

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error("DATABASE_URL is required")
  process.exit(1)
}

const email = process.argv[2]
if (!email) {
  console.error("Usage: bun run scripts/promote-admin.ts <email>")
  console.error("Example: bun run scripts/promote-admin.ts user@example.com")
  process.exit(1)
}

const client = postgres(databaseUrl)
const db = drizzle(client, { schema })

const [user] = await db
  .update(schema.usersTable)
  .set({ role: "admin" })
  .where(eq(schema.usersTable.email, email))
  .returning({
    id: schema.usersTable.id,
    email: schema.usersTable.email,
    role: schema.usersTable.role,
  })

if (!user) {
  console.error(`No user found with email: ${email}`)
  console.error("Make sure the user has signed in at least once.")
  await client.end()
  process.exit(1)
}

console.log(`Promoted user to admin:`)
console.log(`  ID:    ${user.id}`)
console.log(`  Email: ${user.email}`)
console.log(`  Role:  ${user.role}`)

await client.end()
