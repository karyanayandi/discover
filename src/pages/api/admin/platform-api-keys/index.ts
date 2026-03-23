import type { APIRoute } from "astro"
import { z } from "zod"
import { generateApiKeyId } from "@/lib/api-keys"
import { isAdmin } from "@/lib/auth/is-admin"
import {
  createPlatformApiKey,
  getAllPlatformApiKeys,
} from "@/lib/db/queries/platform-api-keys"

const createSchema = z.object({
  provider: z.string().min(1),
  name: z.string().min(1),
  keyValue: z.string().min(1),
})

const forbidden = () => Response.json({ error: "Forbidden" }, { status: 403 })

export const GET: APIRoute = async ({ locals }) => {
  if (!isAdmin(locals.user)) return forbidden()

  const keys = await getAllPlatformApiKeys()
  return Response.json(keys)
}

export const POST: APIRoute = async ({ request, locals }) => {
  if (!isAdmin(locals.user)) return forbidden()

  const body = await request.json()
  const result = createSchema.safeParse(body)

  if (!result.success) {
    const flattened = z.flattenError(result.error)
    return Response.json(
      { error: "Invalid input", details: flattened },
      { status: 400 },
    )
  }

  const { provider, name, keyValue } = result.data

  const key = await createPlatformApiKey({
    id: generateApiKeyId(),
    provider,
    name,
    keyHash: keyValue,
    isActive: true,
  })

  return Response.json(key, { status: 201 })
}
