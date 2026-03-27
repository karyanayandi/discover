import type { APIRoute } from "astro"
import { desc, eq } from "drizzle-orm"

import { isAdmin } from "@/lib/auth/is-admin"
import { db } from "@/lib/db/client"
import { type AssetType, assetsTable } from "@/lib/db/schemas"

const forbidden = () => Response.json({ error: "Forbidden" }, { status: 403 })

export const GET: APIRoute = async ({ url, locals }) => {
  if (!isAdmin(locals.user)) return forbidden()

  const type = url.searchParams.get("type") as AssetType | null
  const limit = Number.parseInt(url.searchParams.get("limit") ?? "50", 10)
  const offset = Number.parseInt(url.searchParams.get("offset") ?? "0", 10)

  const assets = await db.query.assetsTable.findMany({
    where: type ? eq(assetsTable.type, type) : undefined,
    orderBy: [desc(assetsTable.createdAt)],
    limit,
    offset,
  })

  return Response.json({ assets })
}
