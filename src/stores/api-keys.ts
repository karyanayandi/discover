import { atom, onMount } from "nanostores"

export interface ApiKey {
  id: string
  name: string
  key?: string
  isActive: boolean
  createdAt: string
  lastUsedAt: string | null
}

export const apiKeysStore = atom<ApiKey[]>([])

export const selectedApiKeyStore = atom<string | null>(null)

export const apiKeysLoadingStore = atom<boolean>(false)

export const apiKeysErrorStore = atom<string | null>(null)

onMount(selectedApiKeyStore, () => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("selected-api-key")
    if (stored) {
      selectedApiKeyStore.set(stored)
    }
  }
})

selectedApiKeyStore.subscribe((value) => {
  if (typeof window !== "undefined") {
    if (value) {
      localStorage.setItem("selected-api-key", value)
    } else {
      localStorage.removeItem("selected-api-key")
    }
  }
})
