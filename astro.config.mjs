// @ts-check

import node from "@astrojs/node"
import sitemap from "@astrojs/sitemap"
import svelte from "@astrojs/svelte"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "astro/config"

// https://astro.build/config
export default defineConfig({
  site: "https://discover.teknodaim.com",
  server: {
    port: 4321,
    host: true,
  },
  output: "server",
  adapter: node({ mode: "standalone" }),

  integrations: [
    svelte(),
    sitemap({
      filter: (page) =>
        !page.includes("/admin/") &&
        !page.includes("/login") &&
        !page.includes("/settings") &&
        !page.includes("/library"),
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
    preview: {
      port: 4321,
      host: true,
    },
    ssr: {
      external: ["ioredis"],
    },
  },

  experimental: {
    clientPrerender: true,
    rustCompiler: true,
    queuedRendering: {
      enabled: true,
    },
  },
})
