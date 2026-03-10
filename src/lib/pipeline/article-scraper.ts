import { Readability } from "@mozilla/readability"
import type { Result } from "better-result"
import { Result as R } from "better-result"
import { JSDOM } from "jsdom"

import { db } from "@/lib/db/client"
import { assetsTable } from "@/lib/db/schemas"
import { logger } from "@/lib/logger"
import { getR2Storage } from "@/lib/storage"
import { ArticleScrapeError } from "./errors"

export interface ScrapedArticle {
  title: string
  content: string
  textContent: string
  excerpt: string
  thumbnailUrl: string | null
  thumbnailAssetId: string | null
  siteName: string | null
}

function extractThumbnail(doc: Document, url: string): string | null {
  const ogImage = doc
    .querySelector('meta[property="og:image"]')
    ?.getAttribute("content")
  if (ogImage) return ogImage

  const twitterImage = doc
    .querySelector('meta[name="twitter:image"]')
    ?.getAttribute("content")
  if (twitterImage) return twitterImage

  const firstImg = doc.querySelector("article img")?.getAttribute("src")
  if (firstImg) {
    const parsed = R.try(() => new URL(firstImg, url).href)
    return R.isOk(parsed) ? parsed.value : firstImg
  }

  return null
}

async function uploadThumbnail(
  imageUrl: string,
): Promise<{ url: string; assetId: string | null }> {
  logger.info({ imageUrl }, "Thumbnail upload: fetching image")

  const fetchResult = await R.tryPromise({
    try: () => fetch(imageUrl),
    catch: (e) =>
      new ArticleScrapeError({
        message: `Failed to fetch thumbnail ${imageUrl}`,
        cause: e,
      }),
  })

  if (R.isError(fetchResult)) {
    logger.warn(
      { imageUrl, error: fetchResult.error.message },
      "Thumbnail upload: fetch failed",
    )
    return { url: imageUrl, assetId: null }
  }

  if (!fetchResult.value.ok) {
    logger.warn(
      { imageUrl, status: fetchResult.value.status },
      "Thumbnail upload: fetch returned non-OK status",
    )
    return { url: imageUrl, assetId: null }
  }

  const response = fetchResult.value
  const contentType = response.headers.get("content-type") ?? ""

  if (!contentType.startsWith("image/")) {
    logger.warn(
      { imageUrl, contentType },
      "Thumbnail upload: skipped — not an image content-type",
    )
    return { url: imageUrl, assetId: null }
  }

  const bufferResult = await R.tryPromise({
    try: async () => Buffer.from(await response.arrayBuffer()),
    catch: (e) =>
      new ArticleScrapeError({
        message: "Failed to read thumbnail buffer",
        cause: e,
      }),
  })

  if (R.isError(bufferResult)) {
    logger.warn(
      { imageUrl, error: bufferResult.error.message },
      "Thumbnail upload: buffer read failed",
    )
    return { url: imageUrl, assetId: null }
  }

  const buffer = bufferResult.value
  logger.info(
    { imageUrl, size: buffer.byteLength, contentType },
    "Thumbnail upload: fetched image, uploading to R2",
  )

  const r2 = getR2Storage()
  const uploadResult = await r2.uploadImage(buffer, contentType)

  if (R.isError(uploadResult)) {
    logger.error(
      { imageUrl, error: uploadResult.error.message },
      "Thumbnail upload: R2 upload failed",
    )
    return { url: imageUrl, assetId: null }
  }

  const r2Url = uploadResult.value
  const filename = r2Url.split("/").pop() ?? "thumbnail.webp"

  const assetResult = await R.tryPromise({
    try: () =>
      db
        .insert(assetsTable)
        .values({
          filename,
          originalName:
            new URL(imageUrl).pathname.split("/").pop() ?? "thumbnail",
          type: "images",
          size: buffer.byteLength,
          url: r2Url,
        })
        .returning({ id: assetsTable.id }),
    catch: (e) =>
      new ArticleScrapeError({
        message: `Failed to insert asset row for thumbnail`,
        cause: e,
      }),
  })

  if (R.isError(assetResult)) {
    logger.warn("Asset row insert failed, returning URL without assetId")
    return { url: r2Url, assetId: null }
  }

  return { url: r2Url, assetId: assetResult.value[0].id }
}

export function scrapeArticle(
  url: string,
): Promise<Result<ScrapedArticle, ArticleScrapeError>> {
  return R.gen(async function* () {
    const response = yield* R.await(
      R.tryPromise({
        try: () =>
          fetch(url, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (compatible; DiscoverBot/1.0; +https://discover.app)",
            },
          }),
        catch: (e) =>
          new ArticleScrapeError({
            message: `Failed to fetch ${url}`,
            cause: e,
          }),
      }),
    )

    if (!response.ok) {
      return R.err(
        new ArticleScrapeError({
          message: `HTTP ${response.status} fetching ${url}`,
        }),
      )
    }

    const html = yield* R.await(
      R.tryPromise({
        try: () => response.text(),
        catch: (e) =>
          new ArticleScrapeError({
            message: `Failed to read response body for ${url}`,
            cause: e,
          }),
      }),
    )

    const dom = new JSDOM(html, { url })
    const reader = new Readability(dom.window.document)
    const article = reader.parse()

    if (!article) {
      return R.err(
        new ArticleScrapeError({
          message: `Readability failed to parse ${url}`,
        }),
      )
    }

    let thumbnailUrl = extractThumbnail(
      new JSDOM(html, { url }).window.document,
      url,
    )
    let thumbnailAssetId: string | null = null

    if (thumbnailUrl) {
      const uploaded = await uploadThumbnail(thumbnailUrl)
      thumbnailUrl = uploaded.url
      thumbnailAssetId = uploaded.assetId
    }

    return R.ok({
      title: article.title ?? "Untitled",
      content: article.content ?? "",
      textContent: article.textContent ?? "",
      excerpt: article.excerpt ?? "",
      thumbnailUrl,
      thumbnailAssetId,
      siteName: article.siteName ?? null,
    })
  })
}
