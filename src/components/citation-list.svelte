<script lang="ts" module>
export interface Citation {
  url: string
  title: string
  domain: string
  description: string | null
}
</script>

<script lang="ts">
  import Separator from "@/components/ui/separator/separator.svelte"

  let {
    citations,
  }: {
    citations: Citation[]
  } = $props()
</script>

{#if citations.length > 0}
  <div class="space-y-3">
    <h3 class="text-sm font-semibold text-foreground">
      Sources ({citations.length})
    </h3>
    <Separator />
    <ol class="space-y-2">
      {#each citations as citation, i}
        <li class="flex items-start gap-2">
          <span
            class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-medium text-primary"
          >
            {i + 1}
          </span>
          <div class="min-w-0 flex-1">
            <a
              href={citation.url}
              target="_blank"
              rel="noopener noreferrer"
              class="text-sm font-medium text-foreground hover:text-primary"
            >
              {citation.title}
            </a>
            <p class="text-xs text-muted-foreground">{citation.domain}</p>
          </div>
        </li>
      {/each}
    </ol>
  </div>
{/if}
