import type { APIRoute } from "astro"
import { eq } from "drizzle-orm"

import { isAdmin } from "@/lib/auth/is-admin"
import { createRedisCache } from "@/lib/cache"
import { db } from "@/lib/db/client"
import { categoriesTable } from "@/lib/db/schemas"
import { createCustomId } from "@/lib/utils/custom-id"

const cache = createRedisCache()

const forbidden = () => Response.json({ error: "Forbidden" }, { status: 403 })

export const GET: APIRoute = async ({ locals }) => {
  if (!isAdmin(locals.user)) return forbidden()

  const categories = await db.query.categoriesTable.findMany({
    orderBy: [categoriesTable.name],
  })
  return Response.json(categories)
}

export const POST: APIRoute = async ({ request, locals }) => {
  if (!isAdmin(locals.user)) return forbidden()
  const body = await request.json()
  const { name, slug, description, color } = body

  if (!name || !slug) {
    return Response.json(
      { error: "name and slug are required" },
      { status: 400 },
    )
  }

  const existing = await db.query.categoriesTable.findFirst({
    where: eq(categoriesTable.slug, slug),
    columns: { id: true },
  })

  if (existing) {
    return Response.json(
      { error: "Category with this slug already exists" },
      { status: 409 },
    )
  }

  const [category] = await db
    .insert(categoriesTable)
    .values({
      id: createCustomId(),
      name,
      slug,
      description: description ?? null,
      color: color ?? null,
    })
    .returning()

  await cache.deleteCache("categories:all")

  return Response.json(category, { status: 201 })
}

export const PATCH: APIRoute = async ({ request, locals }) => {
  if (!isAdmin(locals.user)) return forbidden()
  const body = await request.json()
  const { id, ...updates } = body

  if (!id) {
    return Response.json({ error: "id is required" }, { status: 400 })
  }

  const [updated] = await db
    .update(categoriesTable)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(categoriesTable.id, id))
    .returning()

  if (!updated) {
    return Response.json({ error: "Category not found" }, { status: 404 })
  }

  await cache.deleteCache("categories:all")

  return Response.json(updated)
}

export const DELETE: APIRoute = async ({ request, locals }) => {
  if (!isAdmin(locals.user)) return forbidden()
  const body = await request.json()
  const { id } = body

  if (!id) {
    return Response.json({ error: "id is required" }, { status: 400 })
  }

  await db.delete(categoriesTable).where(eq(categoriesTable.id, id))

  await cache.deleteCache("categories:all")

  return Response.json({ deleted: true })
}
