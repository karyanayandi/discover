import { Result } from "better-result"
import { eq } from "drizzle-orm"
import RssParser from "rss-parser"

import { db } from "@/lib/db/client"
import type { SelectFeedSource } from "@/lib/db/schemas"
import { feedItemsTable, feedSourcesTable } from "@/lib/db/schemas"
import { logger } from "@/lib/logger"
import { FeedIngestionError } from "./errors"

interface FeedIngestionResult {
  sourceId: string
  newItems: number
  skipped: number
}

const parser = new RssParser()

function fetchFeed(source: SelectFeedSource) {
  return Result.gen(async function* () {
    const feed = yield* Result.await(
      Result.tryPromise({
        try: () => parser.parseURL(source.url),
        catch: (e) =>
          new FeedIngestionError({
            message: `Failed to parse feed ${source.url}`,
            cause: e,
          }),
      }),
    )

    let newItems = 0
    let skipped = 0

    for (const item of feed.items) {
      const guid = item.guid ?? item.link ?? item.title ?? ""
      if (!guid) {
        skipped++
        continue
      }

      const existing = yield* Result.await(
        Result.tryPromise({
          try: () =>
            db.query.feedItemsTable.findFirst({
              where: eq(feedItemsTable.guid, guid),
              columns: { id: true },
            }),
          catch: (e) =>
            new FeedIngestionError({
              message: `DB lookup failed for guid ${guid}`,
              cause: e,
            }),
        }),
      )

      if (existing) {
        skipped++
        continue
      }

      yield* Result.await(
        Result.tryPromise({
          try: () =>
            db.insert(feedItemsTable).values({
              feedSourceId: source.id,
              guid,
              title: item.title ?? "Untitled",
              link: item.link ?? "",
              description: item.contentSnippet ?? item.content ?? "",
              author: item.creator ?? item.author ?? null,
              publishedAt: item.isoDate ? new Date(item.isoDate) : null,
              status: "pending",
            }),
          catch: (e) =>
            new FeedIngestionError({
              message: `DB insert failed for item ${guid}`,
              cause: e,
            }),
        }),
      )

      newItems++
    }

    yield* Result.await(
      Result.tryPromise({
        try: () =>
          db
            .update(feedSourcesTable)
            .set({ lastFetchedAt: new Date() })
            .where(eq(feedSourcesTable.id, source.id)),
        catch: (e) =>
          new FeedIngestionError({
            message: `Failed to update lastFetchedAt for source ${source.id}`,
            cause: e,
          }),
      }),
    )

    return Result.ok<FeedIngestionResult>({
      sourceId: source.id,
      newItems,
      skipped,
    })
  })
}

export function ingestAllFeeds() {
  return Result.gen(async function* () {
    const sources = yield* Result.await(
      Result.tryPromise({
        try: () =>
          db.query.feedSourcesTable.findMany({
            where: eq(feedSourcesTable.enabled, true),
          }),
        catch: (e) =>
          new FeedIngestionError({
            message: "Failed to fetch feed sources",
            cause: e,
          }),
      }),
    )

    const results: FeedIngestionResult[] = []

    for (const source of sources) {
      const result = await fetchFeed(source)
      if (Result.isOk(result)) {
        results.push(result.value)
      } else {
        logger.warn(`Skipping source ${source.name}: ${result.error.message}`)
      }
    }

    logger.info(`Feed ingestion complete: ${results.length} sources processed`)
    return Result.ok(results)
  })
}
