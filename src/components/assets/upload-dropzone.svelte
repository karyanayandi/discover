<script lang="ts">
import { Upload } from "@lucide/svelte"
import * as Card from "@/components/ui/card"
import { toast } from "svelte-sonner"

let {
  onUpload,
  maxSizeMB,
}: {
  onUpload: (file: File) => void
  maxSizeMB: number
} = $props()

let isDragging = $state(false)
let fileInput: HTMLInputElement | null = $state(null)

function handleDragOver(e: DragEvent) {
  e.preventDefault()
  isDragging = true
}

function handleDragLeave(e: DragEvent) {
  e.preventDefault()
  isDragging = false
}

function handleDrop(e: DragEvent) {
  e.preventDefault()
  isDragging = false
  const files = Array.from(e.dataTransfer?.files ?? [])
  files.forEach((file) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File size exceeds ${maxSizeMB}MB limit`)
      return
    }
    onUpload(file)
  })
}

function handleFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  files.forEach((file) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File size exceeds ${maxSizeMB}MB limit`)
      return
    }
    onUpload(file)
  })
  input.value = ""
}
</script>

<Card.Root
  class="cursor-pointer border-2 border-dashed transition-colors {isDragging
    ? 'border-primary bg-primary/5'
    : 'border-muted hover:border-muted-foreground/25'}"
  ondragover={handleDragOver}
  ondragleave={handleDragLeave}
  ondrop={handleDrop}
  onclick={() => fileInput?.click()}
>
  <Card.Content class="flex flex-col items-center justify-center gap-4 py-12">
    <Upload class="text-muted-foreground size-12" />
    <div class="text-center">
      <p class="font-medium">Click to upload or drag and drop</p>
      <p class="text-muted-foreground text-sm">You can also paste files from clipboard</p>
    </div>
    <input
      bind:this={fileInput}
      type="file"
      multiple
      class="hidden"
      onchange={handleFileSelect}
    />
  </Card.Content>
</Card.Root>
