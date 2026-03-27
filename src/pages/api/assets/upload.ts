import type { APIRoute } from "astro"

import { isAdmin } from "@/lib/auth/is-admin"
import { db } from "@/lib/db/client"
import { type AssetType, assetsTable } from "@/lib/db/schemas"
import { getR2Storage } from "@/lib/storage"

const forbidden = () => Response.json({ error: "Forbidden" }, { status: 403 })

export const POST: APIRoute = async ({ request, locals }) => {
  if (!isAdmin(locals.user)) return forbidden()

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 })
    }

    // Get asset settings
    const settings = await db.query.assetSettingsTable.findFirst()
    const maxSizeMB = settings?.maxUploadSizeMB ?? 50
    const maxSizeBytes = maxSizeMB * 1024 * 1024

    if (file.size > maxSizeBytes) {
      return Response.json(
        { error: `File size exceeds ${maxSizeMB}MB limit` },
        { status: 413 },
      )
    }

    const r2 = getR2Storage()
    const buffer = Buffer.from(await file.arrayBuffer())

    const uploadResult = await r2.uploadAsset(
      buffer,
      file.name,
      file.type || "application/octet-stream",
    )

    if (uploadResult.isErr()) {
      return Response.json(
        { error: uploadResult.error.message },
        { status: 500 },
      )
    }

    const { url, type, size, key } = uploadResult.value

    // Save to database
    const [asset] = await db
      .insert(assetsTable)
      .values({
        filename: key,
        originalName: file.name,
        type: type as AssetType,
        size,
        url,
      })
      .returning()

    return Response.json(asset, { status: 201 })
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
