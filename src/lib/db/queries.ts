import { eq } from "drizzle-orm"
import { db } from "./client"
import { articlesTable, savedArticlesTable } from "./schemas"

export async function getSavedSlugsForUser(userId: string): Promise<string[]> {
  const rows = await db
    .select({ slug: articlesTable.slug })
    .from(savedArticlesTable)
    .innerJoin(
      articlesTable,
      eq(savedArticlesTable.articleId, articlesTable.id),
    )
    .where(eq(savedArticlesTable.userId, userId))

  return rows.map((r) => r.slug)
}
