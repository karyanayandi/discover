<script lang="ts">
import { userStore, type ClientUser } from "@/stores/user"
import { initSavedSlugs } from "@/stores/saved-articles"
import { selectedCategoryStore } from "@/stores/selected-category"
import {
  createLanguageStore,
  setLanguageContext,
  type Language,
} from "@/stores/language.svelte"

let {
  user = null,
  savedSlugs = [],
  selectedCategory = "",
  initialLang = "id",
}: {
  user?: ClientUser | null
  savedSlugs?: string[]
  selectedCategory?: string
  initialLang?: Language
} = $props()

const languageStore = createLanguageStore(initialLang)
setLanguageContext(languageStore)

$effect(() => {
  userStore.set(user ?? null)
  initSavedSlugs(savedSlugs)
  selectedCategoryStore.set(selectedCategory)
})
</script>
