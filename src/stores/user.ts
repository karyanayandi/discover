import { atom } from "nanostores"

export interface ClientUser {
  id: string
  name: string | null
  email: string
  image: string | null
  role: string | null
}

export const userStore = atom<ClientUser | null>(null)
