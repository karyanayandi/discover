import { createHash, randomBytes } from "node:crypto"

const API_KEY_PREFIX = "discover_"
const API_KEY_LENGTH = 32

/**
 * Generate a new API key with the format: discover_<random-32-chars>
 */
export function generateApiKey(): string {
  const randomPart = randomBytes(API_KEY_LENGTH)
    .toString("base64url")
    .slice(0, API_KEY_LENGTH)
  return `${API_KEY_PREFIX}${randomPart}`
}

/**
 * Hash an API key using SHA-256
 * We store only the hash in the database for security
 */
export function hashApiKey(apiKey: string): string {
  return createHash("sha256").update(apiKey).digest("hex")
}

/**
 * Verify an API key against its hash
 */
export function verifyApiKey(apiKey: string, keyHash: string): boolean {
  const computedHash = hashApiKey(apiKey)
  return computedHash === keyHash
}

/**
 * Mask an API key for display (show only first and last few characters)
 */
export function maskApiKey(apiKey: string): string {
  if (apiKey.length < 10) {
    return "discover_...***"
  }
  const prefix = apiKey.slice(0, 12) // "discover_xxx"
  const suffix = apiKey.slice(-4)
  return `${prefix}...${suffix}`
}

/**
 * Generate a unique ID for the API key record
 */
export function generateApiKeyId(): string {
  return randomBytes(16).toString("hex")
}
