import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { email, password, username } = await request.json()

    console.log('Registration attempt for email:', email)

    // 验证必需字段
    if (!email || !password || !username) {
      return NextResponse.json(
        { error: 'Email, password, and username are required' }, 
        { status: 400 }
      )
    }

    // 验证密码强度
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' }, 
        { status: 400 }
      )
    }

    // 验证用户名格式
    if (username.length < 3 || username.length > 20) {
      return NextResponse.json(
        { error: 'Username must be between 3 and 20 characters' }, 
        { status: 400 }
      )
    }

    const supabase = createSupabaseClient()

    // 检查用户名是否已存在
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single()

    if (existingUser && !checkError) {
      return NextResponse.json(
        { error: 'Username already exists' }, 
        { status: 400 }
      )
    }

    // 使用Supabase Auth进行注册
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username
        }
      }
    })

    if (error) {
      console.error('Registration error:', error.message)
      return NextResponse.json(
        { error: error.message }, 
        { status: 400 }
      )
    }

    console.log('Registration successful for user:', data.user?.email)

    // 创建用户资料
    if (data.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert([{
          id: data.user.id,
          email: data.user.email,
          username: username,
          avatar_url: data.user.user_metadata?.avatar_url || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])

      if (profileError) {
        console.error('Error creating user profile:', profileError)
        // 即使创建用户资料失败，也返回成功，因为用户已经注册成功
      } else {
        console.log('User profile created successfully')
      }
    }

    return NextResponse.json({
      user: data.user,
      session: data.session
    })

  } catch (error) {
    console.error('Registration API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}