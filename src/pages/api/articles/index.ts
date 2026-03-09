import type { APIRoute } from "astro"
import { and, count, desc, eq, sql } from "drizzle-orm"

import { createRedisCache } from "@/lib/cache"
import { db } from "@/lib/db/client"
import {
  articleCategoriesTable,
  articlesTable,
  categoriesTable,
} from "@/lib/db/schemas"

const cache = createRedisCache()

export const GET: APIRoute = async ({ url }) => {
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"))
  const limit = Math.min(
    50,
    Math.max(1, Number(url.searchParams.get("limit") ?? "20")),
  )
  const category = url.searchParams.get("category") ?? ""
  const offset = (page - 1) * limit

  const cacheKey = `articles:feed:page:${page}:limit:${limit}:category:${category}`
  const cached = await cache.getCache(cacheKey)
  if (cached) {
    return Response.json(cached)
  }

  const conditions = [eq(articlesTable.status, "published")]

  if (category) {
    const cat = await db.query.categoriesTable.findFirst({
      where: eq(categoriesTable.slug, category),
      columns: { id: true },
    })
    if (cat) {
      const articleIds = await db
        .select({ articleId: articleCategoriesTable.articleId })
        .from(articleCategoriesTable)
        .where(eq(articleCategoriesTable.categoryId, cat.id))

      const ids = articleIds.map((r) => r.articleId)
      if (ids.length > 0) {
        conditions.push(
          sql`${articlesTable.id} IN (${sql.join(
            ids.map((id) => sql`${id}`),
            sql`, `,
          )})`,
        )
      } else {
        const result = { articles: [], total: 0, page, limit }
        await cache.setCache(cacheKey, result, 300)
        return Response.json(result)
      }
    }
  }

  const where = and(...conditions)

  const [articles, [totalRow]] = await Promise.all([
    db.query.articlesTable.findMany({
      where,
      orderBy: [desc(articlesTable.publishedAt)],
      limit,
      offset,
      columns: {
        id: true,
        slug: true,
        title: true,
        summary: true,
        thumbnailUrl: true,
        sourceCount: true,
        readingTimeMinutes: true,
        publishedAt: true,
      },
    }),
    db.select({ count: count() }).from(articlesTable).where(where),
  ])

  const result = {
    articles,
    total: totalRow?.count ?? 0,
    page,
    limit,
  }

  await cache.setCache(cacheKey, result, 300)
  return Response.json(result)
}
