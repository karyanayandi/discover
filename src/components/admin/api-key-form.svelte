<script lang="ts">
import Button from "@/components/ui/button/button.svelte"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "svelte-sonner"

let {
  maskedKey = "",
}: {
  maskedKey?: string
} = $props()

let apiKey = $state("")
let loading = $state(false)

async function handleSubmit(e: SubmitEvent) {
  e.preventDefault()
  if (!apiKey.trim()) {
    toast.error("API key is required")
    return
  }

  loading = true
  try {
    const res = await fetch("/api/admin/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([{ key: "openai_api_key", value: apiKey.trim() }]),
    })

    if (!res.ok) {
      const data = await res.json()
      toast.error(data.error ?? "Failed to save API key")
      return
    }

    toast.success("API key updated")
    apiKey = ""
  } catch {
    toast.error("Network error")
  } finally {
    loading = false
  }
}
</script>

<form
  onsubmit={handleSubmit}
  class="space-y-4 rounded-xl border border-border bg-card p-6"
>
  <h3 class="font-semibold">OpenAI API Key</h3>

  {#if maskedKey}
    <div class="text-sm text-muted-foreground">
      Current key: <code class="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{maskedKey}</code>
    </div>
  {/if}

  <div class="space-y-2">
    <Label for="api-key">New API Key</Label>
    <Input
      id="api-key"
      type="password"
      placeholder="sk-..."
      bind:value={apiKey}
      autocomplete="off"
    />
    <p class="text-xs text-muted-foreground">
      Used for AI article summarization. Stored encrypted in the database.
    </p>
  </div>

  <Button type="submit" disabled={loading}>
    {#if loading}
      Saving...
    {:else}
      Update API Key
    {/if}
  </Button>
</form>
