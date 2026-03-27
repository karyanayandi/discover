import type { APIRoute } from "astro"
import { Result as R } from "better-result"

import { isAdmin } from "@/lib/auth/is-admin"
import { logger } from "@/lib/logger"
import { runPipeline } from "@/lib/pipeline/orchestrator"

export const POST: APIRoute = async ({ locals, request }) => {
  const host = request.headers.get("host") || ""
  const isLocal = host.includes("localhost") || host.includes("127.0.0.1")

  if (!isLocal && !isAdmin(locals.user)) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  logger.info("Pipeline run triggered via API")

  const result = await runPipeline()

  if (R.isError(result)) {
    logger.error(`Pipeline failed: ${result.error.message}`)
    return Response.json({ error: result.error.message }, { status: 500 })
  }

  return Response.json({
    success: true,
    result: result.value,
  })
}
