import { createHash, randomBytes } from "node:crypto"

const API_KEY_PREFIX = "discover_"
const API_KEY_LENGTH = 32

export function generateApiKey(): string {
  const randomPart = randomBytes(API_KEY_LENGTH)
    .toString("base64url")
    .slice(0, API_KEY_LENGTH)
  return `${API_KEY_PREFIX}${randomPart}`
}

export function hashApiKey(apiKey: string): string {
  return createHash("sha256").update(apiKey).digest("hex")
}

export function verifyApiKey(apiKey: string, keyHash: string): boolean {
  const computedHash = hashApiKey(apiKey)
  return computedHash === keyHash
}

export function maskApiKey(apiKey: string): string {
  if (apiKey.length < 10) {
    return "discover_...***"
  }
  const prefix = apiKey.slice(0, 12)
  const suffix = apiKey.slice(-4)
  return `${prefix}...${suffix}`
}

export function generateApiKeyId(): string {
  return randomBytes(16).toString("hex")
}
