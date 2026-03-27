<script lang="ts">
import { Button } from "@/components/ui/button"
import type { AssetType } from "@/types/asset"

let {
  selectedType,
  onTypeChange,
}: {
  selectedType: AssetType | null
  onTypeChange: (type: AssetType | null) => void
} = $props()

const assetTypes: { value: AssetType; label: string }[] = [
  { value: "images", label: "Images" },
  { value: "videos", label: "Videos" },
  { value: "documents", label: "Documents" },
  { value: "archives", label: "Archives" },
  { value: "others", label: "Others" },
]
</script>

<div class="flex flex-wrap gap-2">
  <Button
    variant={selectedType === null ? "default" : "outline"}
    size="sm"
    onclick={() => onTypeChange(null)}
  >
    All
  </Button>
  {#each assetTypes as type}
    <Button
      variant={selectedType === type.value ? "default" : "outline"}
      size="sm"
      onclick={() => onTypeChange(type.value)}
    >
      {type.label}
    </Button>
  {/each}
</div>
