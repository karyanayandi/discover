<script lang="ts">
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface SchedulerStatus {
  enabled: boolean
  cronPattern: string
  running: boolean
  nextRunAt: string | null
  lastRunAt: string | null
  lastRunResult: "success" | "error" | null
  lastRunError: string | null
}

const CRON_PRESETS: { label: string; value: string }[] = [
  { label: "Every hour", value: "0 * * * *" },
  { label: "Every 6 hours", value: "0 */6 * * *" },
  { label: "Every 12 hours", value: "0 */12 * * *" },
  { label: "Daily at midnight", value: "0 0 * * *" },
  { label: "Daily at 6 AM", value: "0 6 * * *" },
  { label: "Every 30 min", value: "*/30 * * * *" },
]

let status: SchedulerStatus | null = $state(null)
let loading = $state(true)
let saving = $state(false)
let cronInput = $state("0 * * * *")
let error = $state<string | null>(null)

async function fetchStatus() {
  loading = true
  error = null
  const res = await fetch("/api/internal/pipeline/scheduler")
  if (!res.ok) {
    error = "Failed to load scheduler status"
    loading = false
    return
  }
  status = (await res.json()) as SchedulerStatus
  cronInput = status.cronPattern
  loading = false
}

async function sendAction(action: string, cronPattern?: string) {
  saving = true
  error = null
  const res = await fetch("/api/internal/pipeline/scheduler-control", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, cronPattern }),
  })
  const data = (await res.json()) as {
    success?: boolean
    status?: SchedulerStatus
    error?: string
  }
  if (!res.ok) {
    error = data.error ?? "Request failed"
    saving = false
    return
  }
  if (data.status) {
    status = data.status
    cronInput = data.status.cronPattern
  }
  saving = false
}

function handleToggle() {
  if (status?.enabled) {
    void sendAction("disable")
  } else {
    void sendAction("enable", cronInput)
  }
}

function handleUpdateSchedule() {
  if (!cronInput.trim()) return
  void sendAction("update_schedule", cronInput)
}

function formatTime(iso: string | null): string {
  if (!iso) return "Never"
  return new Date(iso).toLocaleString()
}

$effect(() => {
  void fetchStatus()
})
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between">
    <div>
      <h4 class="text-sm font-semibold">Automatic Fetching</h4>
      <p class="text-xs text-muted-foreground">
        Periodically run the pipeline to fetch new articles.
      </p>
    </div>
    {#if !loading}
      <Button
        variant={status?.enabled ? "destructive" : "default"}
        size="sm"
        disabled={saving}
        onclick={handleToggle}
      >
        {#if saving}
          Saving...
        {:else if status?.enabled}
          Disable
        {:else}
          Enable
        {/if}
      </Button>
    {/if}
  </div>

  {#if loading}
    <div
      class="flex items-center gap-2 text-sm text-muted-foreground"
    >
      <svg
        class="h-4 w-4 animate-spin"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        ></circle>
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        ></path>
      </svg>
      Loading scheduler status...
    </div>
  {:else if error}
    <div
      class="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
    >
      {error}
    </div>
  {:else if status}
    <div class="space-y-3">
      <div class="space-y-2">
        <Label for="cron-pattern">Cron Schedule</Label>
        <div class="flex items-end gap-3">
          <div class="flex-1">
            <Input
              id="cron-pattern"
              type="text"
              bind:value={cronInput}
              placeholder="0 * * * *"
              class="font-mono text-sm"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={saving ||
              cronInput === status.cronPattern}
            onclick={handleUpdateSchedule}
          >
            Update
          </Button>
        </div>
        <div class="flex flex-wrap gap-1.5">
          {#each CRON_PRESETS as preset}
            <button
              type="button"
              class="rounded-md border px-2 py-0.5 text-xs transition-colors
                {cronInput === preset.value
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'}"
              onclick={() => (cronInput = preset.value)}
            >
              {preset.label}
            </button>
          {/each}
        </div>
      </div>

      <div
        class="rounded-lg border border-border bg-muted/50 p-3 text-xs"
      >
        <div class="grid grid-cols-2 gap-y-1.5">
          <span class="text-muted-foreground">Status</span>
          <span class="font-medium">
            {#if status.running}
              <span class="text-amber-500">Running...</span>
            {:else if status.enabled}
              <span class="text-emerald-500">Active</span>
            {:else}
              <span class="text-muted-foreground">Disabled</span>
            {/if}
          </span>

          <span class="text-muted-foreground">Schedule</span>
          <span class="font-medium font-mono">
            {status.cronPattern}
          </span>

          <span class="text-muted-foreground">Next Run</span>
          <span class="font-medium">
            {formatTime(status.nextRunAt)}
          </span>

          <span class="text-muted-foreground">Last Run</span>
          <span class="font-medium">
            {formatTime(status.lastRunAt)}
          </span>

          {#if status.lastRunResult}
            <span class="text-muted-foreground">Last Result</span>
            <span class="font-medium">
              {#if status.lastRunResult === "success"}
                <span class="text-emerald-500">Success</span>
              {:else}
                <span class="text-destructive">Error</span>
              {/if}
            </span>
          {/if}

          {#if status.lastRunError}
            <span class="text-muted-foreground">Error</span>
            <span class="font-medium text-destructive">
              {status.lastRunError}
            </span>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>
