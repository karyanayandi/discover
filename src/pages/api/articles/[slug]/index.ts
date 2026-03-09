import type { APIRoute } from "astro"
import { eq } from "drizzle-orm"

import { createRedisCache } from "@/lib/cache"
import { db } from "@/lib/db/client"
import {
  articleCategoriesTable,
  articleSectionsTable,
  articlesTable,
  categoriesTable,
  citationsTable,
} from "@/lib/db/schemas"

const cache = createRedisCache()

export const GET: APIRoute = async ({ params }) => {
  const { slug } = params
  if (!slug) {
    return Response.json({ error: "Slug is required" }, { status: 400 })
  }

  const cacheKey = `articles:${slug}`
  const cached = await cache.getCache(cacheKey)
  if (cached) {
    return Response.json(cached)
  }

  const article = await db.query.articlesTable.findFirst({
    where: eq(articlesTable.slug, slug),
  })

  if (!article) {
    return Response.json({ error: "Article not found" }, { status: 404 })
  }

  const [sections, citations, categoryLinks] = await Promise.all([
    db.query.articleSectionsTable.findMany({
      where: eq(articleSectionsTable.articleId, article.id),
      orderBy: [articleSectionsTable.sortOrder],
    }),
    db.query.citationsTable.findMany({
      where: eq(citationsTable.articleId, article.id),
      orderBy: [citationsTable.sortOrder],
    }),
    db
      .select({ slug: categoriesTable.slug, name: categoriesTable.name })
      .from(articleCategoriesTable)
      .innerJoin(
        categoriesTable,
        eq(articleCategoriesTable.categoryId, categoriesTable.id),
      )
      .where(eq(articleCategoriesTable.articleId, article.id)),
  ])

  const result = {
    ...article,
    sections,
    citations,
    categories: categoryLinks,
  }

  await cache.setCache(cacheKey, result, 1800)
  return Response.json(result)
}
