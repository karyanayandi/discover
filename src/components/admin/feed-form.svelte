<script lang="ts">
import Button from "@/components/ui/button/button.svelte"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "svelte-sonner"

let {
  feed = null,
  onSuccess,
}: {
  feed?: {
    id: string
    name: string
    url: string
    enabled: boolean
  } | null
  onSuccess?: () => void
} = $props()

let name = $state(feed?.name ?? "")
let url = $state(feed?.url ?? "")
let enabled = $state(feed?.enabled ?? true)
let loading = $state(false)

async function handleSubmit(e: SubmitEvent) {
  e.preventDefault()
  if (!name.trim() || !url.trim()) {
    toast.error("Name and URL are required")
    return
  }

  loading = true
  try {
    const endpoint = feed ? `/api/admin/feeds/${feed.id}` : "/api/admin/feeds"
    const method = feed ? "PATCH" : "POST"

    const res = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), url: url.trim(), enabled }),
    })

    if (!res.ok) {
      const data = await res.json()
      toast.error(data.error ?? "Failed to save feed")
      return
    }

    toast.success(feed ? "Feed updated" : "Feed created")
    if (!feed) {
      name = ""
      url = ""
      enabled = true
    }
    onSuccess?.()
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
  <h3 class="font-semibold">
    {feed ? "Edit Feed Source" : "Add Feed Source"}
  </h3>

  <div class="space-y-2">
    <Label for="feed-name">Name</Label>
    <Input
      id="feed-name"
      placeholder="TechCrunch AI"
      bind:value={name}
    />
  </div>

  <div class="space-y-2">
    <Label for="feed-url">RSS Feed URL</Label>
    <Input
      id="feed-url"
      type="url"
      placeholder="https://example.com/rss"
      bind:value={url}
    />
  </div>

  <div class="flex items-center gap-2">
    <input
      id="feed-enabled"
      type="checkbox"
      bind:checked={enabled}
      class="h-4 w-4 rounded border-border"
    />
    <Label for="feed-enabled">Enabled</Label>
  </div>

  <div class="flex gap-2">
    <Button type="submit" disabled={loading}>
      {#if loading}
        Saving...
      {:else}
        {feed ? "Update" : "Add Feed"}
      {/if}
    </Button>
  </div>
</form>
