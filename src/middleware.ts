import { defineMiddleware, sequence } from "astro:middleware"
import { hashApiKey } from "@/lib/api-keys"
import { auth } from "@/lib/auth"
import {
  getApiKeyByHash,
  updateApiKeyLastUsed,
} from "@/lib/db/queries/api-keys"

async function initSchedulerSafe(): Promise<void> {
  try {
    const { initScheduler } = await import("@/lib/pipeline/scheduler")
    await initScheduler()
  } catch (e) {
    console.error("Failed to initialize scheduler:", e)
  }
}

void initSchedulerSafe()

const sessionMiddleware = defineMiddleware(async (context, next) => {
  const session = await auth.api.getSession({
    headers: context.request.headers,
  })

  context.locals.user = session?.user ?? null
  context.locals.session = session?.session ?? null

  return next()
})

const apiKeyMiddleware = defineMiddleware(async (context, next) => {
  // Skip if user is already authenticated via session
  if (context.locals.user) {
    return next()
  }

  // Check for Bearer token in Authorization header
  const authHeader = context.request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return next()
  }

  const apiKey = authHeader.slice(7).trim()
  if (!apiKey) {
    return next()
  }

  try {
    const keyHash = hashApiKey(apiKey)
    const apiKeyRecord = await getApiKeyByHash(keyHash)

    if (!apiKeyRecord) {
      return next()
    }

    if (!apiKeyRecord.isActive) {
      return next()
    }

    // Get user from auth
    const user = await auth.api.getUser({
      query: { id: apiKeyRecord.userId },
    })

    if (!user) {
      return next()
    }

    // Update last used timestamp (fire and forget)
    void updateApiKeyLastUsed(apiKeyRecord.id)

    // Set user context (no session created)
    context.locals.user = user
    context.locals.apiKeyAuth = true

    return next()
  } catch (error) {
    console.error("API key auth error:", error)
    return next()
  }
})

const authGuardMiddleware = defineMiddleware((context, next) => {
  const { pathname } = context.url
  const user = context.locals.user

  const isAdminRoute =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/api/internal")

  if (isAdminRoute && user?.role !== "admin") {
    if (pathname.startsWith("/api/")) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      })
    }
    return context.redirect("/login")
  }

  if (pathname.startsWith("/library") && !user) {
    return context.redirect("/login")
  }

  return next()
})

export const onRequest = sequence(
  sessionMiddleware,
  apiKeyMiddleware,
  authGuardMiddleware,
)
