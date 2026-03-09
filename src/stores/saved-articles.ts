import { atom } from "nanostores"

const savedSlugsStore = atom<Set<string>>(new Set())

export function isSaved(slug: string): boolean {
  return savedSlugsStore.get().has(slug)
}

export function initSavedSlugs(slugs: string[]): void {
  savedSlugsStore.set(new Set(slugs))
}

export async function toggleSave(
  slug: string,
): Promise<{ saved: boolean; error?: string }> {
  const current = savedSlugsStore.get()
  const wasSaved = current.has(slug)
  const method = wasSaved ? "DELETE" : "POST"

  const next = new Set(current)
  if (wasSaved) {
    next.delete(slug)
  } else {
    next.add(slug)
  }
  savedSlugsStore.set(next)

  const res = await fetch(`/api/articles/${slug}/save`, { method })
  if (!res.ok) {
    savedSlugsStore.set(current)
    const data = await res.json().catch(() => ({}))
    return {
      saved: wasSaved,
      error: (data as { error?: string }).error ?? "Failed to save",
    }
  }

  return { saved: !wasSaved }
}

export { savedSlugsStore }
