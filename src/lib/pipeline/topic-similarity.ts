import { openai } from "@ai-sdk/openai"
import { embed } from "ai"
import { Result } from "better-result"

import { createRedisCache } from "@/lib/cache"
import type { SelectCluster } from "@/lib/db/schemas"
import { logger } from "@/lib/logger"

const SIMILARITY_THRESHOLD = 0.75
const EMBEDDING_CACHE_TTL = 24 * 60 * 60
const EMBEDDING_MODEL = "text-embedding-3-small"

interface ClusterEmbedding {
  clusterId: string
  topic: string
  keywords: string[]
  embedding: number[]
  createdAt: Date
}

interface SimilarityRelationship {
  clusterAId: string
  clusterBId: string
  similarityScore: number
  createdAt: Date
}

const cache = createRedisCache()

function getEmbeddingCacheKey(clusterId: string): string {
  return `cluster:embedding:${clusterId}`
}

function getSimilarityCacheKey(clusterAId: string, clusterBId: string): string {
  const sortedIds = [clusterAId, clusterBId].sort()
  return `cluster:similarity:${sortedIds[0]}:${sortedIds[1]}`
}

function getMergeSuggestionKey(clusterAId: string, clusterBId: string): string {
  const sortedIds = [clusterAId, clusterBId].sort()
  return `cluster:merge-suggestion:${sortedIds[0]}:${sortedIds[1]}`
}

function getCooldownKey(clusterAId: string, clusterBId: string): string {
  const sortedIds = [clusterAId, clusterBId].sort()
  return `cluster:merge-cooldown:${sortedIds[0]}:${sortedIds[1]}`
}

export async function generateEmbedding(
  cluster: SelectCluster,
): Promise<Result<number[], Error>> {
  try {
    const cacheKey = getEmbeddingCacheKey(cluster.id)
    const cached = await cache.getCache<ClusterEmbedding>(cacheKey)

    if (cached) {
      logger.debug(`Cache hit for cluster embedding: ${cluster.id}`)
      return Result.ok(cached.embedding)
    }

    const text = `${cluster.topic} ${cluster.keywords.join(" ")}`
    const { embedding } = await embed({
      model: openai.embedding(EMBEDDING_MODEL),
      value: text,
    })

    const embeddingData: ClusterEmbedding = {
      clusterId: cluster.id,
      topic: cluster.topic,
      keywords: cluster.keywords,
      embedding,
      createdAt: new Date(),
    }

    await cache.setCache(cacheKey, embeddingData, EMBEDDING_CACHE_TTL)

    logger.debug(`Generated embedding for cluster: ${cluster.id}`)
    return Result.ok(embedding)
  } catch (error) {
    logger.error(
      `Failed to generate embedding for cluster ${cluster.id}: ${error}`,
    )
    return Result.err(error instanceof Error ? error : new Error(String(error)))
  }
}

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error("Vectors must have the same length")
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i]
    normA += vecA[i] * vecA[i]
    normB += vecB[i] * vecB[i]
  }

  if (normA === 0 || normB === 0) {
    return 0
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

export async function computeSimilarity(
  clusterA: SelectCluster,
  clusterB: SelectCluster,
): Promise<Result<number, Error>> {
  try {
    const cacheKey = getSimilarityCacheKey(clusterA.id, clusterB.id)
    const cached = await cache.getCache<{ score: number }>(cacheKey)

    if (cached) {
      return Result.ok(cached.score)
    }

    const embeddingA = await generateEmbedding(clusterA)
    const embeddingB = await generateEmbedding(clusterB)

    if (Result.isError(embeddingA)) {
      return Result.err(embeddingA.error)
    }

    if (Result.isError(embeddingB)) {
      return Result.err(embeddingB.error)
    }

    const similarity = cosineSimilarity(embeddingA.value, embeddingB.value)

    await cache.setCache(cacheKey, { score: similarity }, EMBEDDING_CACHE_TTL)

    return Result.ok(similarity)
  } catch (error) {
    logger.error(
      `Failed to compute similarity between clusters ${clusterA.id} and ${clusterB.id}: ${error}`,
    )
    return Result.err(error instanceof Error ? error : new Error(String(error)))
  }
}

export async function batchComputeSimilarities(
  clusters: SelectCluster[],
): Promise<Result<SimilarityRelationship[], Error>> {
  try {
    const relationships: SimilarityRelationship[] = []

    const embeddingResults = await Promise.all(
      clusters.map(async (cluster) => {
        const result = await generateEmbedding(cluster)
        return { cluster, result }
      }),
    )

    const embeddings: Map<string, number[]> = new Map()
    for (const { cluster, result } of embeddingResults) {
      if (Result.isOk(result)) {
        embeddings.set(cluster.id, result.value)
      } else {
        logger.warn(
          `Failed to generate embedding for cluster ${cluster.id}: ${result.error}`,
        )
      }
    }

    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const clusterA = clusters[i]
        const clusterB = clusters[j]

        const embeddingA = embeddings.get(clusterA.id)
        const embeddingB = embeddings.get(clusterB.id)

        if (!embeddingA || !embeddingB) continue

        const similarity = cosineSimilarity(embeddingA, embeddingB)

        if (similarity >= SIMILARITY_THRESHOLD) {
          relationships.push({
            clusterAId: clusterA.id,
            clusterBId: clusterB.id,
            similarityScore: similarity,
            createdAt: new Date(),
          })
        }
      }
    }

    return Result.ok(relationships)
  } catch (error) {
    logger.error(`Failed to batch compute similarities: ${error}`)
    return Result.err(error instanceof Error ? error : new Error(String(error)))
  }
}

export async function storeSimilarityRelationship(
  relationship: SimilarityRelationship,
): Promise<Result<void, Error>> {
  try {
    const cacheKey = getSimilarityCacheKey(
      relationship.clusterAId,
      relationship.clusterBId,
    )
    await cache.setCache(
      cacheKey,
      { score: relationship.similarityScore },
      EMBEDDING_CACHE_TTL,
    )

    const listKey = `cluster:high-similarity:${relationship.clusterAId}`
    const redis = await cache.getRedisClient()
    if (redis) {
      await redis.sadd(listKey, relationship.clusterBId)
      await redis.expire(listKey, EMBEDDING_CACHE_TTL)
    }

    return Result.ok(undefined)
  } catch (error) {
    logger.error(`Failed to store similarity relationship: ${error}`)
    return Result.err(error instanceof Error ? error : new Error(String(error)))
  }
}

export async function getSimilarClusters(
  clusterId: string,
  _minSimilarity = SIMILARITY_THRESHOLD,
): Promise<Result<string[], Error>> {
  try {
    const listKey = `cluster:high-similarity:${clusterId}`
    const redis = await cache.getRedisClient()

    if (!redis) {
      return Result.ok([])
    }

    const similarIds = await redis.smembers(listKey)
    return Result.ok(similarIds)
  } catch (error) {
    logger.error(`Failed to get similar clusters for ${clusterId}: ${error}`)
    return Result.err(error instanceof Error ? error : new Error(String(error)))
  }
}

export interface MergeSuggestion {
  id: string
  clusterAId: string
  clusterBId: string
  clusterATopic: string
  clusterBTopic: string
  similarityScore: number
  sampleTitlesA: string[]
  sampleTitlesB: string[]
  status: "pending" | "approved" | "rejected"
  createdAt: Date
}

export async function createMergeSuggestion(
  clusterA: SelectCluster,
  clusterB: SelectCluster,
  similarityScore: number,
  sampleTitlesA: string[],
  sampleTitlesB: string[],
): Promise<Result<MergeSuggestion, Error>> {
  try {
    const suggestion: MergeSuggestion = {
      id: `${clusterA.id}:${clusterB.id}`,
      clusterAId: clusterA.id,
      clusterBId: clusterB.id,
      clusterATopic: clusterA.topic,
      clusterBTopic: clusterB.topic,
      similarityScore,
      sampleTitlesA,
      sampleTitlesB,
      status: "pending",
      createdAt: new Date(),
    }

    const cacheKey = getMergeSuggestionKey(clusterA.id, clusterB.id)
    await cache.setCache(cacheKey, suggestion, EMBEDDING_CACHE_TTL)

    const pendingKey = "cluster:merge-suggestions:pending"
    const redis = await cache.getRedisClient()
    if (redis) {
      await redis.sadd(pendingKey, suggestion.id)
      await redis.expire(pendingKey, EMBEDDING_CACHE_TTL)
    }

    logger.info(
      `Created merge suggestion for clusters ${clusterA.id} and ${clusterB.id} (score: ${similarityScore})`,
    )
    return Result.ok(suggestion)
  } catch (error) {
    logger.error(`Failed to create merge suggestion: ${error}`)
    return Result.err(error instanceof Error ? error : new Error(String(error)))
  }
}

export async function getPendingMergeSuggestions(): Promise<
  Result<MergeSuggestion[], Error>
> {
  try {
    const pendingKey = "cluster:merge-suggestions:pending"
    const redis = await cache.getRedisClient()

    if (!redis) {
      return Result.ok([])
    }

    const suggestionIds = await redis.smembers(pendingKey)
    const suggestions: MergeSuggestion[] = []

    for (const id of suggestionIds) {
      const [clusterAId, clusterBId] = id.split(":")
      const cacheKey = getMergeSuggestionKey(clusterAId, clusterBId)
      const suggestion = await cache.getCache<MergeSuggestion>(cacheKey)
      if (suggestion && suggestion.status === "pending") {
        suggestions.push(suggestion)
      }
    }

    suggestions.sort((a, b) => b.similarityScore - a.similarityScore)

    return Result.ok(suggestions)
  } catch (error) {
    logger.error(`Failed to get pending merge suggestions: ${error}`)
    return Result.err(error instanceof Error ? error : new Error(String(error)))
  }
}

export async function approveMergeSuggestion(
  suggestionId: string,
  approvedBy: string,
): Promise<Result<void, Error>> {
  try {
    const [clusterAId, clusterBId] = suggestionId.split(":")
    const cacheKey = getMergeSuggestionKey(clusterAId, clusterBId)

    const suggestion = await cache.getCache<MergeSuggestion>(cacheKey)
    if (!suggestion) {
      return Result.err(new Error("Merge suggestion not found"))
    }

    suggestion.status = "approved"
    await cache.setCache(cacheKey, suggestion, EMBEDDING_CACHE_TTL)

    const pendingKey = "cluster:merge-suggestions:pending"
    const redis = await cache.getRedisClient()
    if (redis) {
      await redis.srem(pendingKey, suggestionId)
    }

    logger.info(`Merge suggestion ${suggestionId} approved by ${approvedBy}`)
    return Result.ok(undefined)
  } catch (error) {
    logger.error(`Failed to approve merge suggestion: ${error}`)
    return Result.err(error instanceof Error ? error : new Error(String(error)))
  }
}

export async function rejectMergeSuggestion(
  suggestionId: string,
): Promise<Result<void, Error>> {
  try {
    const [clusterAId, clusterBId] = suggestionId.split(":")
    const cacheKey = getMergeSuggestionKey(clusterAId, clusterBId)

    const suggestion = await cache.getCache<MergeSuggestion>(cacheKey)
    if (!suggestion) {
      return Result.err(new Error("Merge suggestion not found"))
    }

    suggestion.status = "rejected"
    await cache.setCache(cacheKey, suggestion, EMBEDDING_CACHE_TTL)

    const pendingKey = "cluster:merge-suggestions:pending"
    const redis = await cache.getRedisClient()
    if (redis) {
      await redis.srem(pendingKey, suggestionId)
    }

    const cooldownKey = getCooldownKey(clusterAId, clusterBId)
    await cache.setCache(
      cooldownKey,
      { rejectedAt: new Date() },
      7 * 24 * 60 * 60,
    )

    const similarityKey = getSimilarityCacheKey(clusterAId, clusterBId)
    await cache.deleteCache(similarityKey)

    logger.info(`Merge suggestion ${suggestionId} rejected with 7-day cooldown`)
    return Result.ok(undefined)
  } catch (error) {
    logger.error(`Failed to reject merge suggestion: ${error}`)
    return Result.err(error instanceof Error ? error : new Error(String(error)))
  }
}

export async function isInCooldown(
  clusterAId: string,
  clusterBId: string,
): Promise<boolean> {
  const cooldownKey = getCooldownKey(clusterAId, clusterBId)
  const cooldown = await cache.getCache<{ rejectedAt: Date }>(cooldownKey)
  return cooldown !== null
}
