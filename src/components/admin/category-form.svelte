<script lang="ts">
import Button from "@/components/ui/button/button.svelte"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "svelte-sonner"

let {
  category = null,
  onSuccess,
}: {
  category?: {
    id: string
    name: string
    slug: string
    description: string | null
  } | null
  onSuccess?: () => void
} = $props()

let name = $state(category?.name ?? "")
let slug = $state(category?.slug ?? "")
let description = $state(category?.description ?? "")
let loading = $state(false)
let slugManuallyEdited = $state(!!category)

function generateSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

function handleNameInput() {
  if (!slugManuallyEdited) {
    slug = generateSlug(name)
  }
}

function handleSlugInput() {
  slugManuallyEdited = true
}

async function handleSubmit(e: SubmitEvent) {
  e.preventDefault()
  if (!name.trim() || !slug.trim()) {
    toast.error("Name and slug are required")
    return
  }

  loading = true
  try {
    const endpoint = category
      ? `/api/admin/categories/${category.id}`
      : "/api/admin/categories"
    const method = category ? "PATCH" : "POST"

    const res = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || null,
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      toast.error(data.error ?? "Failed to save category")
      return
    }

    toast.success(category ? "Category updated" : "Category created")
    if (!category) {
      name = ""
      slug = ""
      description = ""
      slugManuallyEdited = false
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
    {category ? "Edit Category" : "Add Category"}
  </h3>

  <div class="space-y-2">
    <Label for="cat-name">Name</Label>
    <Input
      id="cat-name"
      placeholder="Technology"
      bind:value={name}
      oninput={handleNameInput}
    />
  </div>

  <div class="space-y-2">
    <Label for="cat-slug">Slug</Label>
    <Input
      id="cat-slug"
      placeholder="technology"
      bind:value={slug}
      oninput={handleSlugInput}
    />
    <p class="text-xs text-muted-foreground">
      URL-friendly identifier. Auto-generated from name.
    </p>
  </div>

  <div class="space-y-2">
    <Label for="cat-desc">Description (optional)</Label>
    <Input
      id="cat-desc"
      placeholder="Articles about technology"
      bind:value={description}
    />
  </div>

  <div class="flex gap-2">
    <Button type="submit" disabled={loading}>
      {#if loading}
        Saving...
      {:else}
        {category ? "Update" : "Add Category"}
      {/if}
    </Button>
  </div>
</form>
