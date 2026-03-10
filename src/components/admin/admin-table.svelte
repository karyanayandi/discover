<script lang="ts" module>
export interface ColumnDef<T = Record<string, unknown>> {
  key: string
  label: string
  sortable?: boolean
  render?: (row: T) => string
}

export interface AdminTableAction<T = Record<string, unknown>> {
  label: string
  variant?: "default" | "destructive"
  onClick: (row: T) => void
}
</script>

<script lang="ts">
  import Button from "@/components/ui/button/button.svelte"
  import * as Table from "@/components/ui/table"

  type T = Record<string, unknown>

  let {
    columns,
    rows = [],
    actions = [],
    emptyMessage = "No items found.",
  }: {
    columns: ColumnDef<T>[]
    rows: T[]
    actions?: AdminTableAction<T>[]
    emptyMessage?: string
  } = $props()

  let sortKey = $state("")
  let sortDir = $state<"asc" | "desc">("asc")

  function handleSort(key: string) {
    if (sortKey === key) {
      sortDir = sortDir === "asc" ? "desc" : "asc"
    } else {
      sortKey = key
      sortDir = "asc"
    }
  }

  const sortedRows = $derived(() => {
    if (!sortKey) return rows
    return [...rows].sort((a, b) => {
      const aVal = String(a[sortKey] ?? "")
      const bVal = String(b[sortKey] ?? "")
      const cmp = aVal.localeCompare(bVal)
      return sortDir === "asc" ? cmp : -cmp
    })
  })
</script>

<div class="rounded-xl border border-border">
  <Table.Root>
    <Table.Header>
      <Table.Row>
        {#each columns as col}
          <Table.Head>
            {#if col.sortable}
              <button
                type="button"
                class="inline-flex items-center gap-1 font-medium hover:text-foreground"
                onclick={() => handleSort(col.key)}
              >
                {col.label}
                {#if sortKey === col.key}
                  <span class="text-xs">
                    {sortDir === "asc" ? "↑" : "↓"}
                  </span>
                {/if}
              </button>
            {:else}
              {col.label}
            {/if}
          </Table.Head>
        {/each}
        {#if actions.length > 0}
          <Table.Head class="w-25 text-right">Actions</Table.Head>
        {/if}
      </Table.Row>
    </Table.Header>
    <Table.Body>
      {#if sortedRows().length === 0}
        <Table.Row>
          <Table.Cell
            colspan={columns.length + (actions.length > 0 ? 1 : 0)}
            class="py-8 text-center text-muted-foreground"
          >
            {emptyMessage}
          </Table.Cell>
        </Table.Row>
      {:else}
        {#each sortedRows() as row}
          <Table.Row>
            {#each columns as col}
              <Table.Cell>
                {#if col.render}
                  {col.render(row)}
                {:else}
                  {String(row[col.key] ?? "")}
                {/if}
              </Table.Cell>
            {/each}
            {#if actions.length > 0}
              <Table.Cell class="text-right">
                <div class="flex items-center justify-end gap-1">
                  {#each actions as action}
                    <Button
                      variant={action.variant === "destructive"
                        ? "destructive"
                        : "ghost"}
                      size="sm"
                      onclick={() => action.onClick(row)}
                    >
                      {action.label}
                    </Button>
                  {/each}
                </div>
              </Table.Cell>
            {/if}
          </Table.Row>
        {/each}
      {/if}
    </Table.Body>
  </Table.Root>
</div>
