import type { APIRoute } from "astro"
import { eq } from "drizzle-orm"

import { isAdmin } from "@/lib/auth/is-admin"
import { db } from "@/lib/db/client"
import { feedItemsTable } from "@/lib/db/schemas"
import { logger } from "@/lib/logger"

export const POST: APIRoute = async ({ locals, request }) => {
  if (!isAdmin(locals.user)) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { feedItemId } = body

    if (!feedItemId) {
      return Response.json({ error: "feedItemId is required" }, { status: 400 })
    }

    // Get the feed item
    const feedItem = await db.query.feedItemsTable.findFirst({
      where: eq(feedItemsTable.id, feedItemId),
    })

    if (!feedItem) {
      return Response.json({ error: "Feed item not found" }, { status: 404 })
    }

    if (feedItem.status === "processed") {
      return Response.json(
        { error: "Feed item already processed" },
        { status: 400 },
      )
    }

    if (feedItem.status === "processing") {
      return Response.json(
        { error: "Feed item is already being processed" },
        { status: 400 },
      )
    }

    // Update status to processing
    await db
      .update(feedItemsTable)
      .set({ status: "processing" })
      .where(eq(feedItemsTable.id, feedItemId))

    logger.info(
      `Manual article generation started for feed item: ${feedItemId}`,
    )

    // Run pipeline in background - don't await it
    void (async () => {
      try {
        const { runPipeline } = await import("@/lib/pipeline/orchestrator")
        const result = await runPipeline()

        if (result.isErr()) {
          logger.error(
            `Pipeline failed for ${feedItemId}: ${result.error.message}`,
          )
          // Status is already processing, will be updated by pipeline
        } else {
          logger.info(
            `Pipeline completed for ${feedItemId}. Articles created: ${result.value.articlesCreated}`,
          )
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        logger.error(`Pipeline error for ${feedItemId}: ${message}`)
      }
    })()

    // Return immediately
    return Response.json({
      success: true,
      message: "Pipeline started in background. Refresh to see results.",
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("Generate article error:", error)
    return Response.json(
      { error: `Failed to start pipeline: ${message}` },
      { status: 500 },
    )
  }
}
