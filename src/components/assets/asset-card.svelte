<script lang="ts">
import { Image as ImageIcon } from "@lucide/svelte"
import { Trash2 } from "@lucide/svelte"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import * as Card from "@/components/ui/card"
import { formatFileSize } from "@/lib/utils/assets"
import type { Asset } from "@/types/asset"

let {
  asset,
  onPreview,
  onDelete,
}: {
  asset: Asset
  onPreview: (asset: Asset) => void
  onDelete: (asset: Asset) => void
} = $props()

const isImage = $derived(asset.type === "images")

function formatDate(date: Date | null): string {
  if (!date) return "Unknown"
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}
</script>

<div
  class="group cursor-pointer overflow-hidden"
  onclick={() => onPreview(asset)}
  onkeydown={(e) => e.key === 'Enter' && onPreview(asset)}
  role="button"
  tabindex="0"
>
  <Card.Root class="overflow-hidden">
    <Card.Content class="relative aspect-square p-0">
      {#if isImage}
        <img
          src={asset.url}
          alt={asset.originalName}
          class="absolute inset-0 size-full object-cover"
          loading="lazy"
        />
      {:else}
        <div class="bg-muted flex size-full items-center justify-center">
          <ImageIcon class="text-muted-foreground size-12" />
        </div>
      {/if}
      <div
        class="absolute inset-0 flex items-start justify-end gap-1 bg-gradient-to-b from-black/50 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100"
      >
        <Button
          variant="destructive"
          size="icon"
          class="size-8"
          onclick={(e) => {
            e.stopPropagation()
            onDelete(asset)
          }}
        >
          <Trash2 class="size-4" />
        </Button>
      </div>
    </Card.Content>
    <Card.Header class="p-3">
      <p class="truncate text-sm font-medium">{asset.originalName}</p>
      <div class="flex items-center gap-2">
        <Badge variant="secondary" class="text-xs">{asset.type}</Badge>
        <span class="text-muted-foreground text-xs">{formatFileSize(asset.size)}</span>
      </div>
      <p class="text-muted-foreground text-xs">{formatDate(asset.createdAt)}</p>
    </Card.Header>
  </Card.Root>
</div>
