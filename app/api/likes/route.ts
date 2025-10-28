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
  supabaseKey || 'example-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
)

// 创建服务角色客户端用于绕过RLS（在认证失败时使用）
const serviceClient = serviceKey ? createClient(
  supabaseUrl || 'https://example.supabase.co', 
  serviceKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
) : null

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const designId = searchParams.get('designId')
    const userId = searchParams.get('userId')

    if (designId && userId) {
      // 检查用户是否喜欢该作品
      console.log('Checking like status for:', { designId, userId })
      
      // 确保用户ID格式正确
      const cleanUserId = userId.trim().replace(/^"|"$/g, '')
      console.log('Cleaned user_id for GET:', cleanUserId)
      
      // 使用服务角色客户端绕过RLS限制
      const clientToUse = serviceClient || supabase
      
      const { data: likes, error } = await clientToUse
        .from('likes')
        .select('id')
        .eq('design_id', designId)
        .eq('user_id', cleanUserId)

      if (error) {
        console.error('Error checking like status:', error)
        console.error('Check error details:', JSON.stringify(error))
        
        // 如果使用匿名客户端失败，尝试使用服务角色客户端
        if (serviceClient && clientToUse === supabase) {
          console.log('Retrying with service client...')
          const { data: retryLikes, error: retryError } = await serviceClient
            .from('likes')
            .select('id')
            .eq('design_id', designId)
            .eq('user_id', cleanUserId)
            
          if (retryError) {
            console.error('Retry also failed:', retryError)
            return NextResponse.json({ liked: false })
          }
          
          const liked = retryLikes && retryLikes.length > 0
          console.log('Retry successful, like status result:', { liked, likesCount: retryLikes?.length })
          return NextResponse.json({ liked })
        }
        
        return NextResponse.json({ liked: false })
      }

      const liked = likes && likes.length > 0
      console.log('Like status result:', { liked, likesCount: likes?.length })
      return NextResponse.json({ liked })
    } else if (userId) {
      // 查询用户喜欢的作品
      console.log('Fetching user likes for:', { userId })
      
      // 确保用户ID格式正确
      const cleanUserId = userId.trim().replace(/^"|"$/g, '')
      
      // 使用服务角色客户端绕过RLS限制
      const clientToUse = serviceClient || supabase
      
      const { data: likes, error } = await clientToUse
        .from('likes')
        .select('design_id')
        .eq('user_id', cleanUserId)

      if (error) {
        console.error('Error fetching user likes:', error)
        
        // 如果使用匿名客户端失败，尝试使用服务角色客户端
        if (serviceClient && clientToUse === supabase) {
          console.log('Retrying with service client...')
          const { data: retryLikes, error: retryError } = await serviceClient
            .from('likes')
            .select('design_id')
            .eq('user_id', cleanUserId)
            
          if (retryError) {
            console.error('Retry also failed:', retryError)
            return NextResponse.json({ likedDesigns: [] })
          }
          
          const likedDesigns = retryLikes?.map(like => like.design_id) || []
          console.log('Retry successful, user likes count:', likedDesigns.length)
          return NextResponse.json({ likedDesigns })
        }
        
        // 返回空数组作为备选方案
        return NextResponse.json({ likedDesigns: [] })
      }

      const likedDesigns = likes?.map(like => like.design_id) || []
      return NextResponse.json({ likedDesigns })
    } else if (designId) {
      // 如果没有用户ID，返回false
      console.log('No user ID provided, returning false for design:', designId)
      return NextResponse.json({ liked: false })
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

    console.log('Received like request:', { design_id, user_id })

    if (!design_id || !user_id) {
      return NextResponse.json({ error: 'design_id and user_id are required' }, { status: 400 })
    }

    // 首先检查是否已经点赞
    console.log('Checking existing like for:', { design_id, user_id })
    
    // 确保用户ID格式正确
    const cleanUserId = user_id.trim().replace(/^"|"$/g, '')
    console.log('Cleaned user_id:', cleanUserId)
    
    // 使用服务角色客户端绕过RLS限制
    const clientToUse = serviceClient || supabase
    
    const { data: existingLike, error: checkError } = await clientToUse
      .from('likes')
      .select('id')
      .eq('design_id', design_id)
      .eq('user_id', cleanUserId)

    if (checkError) {
      console.error('Error checking existing like:', checkError)
      console.error('Check error details:', JSON.stringify(checkError))
      
      // 如果使用匿名客户端失败，尝试使用服务角色客户端
      if (serviceClient && clientToUse === supabase) {
        console.log('Retrying with service client...')
        const { data: retryLike, error: retryError } = await serviceClient
          .from('likes')
          .select('id')
          .eq('design_id', design_id)
          .eq('user_id', cleanUserId)
          
        if (retryError) {
          console.error('Retry also failed:', retryError)
          return NextResponse.json({ error: 'Failed to check like status' }, { status: 500 })
        }
        
        console.log('Retry successful, existing like result:', retryLike)
        
        if (retryLike && retryLike.length > 0) {
          // 取消点赞
          const { error: deleteError } = await serviceClient
            .from('likes')
            .delete()
            .eq('design_id', design_id)
            .eq('user_id', cleanUserId)

          if (deleteError) {
            console.error('Error deleting like:', deleteError)
            return NextResponse.json({ error: 'Failed to unlike' }, { status: 500 })
          }

          console.log('Unlike successful')
          return NextResponse.json({ 
            liked: false,
            message: 'Unliked successfully'
          })
        } else {
          // 添加点赞
          const likeData = {
            design_id,
            user_id: cleanUserId,
            created_at: new Date().toISOString()
          }

          const { data: like, error: insertError } = await serviceClient
            .from('likes')
            .insert([likeData])
            .select()
            .single()

          if (insertError) {
            console.error('Error inserting like:', insertError)
            return NextResponse.json({ error: 'Failed to like' }, { status: 500 })
          }

          console.log('Like successful')
          return NextResponse.json({ 
            liked: true,
            message: 'Liked successfully'
          })
        }
      }
      
      return NextResponse.json({ error: 'Failed to check like status' }, { status: 500 })
    }
    
    console.log('Existing like result:', existingLike)

    if (existingLike && existingLike.length > 0) {
      console.log('Found existing like, attempting to unlike')
      
      // 取消点赞
      const { error: deleteError } = await clientToUse
        .from('likes')
        .delete()
        .eq('design_id', design_id)
        .eq('user_id', cleanUserId)

      if (deleteError) {
        console.error('Error deleting like:', deleteError)
        
        // 如果删除失败，尝试使用服务角色客户端
        if (serviceClient && clientToUse === supabase) {
          console.log('Retrying delete with service client...')
          const { error: retryDeleteError } = await serviceClient
            .from('likes')
            .delete()
            .eq('design_id', design_id)
            .eq('user_id', cleanUserId)
            
          if (retryDeleteError) {
            console.error('Retry delete also failed:', retryDeleteError)
            return NextResponse.json({ error: 'Failed to unlike' }, { status: 500 })
          }
          
          console.log('Retry delete successful')
          return NextResponse.json({ 
            liked: false,
            message: 'Unliked successfully'
          })
        }
        
        return NextResponse.json({ error: 'Failed to unlike' }, { status: 500 })
      }

      console.log('Unlike successful')
      return NextResponse.json({ 
        liked: false,
        message: 'Unliked successfully'
      })
    } else {
      console.log('No existing like, attempting to like')
      
      // 添加点赞
      const likeData = {
        design_id,
        user_id: cleanUserId,
        created_at: new Date().toISOString()
      }

      const { data: like, error: insertError } = await clientToUse
        .from('likes')
        .insert([likeData])
        .select()
        .single()

      if (insertError) {
        console.error('Error inserting like:', insertError)
        
        // 如果插入失败，尝试使用服务角色客户端
        if (serviceClient && clientToUse === supabase) {
          console.log('Retrying insert with service client...')
          const { data: retryLike, error: retryInsertError } = await serviceClient
            .from('likes')
            .insert([likeData])
            .select()
            .single()
            
          if (retryInsertError) {
            console.error('Retry insert also failed:', retryInsertError)
            return NextResponse.json({ error: 'Failed to like' }, { status: 500 })
          }
          
          console.log('Retry insert successful')
          return NextResponse.json({ 
            liked: true,
            message: 'Liked successfully'
          })
        }
        
        return NextResponse.json({ error: 'Failed to like' }, { status: 500 })
      }

      console.log('Like successful')
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