<script lang="ts">
import * as Card from "@/components/ui/card"
import { formatFileSize } from "@/lib/utils/assets"

let {
  filename,
  size,
  progress,
}: {
  filename: string
  size: number
  progress: number
} = $props()

const progressWidth = $derived(`${progress}%`)
</script>

<Card.Root>
  <Card.Content class="space-y-3 p-4">
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0 flex-1">
        <p class="truncate font-medium">{filename}</p>
        <p class="text-muted-foreground text-sm">{formatFileSize(size)}</p>
      </div>
      <span class="text-sm font-medium">{progress}%</span>
    </div>
    <div class="bg-muted h-2 w-full overflow-hidden rounded-full">
      <div
        class="bg-primary h-full transition-all duration-300"
        style="width: {progressWidth}"
      ></div>
    </div>
  </Card.Content>
</Card.Root>
