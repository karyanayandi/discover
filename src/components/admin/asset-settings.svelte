<script lang="ts">
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "svelte-sonner"

let maxUploadSizeMB = $state(50)
let loading = $state(true)
let saving = $state(false)

async function fetchSettings() {
  loading = true
  const res = await fetch("/api/admin/asset-settings")
  if (res.ok) {
    const data = await res.json()
    maxUploadSizeMB = data.maxUploadSizeMB
  }
  loading = false
}

async function handleSave() {
  if (maxUploadSizeMB < 1 || maxUploadSizeMB > 500) {
    toast.error("Max upload size must be between 1 and 500 MB")
    return
  }

  saving = true
  const res = await fetch("/api/admin/asset-settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ maxUploadSizeMB }),
  })

  if (res.ok) {
    toast.success("Settings saved")
  } else {
    toast.error("Failed to save settings")
  }
  saving = false
}

$effect(() => {
  void fetchSettings()
})
</script>

<div class="space-y-4">
  <div>
    <h4 class="text-sm font-semibold">Asset Upload Settings</h4>
    <p class="text-xs text-muted-foreground">
      Configure maximum file size for asset uploads.
    </p>
  </div>

  {#if loading}
    <div class="text-sm text-muted-foreground">Loading...</div>
  {:else}
    <div class="space-y-3">
      <div class="space-y-2">
        <Label for="max-upload-size">Max Upload Size (MB)</Label>
        <div class="flex items-end gap-3">
          <div class="flex-1">
            <Input
              id="max-upload-size"
              type="number"
              bind:value={maxUploadSizeMB}
              min={1}
              max={500}
              class="font-mono text-sm"
            />
          </div>
          <Button
            variant="default"
            size="sm"
            disabled={saving}
            onclick={handleSave}
          >
            {#if saving}
              Saving...
            {:else}
              Save
            {/if}
          </Button>
        </div>
        <p class="text-xs text-muted-foreground">
          Maximum: 500 MB. Set to a lower value to prevent users from uploading large files.
        </p>
      </div>
    </div>
  {/if}
</div>
