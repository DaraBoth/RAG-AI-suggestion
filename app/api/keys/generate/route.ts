import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { generateApiKey, hashApiKey } from '@/lib/api-keys'

/**
 * POST /api/keys/generate
 * Generate a new API key
 * 
 * Body:
 * - name: string (required) - Name/description for the API key
 * - rateLimit: number (optional) - Requests per hour (default: 1000)
 * - allowedEndpoints: string[] (optional) - Which endpoints this key can access
 * - expiresInDays: number (optional) - Key expiration in days
 * - metadata: object (optional) - Additional metadata (email, company, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      name, 
      rateLimit = 1000, 
      allowedEndpoints = ['complete-word', 'suggest-phrase', 'chat'],
      expiresInDays,
      metadata = {}
    } = body

    // Validate input
    if (!name || name.trim().length < 3) {
      return NextResponse.json(
        { error: 'Name is required and must be at least 3 characters' },
        { status: 400 }
      )
    }

    // Generate the API key
    const apiKey = generateApiKey()
    const keyHash = hashApiKey(apiKey)
    const keyPrefix = apiKey.substring(0, 15) // Store prefix for identification

    // Calculate expiration date if provided
    let expiresAt = null
    if (expiresInDays && expiresInDays > 0) {
      expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + expiresInDays)
    }

    // Store in database
    const { data, error }:{data: any, error: any} = await supabase
      .from('public_api_keys')
      .insert({
        name: name.trim(),
        key_hash: keyHash,
        key_prefix: keyPrefix,
        rate_limit: rateLimit,
        allowed_endpoints: allowedEndpoints,
        expires_at: expiresAt?.toISOString(),
        metadata: metadata,
        is_active: true,
      } as any)
      .select()
      .single()

    if (error) {
      console.error('Error creating API key:', error)
      return NextResponse.json(
        { error: 'Failed to create API key: ' + error.message },
        { status: 500 }
      )
    }

    // Return the API key (only shown once!)
    return NextResponse.json({
      success: true,
      apiKey: apiKey, // Full key - show only once!
      keyInfo: {
        id: data.id,
        name: data.name,
        keyPrefix: data.key_prefix,
        rateLimit: data.rate_limit,
        allowedEndpoints: data.allowed_endpoints,
        expiresAt: data.expires_at,
        createdAt: data.created_at,
      },
      warning: '⚠️ Store this API key securely. It will not be shown again!',
    })

  } catch (error) {
    console.error('Error generating API key:', error)
    return NextResponse.json(
      { error: 'Failed to generate API key' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/keys/generate
 * List all API keys (without the actual keys)
 */
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('public_api_keys')
      .select('id, name, key_prefix, is_active, rate_limit, allowed_endpoints, last_used_at, created_at, expires_at, metadata')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching API keys:', error)
      return NextResponse.json(
        { error: 'Failed to fetch API keys' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      keys: data || [],
    })

  } catch (error) {
    console.error('Error listing API keys:', error)
    return NextResponse.json(
      { error: 'Failed to list API keys' },
      { status: 500 }
    )
  }
}
