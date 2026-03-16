<script lang="ts">
import Button from "@/components/ui/button/button.svelte"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "svelte-sonner"
import ModelSelector from "@/components/model-selector.svelte"
import { createForm } from "@tanstack/svelte-form"
import { z } from "zod"

let {
  cluster = null,
  onSuccess,
}: {
  cluster?: {
    id: string
    topic: string
    keywords: string[]
    aiModel: string | null
  } | null
  onSuccess?: () => void
} = $props()

const clusterSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  keywords: z.string(),
  aiModel: z.string(),
})

interface ClusterFormData {
  topic: string
  keywords: string
  aiModel: string
}

const form = createForm(() => ({
  defaultValues: {
    topic: cluster?.topic ?? "",
    keywords: cluster?.keywords?.join(", ") ?? "",
    aiModel: cluster?.aiModel ?? "",
  } as ClusterFormData,
  validators: {
    onChange: clusterSchema,
  },
  onSubmit: async ({ value }: { value: ClusterFormData }) => {
    const endpoint = cluster
      ? `/api/admin/clusters/${cluster.id}`
      : "/api/admin/clusters"
    const method = cluster ? "PATCH" : "POST"

    const res = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: cluster?.id,
        topic: value.topic.trim(),
        keywords: value.keywords
          .split(",")
          .map((k: string) => k.trim())
          .filter(Boolean),
        aiModel: value.aiModel || null,
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      toast.error(data.error ?? "Failed to save cluster")
      return
    }

    toast.success(cluster ? "Cluster updated" : "Cluster created")
    if (!cluster) {
      form.reset()
    }
    onSuccess?.()
  },
}))

$effect(() => {
  if (cluster) {
    form.setFieldValue("topic", cluster.topic)
    form.setFieldValue("keywords", cluster.keywords.join(", "))
    form.setFieldValue("aiModel", cluster.aiModel ?? "")
  }
})
</script>

<form
  onsubmit={(e) => {
    e.preventDefault()
    form.handleSubmit()
  }}
  class="space-y-4 rounded-xl border border-border bg-card p-6"
>
  <h3 class="font-semibold">
    {cluster ? "Edit Cluster" : "Add Cluster"}
  </h3>

  <form.Field name="topic">
    {#snippet children(field)}
      <div class="space-y-2">
        <Label for="cluster-topic">Topic</Label>
        <Input
          id="cluster-topic"
          name="topic"
          placeholder="Technology News"
          value={field.state.value as string}
          oninput={(e) => field.handleChange(e.currentTarget.value)}
          onblur={field.handleBlur}
        />
        {#if field.state.meta.errors.length > 0}
          <span class="text-sm text-red-500">{field.state.meta.errors[0]}</span>
        {/if}
        <p class="text-xs text-muted-foreground">
          The main topic or theme for this cluster.
        </p>
      </div>
    {/snippet}
  </form.Field>

  <form.Field name="keywords">
    {#snippet children(field)}
      <div class="space-y-2">
        <Label for="cluster-keywords">Keywords (comma-separated)</Label>
        <Input
          id="cluster-keywords"
          name="keywords"
          placeholder="tech, software, ai, startup"
          value={field.state.value as string}
          oninput={(e) => field.handleChange(e.currentTarget.value)}
          onblur={field.handleBlur}
        />
        {#if field.state.meta.errors.length > 0}
          <span class="text-sm text-red-500">{field.state.meta.errors[0]}</span>
        {/if}
        <p class="text-xs text-muted-foreground">
          Keywords used to identify articles for this cluster.
        </p>
      </div>
    {/snippet}
  </form.Field>

  <form.Field name="aiModel">
    {#snippet children(field)}
      <ModelSelector
        value={field.state.value as string}
        onChange={(value) => field.handleChange(value)}
      />
    {/snippet}
  </form.Field>

  <div class="flex gap-2">
    <Button type="submit" disabled={form.state.isSubmitting}>
      {#if form.state.isSubmitting}
        Saving...
      {:else}
        {cluster ? "Update" : "Add Cluster"}
      {/if}
    </Button>
  </div>
</form>
