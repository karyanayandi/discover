<script lang="ts">
import { Button } from "@/components/ui/button"
import { toast } from "svelte-sonner"

let running = $state(false)

async function handleRunPipeline() {
  if (running) return
  running = true

  try {
    const res = await fetch("/api/internal/pipeline/run", {
      method: "POST",
    })
    const data = await res.json()

    if (res.ok) {
      const r = data.result
      toast.success("Pipeline completed", {
        description: `${r.articlesCreated} articles created from ${r.clustersFound} clusters. ${r.errors?.length ?? 0} errors.`,
      })
    } else {
      toast.error("Pipeline failed", {
        description: data.error ?? "Unknown error",
      })
    }
  } catch {
    toast.error("Network error", {
      description: "Check server logs",
    })
  } finally {
    running = false
  }
}
</script>

<Button
  onclick={handleRunPipeline}
  disabled={running}
  class="inline-flex items-center gap-2"
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <polygon points="6 3 20 12 6 21 6 3"></polygon>
  </svg>
  {running ? "Running..." : "Run Pipeline"}
</Button>
