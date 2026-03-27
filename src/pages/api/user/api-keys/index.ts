import type { APIRoute } from "astro"
import { z } from "zod"
import { generateApiKey, generateApiKeyId, hashApiKey } from "@/lib/api-keys"
import { createApiKey, getApiKeysByUserId } from "@/lib/db/queries/api-keys"

const createApiKeySchema = z.object({
  name: z.string().min(1).max(100).optional(),
})

export const GET: APIRoute = async (context) => {
  const user = context.locals.user

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  try {
    const keys = await getApiKeysByUserId(user.id)

    const sanitizedKeys = keys.map((key) => ({
      id: key.id,
      name: key.name,
      isActive: key.isActive,
      createdAt: key.createdAt,
      lastUsedAt: key.lastUsedAt,
    }))

    return new Response(JSON.stringify(sanitizedKeys), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Error fetching API keys:", error)
    return new Response(JSON.stringify({ error: "Failed to fetch API keys" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

export const POST: APIRoute = async (context) => {
  const user = context.locals.user

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  try {
    const body = await context.request.json()
    const { name } = createApiKeySchema.parse(body)

    const apiKey = generateApiKey()
    const keyHash = hashApiKey(apiKey)
    const keyId = generateApiKeyId()

    const defaultName = `API Key ${new Date().toLocaleDateString()}`

    await createApiKey({
      id: keyId,
      userId: user.id,
      name: name ?? defaultName,
      keyHash,
      isActive: true,
    })

    return new Response(
      JSON.stringify({
        id: keyId,
        name: name ?? defaultName,
        key: apiKey,
        isActive: true,
        createdAt: new Date().toISOString(),
        lastUsedAt: null,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: "Invalid request", details: error.issues }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    console.error("Error creating API key:", error)
    return new Response(JSON.stringify({ error: "Failed to create API key" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
