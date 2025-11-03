import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient, createServiceClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const followerId = searchParams.get('followerId')

    // 使用服务客户端绕过RLS限制
    const supabase = createSupabaseClient()
    const serviceClient = createServiceClient()
    const clientToUse = serviceClient || supabase

    if (followerId) {
      // 获取用户关注的人（查询 follower_id = followerId 的记录，返回 following_id）
      const { data: follows, error } = await clientToUse
        .from('follows')
        .select('following_id')
        .eq('follower_id', followerId)

      if (error) {
        console.error('Error fetching follows:', error)
        
        // 如果使用匿名客户端失败，尝试使用服务客户端
        if (serviceClient && clientToUse === supabase) {
          console.log('Retrying GET follows with service client...')
          const { data: retryFollows, error: retryError } = await serviceClient
            .from('follows')
            .select('following_id')
            .eq('follower_id', followerId)
          
          if (retryError) {
            return NextResponse.json({ error: retryError.message }, { status: 500 })
          }
          
          return NextResponse.json({ follows: retryFollows?.map(f => f.following_id) || [] })
        }
        
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ follows: follows?.map(f => f.following_id) || [] })
    }

    if (userId) {
      // 获取用户的粉丝（查询 following_id = userId 的记录，返回 follower_id）
      const { data: followers, error } = await clientToUse
        .from('follows')
        .select('follower_id')
        .eq('following_id', userId)

      if (error) {
        console.error('Error fetching followers:', error)
        
        // 如果使用匿名客户端失败，尝试使用服务客户端
        if (serviceClient && clientToUse === supabase) {
          console.log('Retrying GET followers with service client...')
          const { data: retryFollowers, error: retryError } = await serviceClient
            .from('follows')
            .select('follower_id')
            .eq('following_id', userId)
          
          if (retryError) {
            return NextResponse.json({ error: retryError.message }, { status: 500 })
          }
          
          return NextResponse.json({ followers: retryFollowers?.map(f => f.follower_id) || [] })
        }
        
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ followers: followers?.map(f => f.follower_id) || [] })
    }

    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })

  } catch (error) {
    console.error('Follows API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { followerId, followedId } = await request.json()

    if (!followerId || !followedId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    if (followerId === followedId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })
    }

    // 使用服务客户端绕过RLS限制
    const supabase = createSupabaseClient()
    const serviceClient = createServiceClient()
    const clientToUse = serviceClient || supabase

    // 检查是否已经关注（使用 following_id，与数据库表结构一致）
    const { data: existingFollow, error: checkError } = await clientToUse
      .from('follows')
      .select('*')
      .eq('follower_id', followerId)
      .eq('following_id', followedId)
      .maybeSingle()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 是"未找到记录"，这是正常的
      console.error('Error checking existing follow:', checkError)
      
      // 如果使用匿名客户端失败，尝试使用服务客户端
      if (serviceClient && clientToUse === supabase) {
        console.log('Retrying with service client...')
        const { data: retryFollow, error: retryError } = await serviceClient
          .from('follows')
          .select('*')
          .eq('follower_id', followerId)
          .eq('following_id', followedId)
          .maybeSingle()
        
        if (retryError && retryError.code !== 'PGRST116') {
          return NextResponse.json({ error: retryError.message }, { status: 500 })
        }
        
        if (retryFollow) {
          return NextResponse.json({ error: 'Already following' }, { status: 400 })
        }
      } else {
        return NextResponse.json({ error: checkError.message }, { status: 500 })
      }
    }

    if (existingFollow) {
      return NextResponse.json({ error: 'Already following' }, { status: 400 })
    }

    // 创建关注关系（使用 following_id）
    const { data: follow, error } = await clientToUse
      .from('follows')
      .insert([{
        follower_id: followerId,
        following_id: followedId,
        created_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating follow:', error)
      
      // 如果使用匿名客户端失败，尝试使用服务客户端
      if (serviceClient && clientToUse === supabase) {
        console.log('Retrying insert with service client...')
        const { data: retryFollow, error: retryError } = await serviceClient
          .from('follows')
          .insert([{
            follower_id: followerId,
            following_id: followedId,
            created_at: new Date().toISOString()
          }])
          .select()
          .single()
        
        if (retryError) {
          console.error('Retry insert also failed:', retryError)
          return NextResponse.json({ error: retryError.message }, { status: 500 })
        }
        
        return NextResponse.json({ follow: retryFollow })
      }
      
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ follow })

  } catch (error) {
    console.error('Follows API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const followerId = searchParams.get('followerId')
    const followedId = searchParams.get('followedId')

    if (!followerId || !followedId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    // 使用服务客户端绕过RLS限制
    const supabase = createSupabaseClient()
    const serviceClient = createServiceClient()
    const clientToUse = serviceClient || supabase

    // 删除关注关系（使用 following_id）
    const { error } = await clientToUse
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followedId)

    if (error) {
      console.error('Error deleting follow:', error)
      
      // 如果使用匿名客户端失败，尝试使用服务客户端
      if (serviceClient && clientToUse === supabase) {
        console.log('Retrying delete with service client...')
        const { error: retryError } = await serviceClient
          .from('follows')
          .delete()
          .eq('follower_id', followerId)
          .eq('following_id', followedId)
        
        if (retryError) {
          console.error('Retry delete also failed:', retryError)
          return NextResponse.json({ error: retryError.message }, { status: 500 })
        }
        
        return NextResponse.json({ success: true })
      }
      
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Follows API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}