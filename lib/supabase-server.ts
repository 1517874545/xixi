import { createClient } from '@supabase/supabase-js'

// 获取环境变量，优先使用 NEXT_PUBLIC_ 前缀（前端可用），否则使用服务器端变量
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file'
  )
}

/**
 * 创建匿名 Supabase 客户端（受 RLS 策略限制）
 * 用于需要用户认证的操作
 */
export function createSupabaseClient() {
  return createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      autoRefreshToken: true,
      persistSession: false, // 服务器端不需要持久化会话
    },
  })
}

/**
 * 创建带认证的 Supabase 客户端
 * @param accessToken 用户的访问令牌
 */
export function createAuthenticatedClient(accessToken: string) {
  return createClient(supabaseUrl!, supabaseAnonKey!, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * 创建服务角色 Supabase 客户端（绕过 RLS）
 * 仅在服务器端使用，用于管理员操作或绕过权限检查
 */
export function createServiceClient() {
  if (!supabaseServiceKey) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY is not set. Service client operations may fail.')
    return null
  }

  return createClient(supabaseUrl!, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * 从请求头中提取访问令牌
 */
export function getAccessTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('Authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.replace('Bearer ', '')
  }
  return null
}

/**
 * 获取当前认证用户
 * @param request Next.js 请求对象
 */
export async function getAuthenticatedUser(request: Request) {
  const token = getAccessTokenFromRequest(request)
  
  if (!token) {
    return { user: null, error: { message: 'Missing authorization token' } }
  }

  const supabase = createSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser(token)

  return { user, error }
}

