<script lang="ts">
import { Skeleton } from "@/components/ui/skeleton"
</script>

<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
  {#each Array(10) as _}
    <div class="space-y-3">
      <Skeleton class="aspect-square" />
      <div class="space-y-2">
        <Skeleton class="h-4 w-3/4" />
        <div class="flex gap-2">
          <Skeleton class="h-4 w-16" />
          <Skeleton class="h-4 w-12" />
        </div>
      </div>
    </div>
  {/each}
</div>
