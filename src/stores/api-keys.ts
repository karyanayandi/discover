import { atom, onMount } from "nanostores"

export interface ApiKey {
  id: string
  name: string
  key?: string
  isActive: boolean
  createdAt: string
  lastUsedAt: string | null
}

// Store for the list of API keys
export const apiKeysStore = atom<ApiKey[]>([])

// Store for the currently selected/active key (persisted in localStorage)
export const selectedApiKeyStore = atom<string | null>(null)

// Store for loading state
export const apiKeysLoadingStore = atom<boolean>(false)

// Store for error state
export const apiKeysErrorStore = atom<string | null>(null)

// Load selected key from localStorage on mount
onMount(selectedApiKeyStore, () => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("selected-api-key")
    if (stored) {
      selectedApiKeyStore.set(stored)
    }
  }
})

// Subscribe to changes and save to localStorage
selectedApiKeyStore.subscribe((value) => {
  if (typeof window !== "undefined") {
    if (value) {
      localStorage.setItem("selected-api-key", value)
    } else {
      localStorage.removeItem("selected-api-key")
    }
  }
})
