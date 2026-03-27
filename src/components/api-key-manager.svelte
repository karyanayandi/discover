<script lang="ts">
import { onMount } from "svelte"
import { toast } from "svelte-sonner"
import Button from "@/components/ui/button/button.svelte"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { maskApiKey } from "@/lib/api-keys"
import {
  apiKeysStore,
  apiKeysLoadingStore,
  apiKeysErrorStore,
  selectedApiKeyStore,
  type ApiKey,
} from "@/stores/api-keys"

let { user }: { user: { id: string } } = $props()

let newKeyName = $state("")
let isCreateDialogOpen = $state(false)
let isDeleteDialogOpen = $state(false)
let keyToDelete: ApiKey | null = $state(null)
let renamingKeyId: string | null = $state(null)
let renameValue = $state("")
let newlyCreatedKey: ApiKey | null = $state(null)
let showNewKeyDialog = $state(false)

onMount(() => {
  void fetchApiKeys()
})

async function fetchApiKeys() {
  apiKeysLoadingStore.set(true)
  apiKeysErrorStore.set(null)

  try {
    const response = await fetch("/api/user/api-keys")
    if (!response.ok) {
      throw new Error("Failed to fetch API keys")
    }
    const data = await response.json()
    apiKeysStore.set(data)
  } catch (error) {
    apiKeysErrorStore.set(
      error instanceof Error ? error.message : "Unknown error",
    )
    toast.error("Failed to load API keys")
  } finally {
    apiKeysLoadingStore.set(false)
  }
}

async function createApiKey() {
  try {
    const response = await fetch("/api/user/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newKeyName || undefined }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to create API key")
    }

    const data = await response.json()
    newlyCreatedKey = data
    showNewKeyDialog = true
    isCreateDialogOpen = false
    newKeyName = ""

    await fetchApiKeys()

    selectedApiKeyStore.set(data.id)

    toast.success("API key created successfully")
  } catch (error) {
    toast.error(
      error instanceof Error ? error.message : "Failed to create API key",
    )
  }
}

async function toggleKeyStatus(key: ApiKey) {
  try {
    const response = await fetch(`/api/user/api-keys/${key.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !key.isActive }),
    })

    if (!response.ok) {
      throw new Error("Failed to update API key")
    }

    const updatedKeys = apiKeysStore
      .get()
      .map((k) => (k.id === key.id ? { ...k, isActive: !key.isActive } : k))
    apiKeysStore.set(updatedKeys)

    toast.success(key.isActive ? "API key deactivated" : "API key activated")
  } catch (error) {
    toast.error("Failed to update API key status")
  }
}

async function deleteKey() {
  if (!keyToDelete) return

  try {
    const response = await fetch(`/api/user/api-keys/${keyToDelete.id}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      throw new Error("Failed to delete API key")
    }

    const updatedKeys = apiKeysStore
      .get()
      .filter((k) => k.id !== keyToDelete!.id)
    apiKeysStore.set(updatedKeys)

    if (selectedApiKeyStore.get() === keyToDelete.id) {
      selectedApiKeyStore.set(null)
    }

    toast.success("API key deleted")
  } catch (error) {
    toast.error("Failed to delete API key")
  } finally {
    isDeleteDialogOpen = false
    keyToDelete = null
  }
}

async function renameKey(key: ApiKey) {
  if (!renameValue.trim()) {
    renamingKeyId = null
    return
  }

  try {
    const response = await fetch(`/api/user/api-keys/${key.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: renameValue.trim() }),
    })

    if (!response.ok) {
      throw new Error("Failed to rename API key")
    }

    const data = await response.json()

    const updatedKeys = apiKeysStore
      .get()
      .map((k) => (k.id === key.id ? { ...k, name: data.name } : k))
    apiKeysStore.set(updatedKeys)

    toast.success("API key renamed")
  } catch (error) {
    toast.error("Failed to rename API key")
  } finally {
    renamingKeyId = null
    renameValue = ""
  }
}

function startRename(key: ApiKey) {
  renamingKeyId = key.id
  renameValue = key.name
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text)
  toast.success("Copied to clipboard")
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "Never"
  return new Date(dateString).toLocaleDateString()
}

function selectKey(key: ApiKey) {
  selectedApiKeyStore.set(key.id)
}
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h3 class="text-lg font-semibold">API Keys</h3>
      <p class="text-sm text-muted-foreground">
        Manage your API keys for programmatic access
      </p>
    </div>

    <Dialog bind:open={isCreateDialogOpen}>
      <DialogTrigger>
        <Button>Create API Key</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create API Key</DialogTitle>
          <DialogDescription>
            Create a new API key for programmatic access. The key will only be
            shown once.
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label for="key-name">Name (optional)</Label>
            <Input
              id="key-name"
              placeholder="e.g., Production API Key"
              value={newKeyName}
              oninput={(e) => (newKeyName = e.currentTarget.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onclick={() => (isCreateDialogOpen = false)}
          >
            Cancel
          </Button>
          <Button onclick={createApiKey}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>

  {#if $apiKeysLoadingStore}
    <div class="py-8 text-center text-muted-foreground">Loading...</div>
  {:else if $apiKeysErrorStore}
    <div class="py-8 text-center text-red-500">
      Error: {$apiKeysErrorStore}
    </div>
  {:else if $apiKeysStore.length === 0}
    <div class="py-8 text-center text-muted-foreground">
      No API keys yet. Create your first key to get started.
    </div>
  {:else}
    <div class="space-y-2">
      {#each $apiKeysStore as key (key.id)}
        <div
          class="flex items-center justify-between rounded-lg border border-border bg-card p-4"
          class:ring-2={$selectedApiKeyStore === key.id}
          class:ring-primary={$selectedApiKeyStore === key.id}
        >
          <div class="flex-1 space-y-1">
            {#if renamingKeyId === key.id}
              <div class="flex items-center gap-2">
                <Input
                  value={renameValue}
                  oninput={(e) => (renameValue = e.currentTarget.value)}
                  class="h-8 w-64"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onclick={() => renameKey(key)}
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onclick={() => {
                    renamingKeyId = null
                    renameValue = ""
                  }}
                >
                  Cancel
                </Button>
              </div>
            {:else}
              <div class="flex items-center gap-2">
                <button
                  class="font-medium hover:underline"
                  onclick={() => selectKey(key)}
                >
                  {key.name}
                </button>
                {#if $selectedApiKeyStore === key.id}
                  <span
                    class="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                  >
                    Selected
                  </span>
                {/if}
              </div>
            {/if}

            <div class="text-xs text-muted-foreground">
              Created: {formatDate(key.createdAt)} | Last used: {formatDate(
                key.lastUsedAt,
              )}
            </div>
          </div>

          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <Switch
                checked={key.isActive}
                onCheckedChange={() => toggleKeyStatus(key)}
              />
              <span class="text-xs text-muted-foreground">
                {key.isActive ? "Active" : "Inactive"}
              </span>
            </div>

            <div class="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onclick={() => startRename(key)}
              >
                Rename
              </Button>
              <Button
                size="sm"
                variant="ghost"
                class="text-red-500 hover:text-red-600"
                onclick={() => {
                  keyToDelete = key
                  isDeleteDialogOpen = true
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<Dialog bind:open={showNewKeyDialog}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Your New API Key</DialogTitle>
      <DialogDescription>
        Copy this key now. You won't be able to see it again.
      </DialogDescription>
    </DialogHeader>

    {#if newlyCreatedKey}
      <div class="space-y-4 py-4">
        <div class="space-y-2">
          <Label>Name</Label>
          <div class="font-medium">{newlyCreatedKey.name}</div>
        </div>

        <div class="space-y-2">
          <Label>API Key</Label>
          <div class="flex items-center gap-2">
            <code
              class="flex-1 rounded bg-muted p-2 font-mono text-sm break-all"
            >
              {newlyCreatedKey.key}
            </code>
            <Button
              size="sm"
              variant="outline"
              onclick={() => copyToClipboard(newlyCreatedKey?.key ?? "")}
            >
              Copy
            </Button>
          </div>
        </div>
      </div>
    {/if}

    <DialogFooter>
      <Button onclick={() => (showNewKeyDialog = false)}>Done</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

<Dialog bind:open={isDeleteDialogOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Delete API Key</DialogTitle>
      <DialogDescription>
        Are you sure you want to delete "{keyToDelete?.name}"? This action
        cannot be undone.
      </DialogDescription>
    </DialogHeader>

    <DialogFooter>
      <Button
        variant="outline"
        onclick={() => {
          isDeleteDialogOpen = false
          keyToDelete = null
        }}
      >
        Cancel
      </Button>
      <Button variant="destructive" onclick={deleteKey}>Delete</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
