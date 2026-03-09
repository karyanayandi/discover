<script lang="ts">
import type { ArticleCardData } from "./article-card.svelte"
import ArticleCard from "./article-card.svelte"

let {
  articles,
}: {
  articles: ArticleCardData[]
} = $props()
</script>

{#if articles.length > 0}
  <div class="space-y-3">
    <h3 class="text-sm font-semibold text-foreground">Related Insights</h3>
    <div class="space-y-3">
      {#each articles as article (article.slug)}
        <ArticleCard {article} />
      {/each}
    </div>
  </div>
{/if}
