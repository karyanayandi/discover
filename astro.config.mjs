// @ts-check

import node from "@astrojs/node"
import sitemap from "@astrojs/sitemap"
import svelte from "@astrojs/svelte"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "astro/config"

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: node({ mode: "standalone" }),
  site: "https://discover.example.com",

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
  },
})
