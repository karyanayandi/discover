<script lang="ts">
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface PlatformApiKey {
  id: string
  provider: string
  name: string
  keyHash: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  lastUsedAt: string | null
}

let keys = $state<PlatformApiKey[]>([])
let loading = $state(true)
let isCreateDialogOpen = $state(false)
let isDeleteDialogOpen = $state(false)
let isEditDialogOpen = $state(false)
let keyToDelete: PlatformApiKey | null = $state(null)
let keyToEdit: PlatformApiKey | null = $state(null)

let newProvider = $state("")
let newName = $state("")
let newKeyValue = $state("")
let editName = $state("")
let editKeyValue = $state("")

const providers = ["openai", "openrouter", "anthropic", "google", "cohere"]

$effect(() => {
  void fetchKeys()
})

async function fetchKeys() {
  loading = true
  try {
    const response = await fetch("/api/admin/platform-api-keys")
    if (!response.ok) throw new Error("Failed to fetch keys")
    keys = await response.json()
  } catch {
    toast.error("Failed to load API keys")
  } finally {
    loading = false
  }
}

async function createKey() {
  if (!newProvider || !newName || !newKeyValue) {
    toast.error("All fields are required")
    return
  }

  try {
    const response = await fetch("/api/admin/platform-api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: newProvider,
        name: newName,
        keyValue: newKeyValue,
      }),
    })

    if (!response.ok) throw new Error("Failed to create key")

    toast.success("API key created")
    isCreateDialogOpen = false
    newProvider = ""
    newName = ""
    newKeyValue = ""
    await fetchKeys()
  } catch {
    toast.error("Failed to create API key")
  }
}

async function updateKey() {
  if (!keyToEdit) return

  const updates: { name?: string; keyValue?: string } = {}
  if (editName && editName !== keyToEdit.name) updates.name = editName
  if (editKeyValue) updates.keyValue = editKeyValue

  if (Object.keys(updates).length === 0) {
    isEditDialogOpen = false
    return
  }

  try {
    const response = await fetch(
      `/api/admin/platform-api-keys/${keyToEdit.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      },
    )

    if (!response.ok) throw new Error("Failed to update key")

    toast.success("API key updated")
    isEditDialogOpen = false
    keyToEdit = null
    editName = ""
    editKeyValue = ""
    await fetchKeys()
  } catch {
    toast.error("Failed to update API key")
  }
}

async function toggleKeyStatus(key: PlatformApiKey) {
  try {
    const response = await fetch(`/api/admin/platform-api-keys/${key.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !key.isActive }),
    })

    if (!response.ok) throw new Error("Failed to update key")

    key.isActive = !key.isActive
    toast.success(key.isActive ? "Key activated" : "Key deactivated")
  } catch {
    toast.error("Failed to update key status")
  }
}

async function deleteKey() {
  if (!keyToDelete) return

  try {
    const response = await fetch(
      `/api/admin/platform-api-keys/${keyToDelete.id}`,
      { method: "DELETE" },
    )

    if (!response.ok) throw new Error("Failed to delete key")

    toast.success("API key deleted")
    isDeleteDialogOpen = false
    keyToDelete = null
    await fetchKeys()
  } catch {
    toast.error("Failed to delete API key")
  }
}

function openEditDialog(key: PlatformApiKey) {
  keyToEdit = key
  editName = key.name
  editKeyValue = ""
  isEditDialogOpen = true
}

function maskKey(key: string): string {
  if (key.length < 10) return "***"
  return `${key.slice(0, 6)}...${key.slice(-4)}`
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "Never"
  return new Date(dateString).toLocaleDateString()
}
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between">
    <div>
      <h3 class="text-lg font-semibold">Platform API Keys</h3>
      <p class="text-sm text-muted-foreground">
        Manage service API keys for AI providers and integrations
      </p>
    </div>

    <Dialog bind:open={isCreateDialogOpen}>
      <DialogTrigger>
        <Button>Add API Key</Button>
      </DialogTrigger>
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add API Key</DialogTitle>
          <DialogDescription>
            Add a new API key for a service provider
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label for="provider">Provider</Label>
            <Input
              id="provider"
              list="providers"
              placeholder="e.g., openai, openrouter"
              bind:value={newProvider}
            />
            <datalist id="providers">
              {#each providers as provider}
                <option value={provider}></option>
              {/each}
            </datalist>
          </div>

          <div class="space-y-2">
            <Label for="name">Name</Label>
            <Input
              id="name"
              placeholder="e.g., Production OpenAI Key"
              bind:value={newName}
            />
          </div>

          <div class="space-y-2">
            <Label for="key-value">API Key</Label>
            <Input
              id="key-value"
              type="password"
              placeholder="sk-..."
              bind:value={newKeyValue}
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
          <Button onclick={createKey}>Add Key</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>

  {#if loading}
    <div class="py-8 text-center text-muted-foreground">Loading...</div>
  {:else if keys.length === 0}
    <div class="py-8 text-center text-muted-foreground">
      No API keys configured. Add your first key to get started.
    </div>
  {:else}
    <div class="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Provider</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Key</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Used</TableHead>
            <TableHead class="w-32">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {#each keys as key (key.id)}
            <TableRow>
              <TableCell>
                <Badge variant="secondary">{key.provider}</Badge>
              </TableCell>
              <TableCell class="font-medium">{key.name}</TableCell>
              <TableCell>
                <code class="rounded bg-muted px-1.5 py-0.5 text-xs">
                  {maskKey(key.keyHash)}
                </code>
              </TableCell>
              <TableCell>
                <div class="flex items-center gap-2">
                  <Switch
                    checked={key.isActive}
                    onCheckedChange={() => toggleKeyStatus(key)}
                  />
                  <span class="text-xs text-muted-foreground">
                    {key.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </TableCell>
              <TableCell class="text-sm text-muted-foreground">
                {formatDate(key.lastUsedAt)}
              </TableCell>
              <TableCell>
                <div class="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onclick={() => openEditDialog(key)}
                  >
                    Edit
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
              </TableCell>
            </TableRow>
          {/each}
        </TableBody>
      </Table>
    </div>
  {/if}
</div>

<Dialog bind:open={isEditDialogOpen}>
  <DialogContent class="sm:max-w-md">
    <DialogHeader>
      <DialogTitle>Edit API Key</DialogTitle>
      <DialogDescription>
        Update the name or API key value
      </DialogDescription>
    </DialogHeader>

    {#if keyToEdit}
      <div class="space-y-4 py-4">
        <div class="space-y-2">
          <Label>Provider</Label>
          <div class="text-sm text-muted-foreground">{keyToEdit.provider}</div>
        </div>

        <div class="space-y-2">
          <Label for="edit-name">Name</Label>
          <Input id="edit-name" bind:value={editName} />
        </div>

        <div class="space-y-2">
          <Label for="edit-key">API Key (leave blank to keep current)</Label>
          <Input
            id="edit-key"
            type="password"
            placeholder="Enter new key to update..."
            bind:value={editKeyValue}
          />
        </div>
      </div>
    {/if}

    <DialogFooter>
      <Button variant="outline" onclick={() => (isEditDialogOpen = false)}>
        Cancel
      </Button>
      <Button onclick={updateKey}>Save Changes</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

<Dialog bind:open={isDeleteDialogOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Delete API Key</DialogTitle>
      <DialogDescription>
        Are you sure you want to delete "{keyToDelete?.name}"? This action cannot
        be undone.
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
