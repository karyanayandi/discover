import * as clsx from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: clsx.ClassValue[]) {
  return twMerge(clsx.clsx(inputs))
}

// biome-ignore lint/suspicious/noExplicitAny: FIX: later
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, "child"> : T

// biome-ignore lint/suspicious/noExplicitAny: FIX: later
export type WithoutChildren<T> = T extends { children?: any }
  ? Omit<T, "children">
  : T
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & {
  ref?: U | null
}
