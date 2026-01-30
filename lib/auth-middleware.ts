import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { hashApiKey, checkRateLimit } from '@/lib/api-keys'

export interface AuthenticatedRequest extends NextRequest {
  apiKeyId?: string
  apiKeyInfo?: any
}

/**
 * Middleware to authenticate API requests using API keys
 * Checks Authorization header for Bearer token
 */
export async function authenticateApiKey(
  request: NextRequest,
  requiredEndpoint: string
): Promise<{ authenticated: boolean; error?: string; apiKeyId?: string; response?: NextResponse }> {
  
  // Extract API key from Authorization header
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      authenticated: false,
      error: 'Missing or invalid Authorization header. Use: Authorization: Bearer YOUR_API_KEY',
      response: NextResponse.json(
        { 
          error: 'Unauthorized',
          message: 'Missing or invalid Authorization header',
          details: 'Use: Authorization: Bearer YOUR_API_KEY'
        },
        { status: 401 }
      )
    }
  }

  const apiKey = authHeader.substring(7) // Remove 'Bearer ' prefix

  // Validate API key format
  if (!apiKey.startsWith('tk_live_')) {
    return {
      authenticated: false,
      error: 'Invalid API key format',
      response: NextResponse.json(
        { 
          error: 'Unauthorized',
          message: 'Invalid API key format'
        },
        { status: 401 }
      )
    }
  }

  // Hash the API key to compare with stored hash
  const keyHash = hashApiKey(apiKey)

  try {
    // Look up the API key in the database
    const { data: apiKeyData, error: dbError }:{data: any, error: any} = await supabase
      .from('public_api_keys')
      .select('*')
      .eq('key_hash', keyHash)
      .single()

    if (dbError || !apiKeyData) {
      return {
        authenticated: false,
        error: 'Invalid API key',
        response: NextResponse.json(
          { 
            error: 'Unauthorized',
            message: 'Invalid API key'
          },
          { status: 401 }
        )
      }
    }

    // Check if key is active
    if (!apiKeyData.is_active) {
      return {
        authenticated: false,
        error: 'API key is deactivated',
        response: NextResponse.json(
          { 
            error: 'Forbidden',
            message: 'This API key has been deactivated'
          },
          { status: 403 }
        )
      }
    }

    // Check if key has expired
    if (apiKeyData.expires_at && new Date(apiKeyData.expires_at) < new Date()) {
      return {
        authenticated: false,
        error: 'API key has expired',
        response: NextResponse.json(
          { 
            error: 'Forbidden',
            message: 'This API key has expired',
            expiredAt: apiKeyData.expires_at
          },
          { status: 403 }
        )
      }
    }

    // Check if key has access to this endpoint
    if (!apiKeyData.allowed_endpoints.includes(requiredEndpoint)) {
      return {
        authenticated: false,
        error: 'Endpoint not allowed for this API key',
        response: NextResponse.json(
          { 
            error: 'Forbidden',
            message: `This API key does not have access to the '${requiredEndpoint}' endpoint`,
            allowedEndpoints: apiKeyData.allowed_endpoints
          },
          { status: 403 }
        )
      }
    }

    // Check rate limit
    const rateLimit = checkRateLimit(
      apiKeyData.id,
      apiKeyData.rate_limit,
      3600000 // 1 hour in ms
    )

    if (!rateLimit.allowed) {
      return {
        authenticated: false,
        error: 'Rate limit exceeded',
        response: NextResponse.json(
          { 
            error: 'Too Many Requests',
            message: 'Rate limit exceeded',
            rateLimit: {
              limit: apiKeyData.rate_limit,
              remaining: 0,
              resetAt: rateLimit.resetAt
            }
          },
          { 
            status: 429,
            headers: {
              'X-RateLimit-Limit': apiKeyData.rate_limit.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': rateLimit.resetAt.toISOString(),
              'Retry-After': Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000).toString()
            }
          }
        )
      }
    }

    // Log the API usage
    await logApiUsage(
      apiKeyData.id,
      requiredEndpoint,
      request.method,
      request
    )

    // Authentication successful
    return {
      authenticated: true,
      apiKeyId: apiKeyData.id,
    }

  } catch (error) {
    console.error('Error authenticating API key:', error)
    return {
      authenticated: false,
      error: 'Internal server error during authentication',
      response: NextResponse.json(
        { 
          error: 'Internal Server Error',
          message: 'Failed to authenticate API key'
        },
        { status: 500 }
      )
    }
  }
}

/**
 * Log API usage for analytics and monitoring
 */
async function logApiUsage(
  apiKeyId: string,
  endpoint: string,
  method: string,
  request: NextRequest
) {
  try {
    const startTime = Date.now()
    
    await supabase
      .from('public_api_usage_logs')
      .insert({
        api_key_id: apiKeyId,
        endpoint: endpoint,
        method: method,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        request_metadata: {
          url: request.url,
          timestamp: new Date().toISOString()
        }
      } as any)

  } catch (error) {
    console.error('Error logging API usage:', error)
    // Don't fail the request if logging fails
  }
}

/**
 * Update API usage log with response information
 */
export async function updateApiUsageLog(
  logId: string,
  statusCode: number,
  responseTimeMs: number,
  errorMessage?: string
) {
  try {
    const { error } = await (supabase
      .from('public_api_usage_logs') as any)
      .update({
        status_code: statusCode,
        response_time_ms: responseTimeMs,
        error_message: errorMessage
      })
      .eq('id', logId)
    
    if (error) {
      console.error('Error updating API usage log:', error)
    }
  } catch (error) {
    console.error('Error updating API usage log:', error)
  }
}
