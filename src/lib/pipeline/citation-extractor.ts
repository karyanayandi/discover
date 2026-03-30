import type { Result } from "better-result"
import { Result as R } from "better-result"

export interface ExtractedCitation {
  url: string
  title: string
  domain: string
  iconUrl: string | null
  description: string | null
}

function extractDomain(url: string): string {
  const parsed = R.try(() => new URL(url).hostname.replace(/^www\./, ""))
  return R.isOk(parsed) ? parsed.value : url
}

export function extractCitationsFromCluster(
  items: {
    title: string
    link: string
    description?: string | null
    feedSource?: { iconUrl: string | null } | null
  }[],
): Result<ExtractedCitation[], never> {
  const citations: ExtractedCitation[] = items
    .filter((item) => item.link)
    .map((item, i) => ({
      url: item.link,
      title: item.title || `Source ${i + 1}`,
      domain: extractDomain(item.link),
      iconUrl: item.feedSource?.iconUrl ?? null,
      description: item.description ?? null,
    }))

  return R.ok(citations)
}
