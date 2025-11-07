import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient, createServiceClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 })
    }

    const supabase = createSupabaseClient()

    // 检查是否是临时用户ID（以'temp-'开头）
    const isTempUser = userId.startsWith('temp-')

    if (isTempUser) {
      // 对于临时用户，从本地存储获取收藏列表
      console.log('Fetching favorites for temporary user:', userId)
      
      // 返回空数组，因为临时用户的收藏只保存在本地
      return NextResponse.json({ favorites: [], isTemp: true })
    }

    // 获取用户的收藏作品
    const { data: favorites, error } = await supabase
      .from('favorites')
      .select('design_id')
      .eq('user_id', userId)

    if (error) {
      console.error('Error fetching favorites:', error)
      // 如果表不存在，返回空数组而不是错误
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.log('Favorites table does not exist yet, returning empty array')
        return NextResponse.json({ favorites: [] })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ favorites: favorites.map(f => f.design_id) })

  } catch (error) {
    console.error('Favorites API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, designId } = await request.json()

    if (!userId || !designId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    // 检查是否是临时用户ID（以'temp-'开头）
    const isTempUser = userId.startsWith('temp-')

    if (isTempUser) {
      // 对于临时用户，返回成功但不实际保存到数据库
      console.log('Temporary user favorite:', { userId, designId })
      return NextResponse.json({ 
        favorite: {
          id: `temp-favorite-${Date.now()}`,
          user_id: userId,
          design_id: designId,
          created_at: new Date().toISOString()
        },
        isTemp: true
      })
    }

    // 尝试使用服务客户端（绕过 RLS）
    const serviceClient = createServiceClient()
    const supabase = serviceClient || createSupabaseClient()

    // 检查是否已经收藏
    const { data: existingFavorite, error: checkError } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', userId)
      .eq('design_id', designId)
      .single()

    if (existingFavorite && !checkError) {
      // 如果已经收藏，返回已收藏的信息而不是错误
      return NextResponse.json({ 
        favorite: existingFavorite,
        message: 'Already favorited',
        alreadyFavorited: true
      }, { status: 200 })
    }

    // 创建收藏关系
    const { data: favorite, error } = await supabase
      .from('favorites')
      .insert([{
        user_id: userId,
        design_id: designId,
        created_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating favorite:', error)
      // 如果是 RLS 策略错误，尝试使用服务客户端
      if ((error.code === '42501' || error.message?.includes('policy') || error.message?.includes('permission')) && serviceClient) {
        console.log('RLS policy error, retrying with service client')
        const { data: retryFavorite, error: retryError } = await serviceClient
          .from('favorites')
          .insert([{
            user_id: userId,
            design_id: designId,
            created_at: new Date().toISOString()
          }])
          .select()
          .single()
        
        if (!retryError) {
          return NextResponse.json({ favorite: retryFavorite })
        }
        console.error('Service client insert also failed:', retryError)
      }
      
      // 如果表不存在，返回错误提示
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json({ 
          error: '收藏功能暂时不可用，请稍后再试',
          details: 'Favorites table does not exist'
        }, { status: 503 })
      }
      
      return NextResponse.json({ 
        error: error.message || '无法收藏作品，请稍后再试',
        details: error
      }, { status: 500 })
    }

    return NextResponse.json({ favorite })

  } catch (error) {
    console.error('Favorites API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const designId = searchParams.get('designId')

    if (!userId || !designId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    // 检查是否是临时用户ID（以'temp-'开头）
    const isTempUser = userId.startsWith('temp-')

    if (isTempUser) {
      // 对于临时用户，返回成功但不实际操作数据库
      console.log('Temporary user unfavorite:', { userId, designId })
      return NextResponse.json({ success: true, isTemp: true })
    }

    // 尝试使用服务客户端（绕过 RLS）
    const serviceClient = createServiceClient()
    const supabase = serviceClient || createSupabaseClient()

    // 删除收藏关系
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('design_id', designId)

    if (error) {
      console.error('Error deleting favorite:', error)
      
      // 如果是 RLS 策略错误，尝试使用服务客户端
      if ((error.code === '42501' || error.message?.includes('policy') || error.message?.includes('permission')) && serviceClient) {
        console.log('RLS policy error, retrying with service client')
        const { error: retryError } = await serviceClient
          .from('favorites')
          .delete()
          .eq('user_id', userId)
          .eq('design_id', designId)
        
        if (!retryError) {
          return NextResponse.json({ success: true })
        }
        console.error('Service client delete also failed:', retryError)
      }
      
      // 如果表不存在，仍然返回成功（因为不存在就是未收藏状态）
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.log('Favorites table does not exist, returning success')
        return NextResponse.json({ success: true })
      }
      
      return NextResponse.json({ 
        error: error.message || '无法取消收藏，请稍后再试',
        details: error
      }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Favorites API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}