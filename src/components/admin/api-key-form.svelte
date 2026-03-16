<script lang="ts">
import Button from "@/components/ui/button/button.svelte"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "svelte-sonner"
import { createForm } from "@tanstack/svelte-form"
import { z } from "zod"

let {
  maskedKey = "",
}: {
  maskedKey?: string
} = $props()

const apiKeySchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
})

interface ApiKeyFormData {
  apiKey: string
}

const form = createForm(() => ({
  defaultValues: {
    apiKey: "",
  } as ApiKeyFormData,
  validators: {
    onChange: apiKeySchema,
  },
  onSubmit: async ({ value }: { value: ApiKeyFormData }) => {
    const res = await fetch("/api/admin/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([
        { key: "openai_api_key", value: value.apiKey.trim() },
      ]),
    })

    if (!res.ok) {
      const data = await res.json()
      toast.error(data.error ?? "Failed to save API key")
      return
    }

    toast.success("API key updated")
    form.reset()
  },
}))
</script>

<form
  onsubmit={(e) => {
    e.preventDefault()
    form.handleSubmit()
  }}
  class="space-y-4 rounded-xl border border-border bg-card p-6"
>
  <h3 class="font-semibold">OpenAI API Key</h3>

  {#if maskedKey}
    <div class="text-sm text-muted-foreground">
      Current key: <code class="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{maskedKey}</code>
    </div>
  {/if}

  <form.Field name="apiKey">
    {#snippet children(field)}
      <div class="space-y-2">
        <Label for="api-key">New API Key</Label>
        <Input
          id="api-key"
          name="apiKey"
          type="password"
          placeholder="sk-..."
          value={field.state.value as string}
          oninput={(e) => field.handleChange(e.currentTarget.value)}
          onblur={field.handleBlur}
          autocomplete="off"
        />
        {#if field.state.meta.errors.length > 0}
          <span class="text-sm text-red-500">{field.state.meta.errors[0]}</span>
        {/if}
        <p class="text-xs text-muted-foreground">
          Used for AI article summarization. Stored encrypted in the database.
        </p>
      </div>
    {/snippet}
  </form.Field>

  <Button type="submit" disabled={form.state.isSubmitting}>
    {#if form.state.isSubmitting}
      Saving...
    {:else}
      Update API Key
    {/if}
  </Button>
</form>
