export const databaseUrl =
  process.env.DATABASE_URL ?? import.meta.env.DATABASE_URL
export const redisUrl = process.env.REDIS_URL ?? import.meta.env.REDIS_URL
export const redisKeyPrefix =
  process.env.REDIS_KEY_PREFIX ??
  import.meta.env.REDIS_KEY_PREFIX ??
  "app_cache:"
