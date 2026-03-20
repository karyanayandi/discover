import type { APIRoute } from "astro"
import { Result as R } from "better-result"

import { isAdmin } from "@/lib/auth/is-admin"
import { logger } from "@/lib/logger"
import { runPipeline } from "@/lib/pipeline/orchestrator"

export const POST: APIRoute = async ({ locals }) => {
  if (!isAdmin(locals.user)) {
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
