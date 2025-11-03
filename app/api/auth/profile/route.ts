import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, createSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    // 获取认证用户
    const { user, error: authError } = await getAuthenticatedUser(request)

    if (authError || !user) {
      return NextResponse.json(
        { error: authError?.message || 'Invalid token' }, 
        { status: 401 }
      )
    }

    // 获取用户资料
    const supabase = createSupabaseClient()
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      // 返回基础用户信息
      return NextResponse.json({
        id: user.id,
        email: user.email,
        username: user.user_metadata?.username || user.email?.split('@')[0]
      })
    }

    // 返回完整的用户信息
    return NextResponse.json({
      id: user.id,
      email: user.email,
      username: userProfile.username,
      avatar_url: userProfile.avatar_url,
      created_at: userProfile.created_at,
      updated_at: userProfile.updated_at
    })

  } catch (error) {
    console.error('Profile API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}