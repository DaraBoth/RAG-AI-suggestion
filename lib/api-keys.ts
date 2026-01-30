import crypto from 'crypto'

/**
 * Generate a secure API key
 * Format: tk_live_[32 random characters]
 */
export function generateApiKey(): string {
  const randomBytes = crypto.randomBytes(24)
  const key = randomBytes.toString('base64url')
  return `tk_live_${key}`
}

/**
 * Hash an API key for storage using SHA-256
 */
export function hashApiKey(apiKey: string): string {
  return crypto
    .createHash('sha256')
    .update(apiKey)
    .digest('hex')
}

/**
 * Verify if a provided API key matches the stored hash
 */
export function verifyApiKey(apiKey: string, hashedKey: string): boolean {
  const providedHash = hashApiKey(apiKey)
  return crypto.timingSafeEqual(
    Buffer.from(providedHash),
    Buffer.from(hashedKey)
  )
}

/**
 * Encrypt sensitive data
 */
export function encrypt(text: string, secretKey: string): string {
  const algorithm = 'aes-256-cbc'
  const key = crypto.scryptSync(secretKey, 'salt', 32)
  const iv = crypto.randomBytes(16)
  
  const cipher = crypto.createCipheriv(algorithm, key, iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  return `${iv.toString('hex')}:${encrypted}`
}

/**
 * Decrypt sensitive data
 */
export function decrypt(encryptedText: string, secretKey: string): string {
  const algorithm = 'aes-256-cbc'
  const key = crypto.scryptSync(secretKey, 'salt', 32)
  
  const [ivHex, encrypted] = encryptedText.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  
  const decipher = crypto.createDecipheriv(algorithm, key, iv)
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

/**
 * Rate limiting helper - check if request should be allowed
 */
export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
}

// In-memory rate limit store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 60000 // 1 minute
): RateLimitResult {
  const now = Date.now()
  const record = rateLimitStore.get(identifier)
  
  if (!record || record.resetAt < now) {
    // Create new record
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + windowMs
    })
    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: new Date(now + windowMs)
    }
  }
  
  if (record.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(record.resetAt)
    }
  }
  
  record.count++
  return {
    allowed: true,
    remaining: limit - record.count,
    resetAt: new Date(record.resetAt)
  }
}

// Clean up old rate limit records periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetAt < now) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean every minute
