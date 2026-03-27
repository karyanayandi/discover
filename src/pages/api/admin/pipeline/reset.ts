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
    const body = await request.json().catch(() => ({}))
    const resetType = body.type || "processing"

    if (resetType === "failed") {
      const failedItems = await db.query.feedItemsTable.findMany({
        where: eq(feedItemsTable.status, "failed"),
        columns: { id: true, title: true },
      })

      if (failedItems.length === 0) {
        return Response.json({
          success: true,
          message: "No failed items found",
          count: 0,
        })
      }

      await db
        .update(feedItemsTable)
        .set({
          status: "pending",
          errorMessage: null,
        })
        .where(eq(feedItemsTable.status, "failed"))

      logger.info(`Reset ${failedItems.length} failed items to pending`)

      return Response.json({
        success: true,
        message: `Reset ${failedItems.length} failed items to pending`,
        count: failedItems.length,
      })
    } else {
      const stuckItems = await db.query.feedItemsTable.findMany({
        where: eq(feedItemsTable.status, "processing"),
        columns: { id: true, title: true },
      })

      if (stuckItems.length === 0) {
        return Response.json({
          success: true,
          message: "No stuck items found",
          count: 0,
        })
      }

      await db
        .update(feedItemsTable)
        .set({
          status: "pending",
          errorMessage: null,
        })
        .where(eq(feedItemsTable.status, "processing"))

      logger.info(`Reset ${stuckItems.length} stuck items to pending`)

      return Response.json({
        success: true,
        message: `Reset ${stuckItems.length} stuck items to pending`,
        count: stuckItems.length,
      })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger.error(`Failed to reset pipeline: ${message}`)
    return Response.json(
      { error: `Failed to reset: ${message}` },
      { status: 500 },
    )
  }
}
