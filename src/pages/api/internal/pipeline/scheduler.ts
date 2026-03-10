import type { APIRoute } from "astro"

import { isAdmin } from "@/lib/auth/is-admin"
import { getSchedulerStatus } from "@/lib/pipeline/scheduler"

export const GET: APIRoute = ({ locals }) => {
  if (!isAdmin(locals.user)) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  return Response.json(getSchedulerStatus())
}
