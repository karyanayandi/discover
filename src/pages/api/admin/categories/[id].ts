import type { APIRoute } from "astro"
import { eq } from "drizzle-orm"
import { isAdmin } from "@/lib/auth/is-admin"
import { createRedisCache } from "@/lib/cache"
import { db } from "@/lib/db/client"
import { categoriesTable } from "@/lib/db/schemas"

export const GET: APIRoute = async ({ params, locals }) => {
  if (!isAdmin(locals.user)) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = params
  if (!id) {
    return Response.json({ error: "Missing id" }, { status: 400 })
  }

  const [category] = await db
    .select()
    .from(categoriesTable)
    .where(eq(categoriesTable.id, id))
    .limit(1)

  if (!category) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  return Response.json(category)
}

export const PATCH: APIRoute = async ({ params, locals, request }) => {
  if (!isAdmin(locals.user)) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = params
  if (!id) {
    return Response.json({ error: "Missing id" }, { status: 400 })
  }

  const cache = createRedisCache()

  try {
    const body = await request.json()
    const { name, slug, description, color, iconUrl } = body

    const updates: Record<string, unknown> = { updatedAt: new Date() }
    if (name !== undefined) updates.name = name
    if (slug !== undefined) updates.slug = slug
    if (description !== undefined) updates.description = description
    if (color !== undefined) updates.color = color
    if (iconUrl !== undefined) updates.iconUrl = iconUrl

    const [updated] = await db
      .update(categoriesTable)
      .set(updates)
      .where(eq(categoriesTable.id, id))
      .returning()

    if (!updated) {
      return Response.json({ error: "Not found" }, { status: 404 })
    }

    await cache.deleteCache("categories:all")

    return Response.json(updated)
  } finally {
    await cache.close()
  }
}

export const DELETE: APIRoute = async ({ params, locals }) => {
  if (!isAdmin(locals.user)) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = params
  if (!id) {
    return Response.json({ error: "Missing id" }, { status: 400 })
  }

  const cache = createRedisCache()

  try {
    const [deleted] = await db
      .delete(categoriesTable)
      .where(eq(categoriesTable.id, id))
      .returning({ id: categoriesTable.id })

    if (!deleted) {
      return Response.json({ error: "Not found" }, { status: 404 })
    }

    await cache.deleteCache("categories:all")

    return Response.json({ success: true })
  } finally {
    await cache.close()
  }
}
