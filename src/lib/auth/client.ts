import { adminClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/svelte"
import { ac, roles } from "./permission"

const baseURL =
  typeof window !== "undefined"
    ? window.location.origin
    : (import.meta.env.PUBLIC_SITE_URL ?? "")

export const authClient = createAuthClient({
  baseURL,
  plugins: [
    adminClient({
      ac,
      roles,
      defaultRole: "user",
    }),
  ],
})
