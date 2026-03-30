<script lang="ts" module>
export interface CategoryItem {
  slug: string
  name: string
  color: string | null
}
</script>

<script lang="ts">
  import Button from "@/components/ui/button/button.svelte"
  import { selectedCategoryStore } from "@/stores/selected-category"

  let { categories, showExploreLink = false }: { categories: CategoryItem[]; showExploreLink?: boolean } = $props()

  let activeSlug = $state(selectedCategoryStore.get())

  $effect(() => {
    return selectedCategoryStore.subscribe((value) => {
      activeSlug = value
    })
  })
</script>

<nav class="space-y-1">
  <a href="/">
    <Button
      variant={activeSlug === "" ? "secondary" : "ghost"}
      class="w-full justify-start text-sm"
    >
      All Topics
    </Button>
  </a>

  {#each categories as cat}
    <a href={`/category/${cat.slug}`}>
      <Button
        variant={activeSlug === cat.slug ? "secondary" : "ghost"}
        class="w-full justify-start text-sm"
      >
        {#if cat.color}
          <span
            class="mr-2 inline-block h-2 w-2 rounded-full"
            style:background-color={cat.color}
          ></span>
        {/if}
        {cat.name}
      </Button>
    </a>
  {/each}

  {#if showExploreLink}
    <a
      href="/categories"
      class="mt-2 inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      View all categories →
    </a>
  {/if}
</nav>
