import type { APIRoute } from "astro"
import { eq } from "drizzle-orm"
import { isAdmin } from "@/lib/auth/is-admin"
import { db } from "@/lib/db/client"
import { feedSourcesTable } from "@/lib/db/schemas"

export const GET: APIRoute = async ({ params, locals }) => {
  if (!isAdmin(locals.user)) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = params
  if (!id) {
    return Response.json({ error: "Missing id" }, { status: 400 })
  }

  const [feed] = await db
    .select()
    .from(feedSourcesTable)
    .where(eq(feedSourcesTable.id, id))
    .limit(1)

  if (!feed) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  return Response.json(feed)
}

export const PATCH: APIRoute = async ({ params, locals, request }) => {
  if (!isAdmin(locals.user)) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = params
  if (!id) {
    return Response.json({ error: "Missing id" }, { status: 400 })
  }

  const body = await request.json()
  const {
    name,
    url,
    siteUrl,
    description,
    language,
    fetchIntervalMinutes,
    enabled,
  } = body

  const updates: Record<string, unknown> = { updatedAt: new Date() }
  if (name !== undefined) updates.name = name
  if (url !== undefined) updates.url = url
  if (siteUrl !== undefined) updates.siteUrl = siteUrl
  if (description !== undefined) updates.description = description
  if (language !== undefined) updates.language = language
  if (fetchIntervalMinutes !== undefined)
    updates.fetchIntervalMinutes = fetchIntervalMinutes
  if (enabled !== undefined) updates.enabled = enabled

  const [updated] = await db
    .update(feedSourcesTable)
    .set(updates)
    .where(eq(feedSourcesTable.id, id))
    .returning()

  if (!updated) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  return Response.json(updated)
}

export const DELETE: APIRoute = async ({ params, locals }) => {
  if (!isAdmin(locals.user)) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = params
  if (!id) {
    return Response.json({ error: "Missing id" }, { status: 400 })
  }

  const [deleted] = await db
    .delete(feedSourcesTable)
    .where(eq(feedSourcesTable.id, id))
    .returning({ id: feedSourcesTable.id })

  if (!deleted) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  return Response.json({ success: true })
}
