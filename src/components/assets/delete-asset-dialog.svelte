<script lang="ts">
import { AlertTriangle } from "@lucide/svelte"
import * as Dialog from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { Asset } from "@/types/asset"

let {
  open = $bindable(false),
  asset,
  onConfirm,
}: {
  open?: boolean
  asset: Asset | null
  onConfirm: () => void
} = $props()
</script>

<Dialog.Root bind:open>
  <Dialog.Portal>
    <Dialog.Overlay />
    <Dialog.Content class="sm:max-w-md">
      <Dialog.Header>
        <div class="flex items-center gap-3">
          <AlertTriangle class="text-destructive size-6" />
          <Dialog.Title>Delete Asset</Dialog.Title>
        </div>
        <Dialog.Description class="pt-2">
          Are you sure you want to delete "{asset?.originalName}"? This action cannot be undone.
        </Dialog.Description>
      </Dialog.Header>
      <Dialog.Footer>
        <Button variant="outline" onclick={() => (open = false)}>Cancel</Button>
        <Button variant="destructive" onclick={onConfirm}>Delete</Button>
      </Dialog.Footer>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
