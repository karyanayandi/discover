<script lang="ts" module>
export type Theme = "light" | "dark" | "system"

export function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "system"
  const stored = localStorage.getItem("theme") as Theme | null
  return stored ?? "system"
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches
  const isDark = theme === "dark" || (theme === "system" && systemDark)

  if (isDark) {
    root.classList.add("dark")
  } else {
    root.classList.remove("dark")
  }
}

export function setTheme(theme: Theme): void {
  localStorage.setItem("theme", theme)
  applyTheme(theme)
}
</script>

<script lang="ts">
import {
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"

let currentTheme = $state<Theme>("system")

$effect(() => {
  currentTheme = getInitialTheme()
  applyTheme(currentTheme)

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
  const handleChange = () => {
    if (currentTheme === "system") {
      applyTheme("system")
    }
  }
  mediaQuery.addEventListener("change", handleChange)
  return () => mediaQuery.removeEventListener("change", handleChange)
})

function handleThemeChange(theme: Theme) {
  currentTheme = theme
  setTheme(theme)
}
</script>

<DropdownMenuSub>
  <DropdownMenuSubTrigger>
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
      class="mr-2"
    >
      {#if currentTheme === "dark"}
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      {:else if currentTheme === "light"}
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="m17.66 17.66 1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m6.34 17.66-1.41 1.41" />
        <path d="m19.07 4.93-1.41 1.41" />
      {:else}
        <path d="M12 8a2.83 2.83 0 0 0 4 4 4 4 0 1 1-4-4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="m17.66 17.66 1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m6.34 17.66-1.41 1.41" />
        <path d="m19.07 4.93-1.41 1.41" />
      {/if}
    </svg>
    Theme
  </DropdownMenuSubTrigger>
  <DropdownMenuSubContent>
    <DropdownMenuRadioGroup
      value={currentTheme}
      onValueChange={(value) => handleThemeChange(value as Theme)}
    >
      <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
      <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
      <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
    </DropdownMenuRadioGroup>
  </DropdownMenuSubContent>
</DropdownMenuSub>
