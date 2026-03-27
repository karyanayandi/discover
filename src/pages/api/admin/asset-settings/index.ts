import type { APIRoute } from "astro"
import { eq } from "drizzle-orm"

import { isAdmin } from "@/lib/auth/is-admin"
import { db } from "@/lib/db/client"
import { assetSettingsTable } from "@/lib/db/schemas"

const forbidden = () => Response.json({ error: "Forbidden" }, { status: 403 })

export const GET: APIRoute = async ({ locals }) => {
  if (!isAdmin(locals.user)) return forbidden()

  try {
    const settings = await db.query.assetSettingsTable.findFirst()

    if (!settings) {
      // Return default settings if none exist
      return Response.json({ maxUploadSizeMB: 50 })
    }

    return Response.json({ maxUploadSizeMB: settings.maxUploadSizeMB })
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}

export const POST: APIRoute = async ({ request, locals }) => {
  if (!isAdmin(locals.user)) return forbidden()

  try {
    const body = await request.json()
    const { maxUploadSizeMB } = body

    if (maxUploadSizeMB === undefined || maxUploadSizeMB === null) {
      return Response.json(
        { error: "maxUploadSizeMB is required" },
        { status: 400 },
      )
    }

    const size = Number.parseInt(String(maxUploadSizeMB), 10)

    if (Number.isNaN(size) || size <= 0 || size > 500) {
      return Response.json(
        { error: "maxUploadSizeMB must be between 1 and 500" },
        { status: 400 },
      )
    }

    // Check if settings exist
    const existing = await db.query.assetSettingsTable.findFirst()

    if (existing) {
      // Update existing
      await db
        .update(assetSettingsTable)
        .set({ maxUploadSizeMB: size })
        .where(eq(assetSettingsTable.id, existing.id))
    } else {
      // Create new
      await db.insert(assetSettingsTable).values({ maxUploadSizeMB: size })
    }

    return Response.json({ maxUploadSizeMB: size })
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}
