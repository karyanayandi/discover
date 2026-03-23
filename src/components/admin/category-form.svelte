<script lang="ts">
import Button from "@/components/ui/button/button.svelte"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "svelte-sonner"
import { createForm } from "@tanstack/svelte-form"
import { z } from "zod"

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

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string(),
})

interface CategoryFormData {
  name: string
  slug: string
  description: string
}

const form = createForm(() => ({
  defaultValues: {
    name: category?.name ?? "",
    slug: category?.slug ?? "",
    description: category?.description ?? "",
  } as CategoryFormData,
  validators: {
    onChange: categorySchema,
  },
  onSubmit: async ({ value }: { value: CategoryFormData }) => {
    const endpoint = category
      ? `/api/admin/categories/${category.id}`
      : "/api/admin/categories"
    const method = category ? "PATCH" : "POST"

    const res = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: value.name.trim(),
        slug: value.slug.trim(),
        description: value.description.trim() || null,
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      toast.error(data.error ?? "Failed to save category")
      return
    }

    toast.success(category ? "Category updated" : "Category created")
    if (!category) {
      form.reset()
      isManualSlug = false
    }
    onSuccess?.()
  },
}))

let isManualSlug = $state(false)

$effect.pre(() => {
  isManualSlug = category !== null
})

function generateSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

$effect(() => {
  if (category) {
    form.setFieldValue("name", category.name)
    form.setFieldValue("slug", category.slug)
    form.setFieldValue("description", category.description ?? "")
    isManualSlug = true
  }
})

$effect(() => {
  const name = form.getFieldValue("name")
  if (!isManualSlug && name) {
    form.setFieldValue("slug", generateSlug(name))
  }
})

function handleSlugInput() {
  isManualSlug = true
}
</script>

<form
  onsubmit={(e) => {
    e.preventDefault()
    form.handleSubmit()
  }}
  class="space-y-4 rounded-xl border border-border bg-card p-6"
>
  <h3 class="font-semibold">
    {category ? "Edit Category" : "Add Category"}
  </h3>

  <form.Field name="name">
    {#snippet children(field)}
      <div class="space-y-2">
        <Label for="cat-name">Name</Label>
        <Input
          id="cat-name"
          name="name"
          placeholder="Technology"
          value={field.state.value as string}
          oninput={(e) => field.handleChange(e.currentTarget.value)}
          onblur={field.handleBlur}
        />
        {#if field.state.meta.errors.length > 0}
          <span class="text-sm text-red-500">{field.state.meta.errors[0]}</span>
        {/if}
      </div>
    {/snippet}
  </form.Field>

  <form.Field name="slug">
    {#snippet children(field)}
      <div class="space-y-2">
        <Label for="cat-slug">Slug</Label>
        <Input
          id="cat-slug"
          name="slug"
          placeholder="technology"
          value={field.state.value as string}
          oninput={(e) => {
            handleSlugInput()
            field.handleChange(e.currentTarget.value)
          }}
          onblur={field.handleBlur}
        />
        {#if field.state.meta.errors.length > 0}
          <span class="text-sm text-red-500">{field.state.meta.errors[0]}</span>
        {/if}
        <p class="text-xs text-muted-foreground">
          URL-friendly identifier. Auto-generated from name.
        </p>
      </div>
    {/snippet}
  </form.Field>

  <form.Field name="description">
    {#snippet children(field)}
      <div class="space-y-2">
        <Label for="cat-desc">Description (optional)</Label>
        <Input
          id="cat-desc"
          name="description"
          placeholder="Articles about technology"
          value={field.state.value as string}
          oninput={(e) => field.handleChange(e.currentTarget.value)}
          onblur={field.handleBlur}
        />
        {#if field.state.meta.errors.length > 0}
          <span class="text-sm text-red-500">{field.state.meta.errors[0]}</span>
        {/if}
      </div>
    {/snippet}
  </form.Field>

  <div class="flex gap-2">
    <Button type="submit" disabled={form.state.isSubmitting}>
      {#if form.state.isSubmitting}
        Saving...
      {:else}
        {category ? "Update" : "Add Category"}
      {/if}
    </Button>
  </div>
</form>
