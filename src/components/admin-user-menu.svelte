<script lang="ts">
import { Image } from "@unpic/svelte"
import { authClient } from "@/lib/auth/client"
import { userStore } from "@/stores/user"
import ThemeToggle from "@/components/ui/theme-toggle.svelte"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

let user = $state(userStore.get())

$effect(() => {
  return userStore.subscribe((u) => {
    user = u
  })
})

async function handleSignOut() {
  await authClient.signOut()
  window.location.href = "/"
}
</script>

{#if user}
  <DropdownMenu>
    <DropdownMenuTrigger>
      {#if user.image}
        <Image
          src={user.image}
          alt={user.name ?? "User"}
          layout="fixed"
          width={32}
          height={32}
          class="size-8 rounded-full"
          referrerpolicy="no-referrer"
        />
      {:else}
        <div
          class="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground"
        >
          {(user.name ?? user.email).charAt(0).toUpperCase()}
        </div>
      {/if}
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-56">
      <DropdownMenuLabel>
        <div class="flex flex-col gap-0.5">
          <span class="text-sm font-medium">{user.name ?? "User"}</span>
          <span class="text-xs text-muted-foreground">{user.email}</span>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem>
        <a href="/" class="flex w-full items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to site
        </a>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <ThemeToggle />
      <DropdownMenuSeparator />
      <DropdownMenuItem onclick={handleSignOut}>
        Sign out
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
{/if}
