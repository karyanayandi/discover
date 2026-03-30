import { atom } from "nanostores"
import { getContext, setContext } from "svelte"

export type Language = "id" | "en"

export interface LanguageStore {
  lang: Language
  setLanguage: (lang: Language) => void
}

export const LANGUAGE_KEY = Symbol("language")

export function createLanguageStore(initialLang: Language): LanguageStore {
  const langAtom = atom<Language>(initialLang)

  const setLanguage = (lang: Language): void => {
    langAtom.set(lang)

    const expires = new Date()
    expires.setFullYear(expires.getFullYear() + 1)
    // biome-ignore lint/suspicious/noDocumentCookie: Client-side language persistence
    document.cookie = `lang=${lang};path=/;expires=${expires.toUTCString()}`
  }

  return {
    get lang() {
      return langAtom.get()
    },
    setLanguage,
  }
}

export function setLanguageContext(store: LanguageStore): void {
  setContext(LANGUAGE_KEY, store)
}

export function getLanguageContext(): LanguageStore {
  return getContext(LANGUAGE_KEY)
}
