<script lang="ts" module>
export interface ArticleCardData {
  slug: string
  title: string
  summary: string
  thumbnailUrl: string | null
  sourceCount: number
  readingTimeMinutes: number
  publishedAt: string | Date | null
  categories?: { slug: string; name: string }[]
}
</script>

<script lang="ts">
  import Badge from "@/components/ui/badge/badge.svelte"
  import { isSaved, savedSlugsStore } from "@/stores/saved-articles"
  import { userStore } from "@/stores/user"

  let {
    article,
    href,
  }: {
    article: ArticleCardData
    href?: string
  } = $props()

  let user = $state(userStore.get())
  let articleSaved = $state(isSaved(article.slug))

  $effect(() => {
    return userStore.subscribe((u) => {
      user = u
    })
  })

  $effect(() => {
    return savedSlugsStore.subscribe((set) => {
      articleSaved = set.has(article.slug)
    })
  })

  const timeAgo = $derived(() => {
    if (!article.publishedAt) return ""
    const diff = Date.now() - new Date(article.publishedAt).getTime()
    const hours = Math.floor(diff / 3_600_000)
    if (hours < 1) return "Just now"
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    return new Date(article.publishedAt).toLocaleDateString()
  })

  const link = $derived(href ?? `/article/${article.slug}`)
</script>

<a
  class="group relative block rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30 hover:bg-accent/50"
  href={link}
>
  {#if user && articleSaved}
    <div
      class="absolute right-3 top-3 text-primary"
      title="Saved to library"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        class="h-4 w-4"
      >
        <path
          fill-rule="evenodd"
          d="M6.32 2.577a49.255 49.255 0 0 1 11.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 0 1-1.085.67L12 18.089l-7.165 3.583A.75.75 0 0 1 3.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93Z"
          clip-rule="evenodd"
        />
      </svg>
    </div>
  {/if}
  <div class="flex gap-4">
    {#if article.thumbnailUrl}
      <div class="hidden shrink-0 sm:block">
        <img
          src={article.thumbnailUrl}
          alt=""
          class="h-24 w-36 rounded-lg object-cover"
          loading="lazy"
        />
      </div>
    {/if}

    <div class="min-w-0 flex-1">
      <h3
        class="line-clamp-2 text-base font-semibold leading-snug text-foreground group-hover:text-primary"
      >
        {article.title}
      </h3>

      <p class="mt-1 line-clamp-2 text-sm text-muted-foreground">
        {article.summary}
      </p>

      <div class="mt-3 flex flex-wrap items-center gap-2">
        {#if article.categories?.length}
          {#each article.categories.slice(0, 3) as cat}
            <Badge variant="secondary" class="text-xs">
              {cat.name}
            </Badge>
          {/each}
        {/if}

        <span class="text-xs text-muted-foreground">
          {article.sourceCount} sources
        </span>

        <span class="text-xs text-muted-foreground">
          {article.readingTimeMinutes} min read
        </span>

        {#if article.publishedAt}
          <span class="text-xs text-muted-foreground">
            {timeAgo()}
          </span>
        {/if}
      </div>
    </div>
  </div>
</a>
