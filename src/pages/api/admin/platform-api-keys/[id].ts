import type { APIRoute } from "astro"
import { z } from "zod"

import { isAdmin } from "@/lib/auth/is-admin"
import {
  deletePlatformApiKey,
  getPlatformApiKeyById,
  updatePlatformApiKey,
} from "@/lib/db/queries/platform-api-keys"

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  keyValue: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
})

const forbidden = () => Response.json({ error: "Forbidden" }, { status: 403 })
const notFound = () => Response.json({ error: "Not found" }, { status: 404 })

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  if (!isAdmin(locals.user)) return forbidden()

  const { id } = params
  if (!id) return notFound()

  const body = await request.json()
  const result = patchSchema.safeParse(body)

  if (!result.success) {
    const flattened = z.flattenError(result.error)
    return Response.json(
      { error: "Invalid input", details: flattened },
      { status: 400 },
    )
  }

  const existingKey = await getPlatformApiKeyById(id)
  if (!existingKey) return notFound()

  const updateData: { name?: string; keyHash?: string; isActive?: boolean } = {}

  if (result.data.name !== undefined) {
    updateData.name = result.data.name
  }

  if (result.data.keyValue !== undefined) {
    updateData.keyHash = result.data.keyValue
  }

  if (result.data.isActive !== undefined) {
    updateData.isActive = result.data.isActive
  }

  if (Object.keys(updateData).length === 0) {
    return Response.json({ error: "No fields to update" }, { status: 400 })
  }

  const updatedKey = await updatePlatformApiKey(id, updateData)

  return Response.json(updatedKey)
}

export const DELETE: APIRoute = async ({ params, locals }) => {
  if (!isAdmin(locals.user)) return forbidden()

  const { id } = params
  if (!id) return notFound()

  const existingKey = await getPlatformApiKeyById(id)
  if (!existingKey) return notFound()

  await deletePlatformApiKey(id)

  return new Response(null, { status: 204 })
}
