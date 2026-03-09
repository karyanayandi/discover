import type { APIRoute } from "astro"
import { and, eq } from "drizzle-orm"

import { createRedisCache } from "@/lib/cache"
import { db } from "@/lib/db/client"
import { articlesTable, savedArticlesTable } from "@/lib/db/schemas"
import { createCustomId } from "@/lib/utils/custom-id"

const cache = createRedisCache()

export const POST: APIRoute = async ({ params, locals }) => {
  const user = locals.user
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { slug } = params
  if (!slug) {
    return Response.json({ error: "Slug is required" }, { status: 400 })
  }

  const article = await db.query.articlesTable.findFirst({
    where: eq(articlesTable.slug, slug),
    columns: { id: true },
  })

  if (!article) {
    return Response.json({ error: "Article not found" }, { status: 404 })
  }

  const existing = await db.query.savedArticlesTable.findFirst({
    where: and(
      eq(savedArticlesTable.userId, user.id),
      eq(savedArticlesTable.articleId, article.id),
    ),
  })

  if (existing) {
    return Response.json({ saved: true, message: "Already saved" })
  }

  await db.insert(savedArticlesTable).values({
    id: createCustomId(),
    userId: user.id,
    articleId: article.id,
  })

  await cache.deleteCache(`saved:${user.id}`)

  return Response.json({ saved: true })
}

export const DELETE: APIRoute = async ({ params, locals }) => {
  const user = locals.user
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { slug } = params
  if (!slug) {
    return Response.json({ error: "Slug is required" }, { status: 400 })
  }

  const article = await db.query.articlesTable.findFirst({
    where: eq(articlesTable.slug, slug),
    columns: { id: true },
  })

  if (!article) {
    return Response.json({ error: "Article not found" }, { status: 404 })
  }

  await db
    .delete(savedArticlesTable)
    .where(
      and(
        eq(savedArticlesTable.userId, user.id),
        eq(savedArticlesTable.articleId, article.id),
      ),
    )

  await cache.deleteCache(`saved:${user.id}`)

  return Response.json({ saved: false })
}
