import type { APIRoute } from "astro"
import { z } from "zod"

import {
  deleteApiKeyByUserId,
  getApiKeyById,
  renameApiKey,
  toggleApiKeyStatus,
} from "@/lib/db/queries/api-keys"

const renameSchema = z.object({
  name: z.string().min(1).max(100),
})

const statusSchema = z.object({
  isActive: z.boolean(),
})

export const PATCH: APIRoute = async (context) => {
  const user = context.locals.user
  const keyId = context.params.id

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  if (!keyId) {
    return new Response(JSON.stringify({ error: "Key ID required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  try {
    const body = await context.request.json()

    // Check if this is a rename or status update
    if ("name" in body) {
      const { name } = renameSchema.parse(body)

      // Verify the key belongs to the user
      const key = await getApiKeyById(keyId)
      if (!key) {
        return new Response(JSON.stringify({ error: "Key not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        })
      }

      if (key.userId !== user.id) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        })
      }

      const updatedKey = await renameApiKey(keyId, user.id, name)

      return new Response(
        JSON.stringify({
          id: updatedKey?.id,
          name: updatedKey?.name,
          isActive: updatedKey?.isActive,
          createdAt: updatedKey?.createdAt,
          lastUsedAt: updatedKey?.lastUsedAt,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    if ("isActive" in body) {
      const { isActive } = statusSchema.parse(body)

      // Verify the key belongs to the user
      const key = await getApiKeyById(keyId)
      if (!key) {
        return new Response(JSON.stringify({ error: "Key not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        })
      }

      if (key.userId !== user.id) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        })
      }

      const updatedKey = await toggleApiKeyStatus(keyId, user.id, isActive)

      return new Response(
        JSON.stringify({
          id: updatedKey?.id,
          name: updatedKey?.name,
          isActive: updatedKey?.isActive,
          createdAt: updatedKey?.createdAt,
          lastUsedAt: updatedKey?.lastUsedAt,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
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

    console.error("Error updating API key:", error)
    return new Response(JSON.stringify({ error: "Failed to update API key" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

export const DELETE: APIRoute = async (context) => {
  const user = context.locals.user
  const keyId = context.params.id

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  if (!keyId) {
    return new Response(JSON.stringify({ error: "Key ID required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  try {
    // Verify the key belongs to the user before deleting
    const key = await getApiKeyById(keyId)
    if (!key) {
      return new Response(JSON.stringify({ error: "Key not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    }

    if (key.userId !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      })
    }

    const deleted = await deleteApiKeyByUserId(keyId, user.id)

    if (!deleted) {
      return new Response(JSON.stringify({ error: "Key not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Error deleting API key:", error)
    return new Response(JSON.stringify({ error: "Failed to delete API key" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
