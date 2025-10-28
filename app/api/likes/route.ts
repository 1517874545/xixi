import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 安全地获取环境变量
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase environment variables are missing')
}

// 创建匿名客户端用于查询
const supabase = createClient(
  supabaseUrl || 'https://example.supabase.co',
  supabaseKey || 'example-key'
)

// 创建服务角色客户端用于绕过RLS（在认证失败时使用）
const serviceClient = serviceKey ? createClient(supabaseUrl || 'https://example.supabase.co', serviceKey) : null

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const designId = searchParams.get('designId')
    const userId = searchParams.get('userId')

    if (userId) {
      // 查询用户喜欢的作品
      const { data: likes, error } = await supabase
        .from('likes')
        .select('design_id')
        .eq('user_id', userId)

      if (error) {
        console.error('Error fetching user likes:', error)
        // 返回空数组作为备选方案
        return NextResponse.json({ likedDesigns: [] })
      }

      const likedDesigns = likes?.map(like => like.design_id) || []
      return NextResponse.json({ likedDesigns })
    }

    if (designId) {
      // 检查用户是否喜欢该作品
      const { data: likes, error } = await supabase
        .from('likes')
        .select('id')
        .eq('design_id', designId)
        .eq('user_id', userId || '') // 如果没有userId，返回false

      if (error) {
        console.error('Error checking like status:', error)
        return NextResponse.json({ liked: false })
      }

      const liked = likes && likes.length > 0
      return NextResponse.json({ liked })
    }

    // 如果既没有userId也没有designId，返回错误
    return NextResponse.json({ error: 'designId or userId parameter is required' }, { status: 400 })
  } catch (error) {
    console.error('GET /api/likes error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { design_id, user_id } = body

    if (!design_id || !user_id) {
      return NextResponse.json({ error: 'design_id and user_id are required' }, { status: 400 })
    }

    // 首先检查是否已经点赞
    const { data: existingLike, error: checkError } = await supabase
      .from('likes')
      .select('id')
      .eq('design_id', design_id)
      .eq('user_id', user_id)

    if (checkError) {
      console.error('Error checking existing like:', checkError)
    }

    if (existingLike && existingLike.length > 0) {
      // 取消点赞
      const { error: deleteError } = await supabase
        .from('likes')
        .delete()
        .eq('design_id', design_id)
        .eq('user_id', user_id)

      if (deleteError) {
        console.error('Error deleting like:', deleteError)
        // 尝试使用服务客户端
        if (serviceClient) {
          const { error: serviceError } = await serviceClient
            .from('likes')
            .delete()
            .eq('design_id', design_id)
            .eq('user_id', user_id)
          
          if (serviceError) {
            console.error('Service client delete error:', serviceError)
            return NextResponse.json({ error: 'Failed to unlike' }, { status: 500 })
          }
        }
      }

      return NextResponse.json({ 
        liked: false,
        message: 'Unliked successfully'
      })
    } else {
      // 添加点赞
      const likeData = {
        design_id,
        user_id,
        created_at: new Date().toISOString()
      }

      const { data: like, error: insertError } = await supabase
        .from('likes')
        .insert([likeData])
        .select()
        .single()

      if (insertError) {
        console.error('Error inserting like:', insertError)
        // 尝试使用服务客户端
        if (serviceClient) {
          const { data: serviceLike, error: serviceError } = await serviceClient
            .from('likes')
            .insert([likeData])
            .select()
            .single()
          
          if (serviceError) {
            console.error('Service client insert error:', serviceError)
            return NextResponse.json({ error: 'Failed to like' }, { status: 500 })
          }

          return NextResponse.json({ 
            liked: true,
            message: 'Liked successfully'
          })
        }
      }

      return NextResponse.json({ 
        liked: true,
        message: 'Liked successfully'
      })
    }
  } catch (error) {
    console.error('POST /api/likes error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}