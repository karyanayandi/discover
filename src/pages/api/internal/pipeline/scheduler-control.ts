import type { APIRoute } from "astro"
import { Result as R } from "better-result"

import { isAdmin } from "@/lib/auth/is-admin"
import { logger } from "@/lib/logger"
import {
  disableScheduler,
  enableScheduler,
  getSchedulerStatus,
  updateSchedule,
} from "@/lib/pipeline/scheduler"

export const POST: APIRoute = async ({ locals, request }) => {
  if (!isAdmin(locals.user)) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = (await request.json()) as {
    action?: string
    cronPattern?: string
  }

  const { action, cronPattern } = body

  switch (action) {
    case "enable": {
      const result = await enableScheduler(cronPattern)
      if (R.isError(result)) {
        return Response.json({ error: result.error.message }, { status: 400 })
      }
      logger.info(
        `Scheduler enabled by admin (cron: ${cronPattern ?? "default"})`,
      )
      break
    }
    case "disable": {
      const result = await disableScheduler()
      if (R.isError(result)) {
        return Response.json({ error: result.error.message }, { status: 500 })
      }
      logger.info("Scheduler disabled by admin")
      break
    }
    case "update_schedule": {
      if (!cronPattern) {
        return Response.json({ error: "Missing cronPattern" }, { status: 400 })
      }
      const result = await updateSchedule(cronPattern)
      if (R.isError(result)) {
        return Response.json({ error: result.error.message }, { status: 400 })
      }
      logger.info(`Scheduler schedule updated by admin to "${cronPattern}"`)
      break
    }
    default:
      return Response.json({ error: "Invalid action" }, { status: 400 })
  }

  return Response.json({
    success: true,
    status: getSchedulerStatus(),
  })
}
