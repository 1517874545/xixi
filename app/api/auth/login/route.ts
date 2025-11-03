import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    console.log('Login attempt for email:', email)

    // 验证必需字段
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' }, 
        { status: 400 }
      )
    }

    // 使用Supabase Auth进行登录
    const supabase = createSupabaseClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      console.error('Login error:', error.message)
      return NextResponse.json(
        { error: error.message }, 
        { status: 401 }
      )
    }

    console.log('Login successful for user:', data.user?.email)

    // 检查用户是否在users表中存在，如果不存在则创建
    if (data.user) {
      const { error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (profileError && profileError.code === 'PGRST116') {
        // 用户不存在于users表，创建用户资料
        console.log('Creating user profile for:', data.user.id)
        
        const { error: createError } = await supabase
          .from('users')
          .insert([{
            id: data.user.id,
            email: data.user.email,
            username: data.user.email?.split('@')[0] || 'user',
            avatar_url: data.user.user_metadata?.avatar_url || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])

        if (createError) {
          console.error('Error creating user profile:', createError)
        } else {
          console.log('User profile created successfully')
        }
      }
    }

    return NextResponse.json({
      user: data.user,
      session: data.session
    })

  } catch (error) {
    console.error('Login API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}