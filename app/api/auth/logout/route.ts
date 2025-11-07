import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient, getAccessTokenFromRequest } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    // 从Authorization头获取token
    const token = getAccessTokenFromRequest(request)

    // 如果有token，尝试登出
    if (token) {
      const supabase = createSupabaseClient()
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Logout error:', error)
      }
    }

    // 总是返回成功，因为登出主要是客户端操作
    return NextResponse.json({ 
      success: true,
      message: 'Logged out successfully' 
    })

  } catch (error) {
    console.error('Logout API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}