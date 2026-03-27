import type { APIRoute } from "astro"
import { eq } from "drizzle-orm"

import { isAdmin } from "@/lib/auth/is-admin"
import { db } from "@/lib/db/client"
import { feedItemsTable } from "@/lib/db/schemas"
import { logger } from "@/lib/logger"
import { runPipelineForItems } from "@/lib/pipeline/single-item-processor"

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

    logger.info(`Starting single item processing for: ${feedItemId}`)

    // Process just this single item
    const result = await runPipelineForItems([feedItemId])

    if (result.isErr()) {
      logger.error(`Failed to process ${feedItemId}: ${result.error.message}`)
      return Response.json(
        { error: `Failed: ${result.error.message}` },
        { status: 500 },
      )
    }

    const { articleId, status } = result.value

    if (status === "processed" && articleId) {
      return Response.json({
        success: true,
        message: "Article generated successfully!",
        articleId,
      })
    } else if (status === "skipped") {
      return Response.json({
        success: true,
        message: "Item was skipped (duplicate content)",
      })
    } else {
      return Response.json(
        {
          error: `Processing failed with status: ${status}`,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("Generate article error:", error)
    return Response.json(
      { error: `Failed to process: ${message}` },
      { status: 500 },
    )
  }
}
