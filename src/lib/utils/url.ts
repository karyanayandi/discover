export function resolveImageUrl(url: string, baseUrl: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url
  }

  if (url.startsWith("//")) {
    const baseProtocol = baseUrl.startsWith("https://") ? "https:" : "http:"
    return `${baseProtocol}${url}`
  }

  try {
    return new URL(url, baseUrl).href
  } catch {
    return url
  }
}

export function isAbsoluteUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://")
}

export function isProtocolRelativeUrl(url: string): boolean {
  return url.startsWith("//")
}
