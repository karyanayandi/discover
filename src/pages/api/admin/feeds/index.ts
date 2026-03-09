import type { APIRoute } from "astro"
import { eq } from "drizzle-orm"

import { isAdmin } from "@/lib/auth/is-admin"
import { db } from "@/lib/db/client"
import { feedSourcesTable } from "@/lib/db/schemas"
import { createCustomId } from "@/lib/utils/custom-id"

const forbidden = () => Response.json({ error: "Forbidden" }, { status: 403 })

export const GET: APIRoute = async ({ locals }) => {
  if (!isAdmin(locals.user)) return forbidden()

  const sources = await db.query.feedSourcesTable.findMany({
    orderBy: [feedSourcesTable.createdAt],
  })
  return Response.json(sources)
}

export const POST: APIRoute = async ({ request, locals }) => {
  if (!isAdmin(locals.user)) return forbidden()
  const body = await request.json()
  const { name, url, siteUrl, description, language, fetchIntervalMinutes } =
    body

  if (!name || !url) {
    return Response.json(
      { error: "name and url are required" },
      { status: 400 },
    )
  }

  const existing = await db.query.feedSourcesTable.findFirst({
    where: eq(feedSourcesTable.url, url),
    columns: { id: true },
  })

  if (existing) {
    return Response.json(
      { error: "Feed source with this URL already exists" },
      { status: 409 },
    )
  }

  const [source] = await db
    .insert(feedSourcesTable)
    .values({
      id: createCustomId(),
      name,
      url,
      siteUrl: siteUrl ?? null,
      description: description ?? null,
      language: language ?? "en",
      fetchIntervalMinutes: fetchIntervalMinutes ?? 60,
    })
    .returning()

  return Response.json(source, { status: 201 })
}

export const DELETE: APIRoute = async ({ request, locals }) => {
  if (!isAdmin(locals.user)) return forbidden()
  const body = await request.json()
  const { id } = body

  if (!id) {
    return Response.json({ error: "id is required" }, { status: 400 })
  }

  await db.delete(feedSourcesTable).where(eq(feedSourcesTable.id, id))

  return Response.json({ deleted: true })
}
