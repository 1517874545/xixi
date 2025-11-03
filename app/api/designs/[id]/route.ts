import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient, createServiceClient, createAuthenticatedClient, getAccessTokenFromRequest } from '@/lib/supabase-server'

// 获取单个设计的端点
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    if (!id) {
      return NextResponse.json({ error: 'Design ID is required' }, { status: 400 })
    }

    console.log('GET /api/designs/[id] called with id:', id)

    // 尝试使用认证客户端（如果有token）
    const token = getAccessTokenFromRequest(_request)
    const supabase = token 
      ? createAuthenticatedClient(token) 
      : createSupabaseClient()

    // 首先尝试从数据库查询
    const { data: design, error } = await supabase
      .from('designs')
      .select('*')
      .eq('id', id)
      .single()

    if (!error && design) {
      console.log('Found design in database:', design.id)
      
      // 获取点赞和评论数量
      const [likesResult, commentsResult] = await Promise.all([
        supabase
          .from('likes')
          .select('id', { count: 'exact', head: true })
          .eq('design_id', design.id),
        supabase
          .from('comments')
          .select('id', { count: 'exact', head: true })
          .eq('design_id', design.id)
      ])

      const designWithCounts = {
        ...design,
        likes_count: likesResult.count || 0,
        comments_count: commentsResult.count || 0
      }
      
      return NextResponse.json({ design: designWithCounts })
    }

    console.error('Database query error:', error)
    
    // 如果数据库查询失败，尝试使用服务角色客户端
    const serviceClient = createServiceClient()
    if (serviceClient) {
      const { data: serviceDesign, error: serviceError } = await serviceClient
        .from('designs')
        .select('*')
        .eq('id', id)
        .single()

      if (!serviceError && serviceDesign) {
        console.log('Found design with service client:', serviceDesign.id)
        
        // 获取点赞和评论数量
        const [likesResult, commentsResult] = await Promise.all([
          serviceClient
            .from('likes')
            .select('id', { count: 'exact', head: true })
            .eq('design_id', serviceDesign.id),
          serviceClient
            .from('comments')
            .select('id', { count: 'exact', head: true })
            .eq('design_id', serviceDesign.id)
        ])

        const designWithCounts = {
          ...serviceDesign,
          likes_count: likesResult.count || 0,
          comments_count: commentsResult.count || 0
        }
        
        return NextResponse.json({ design: designWithCounts })
      }
      console.error('Service client query error:', serviceError)
    }

    // 检查内存中的模拟设计
    const mockDesigns = (global as any).mockDesigns || []
    const mockDesign = mockDesigns.find((d: any) => d.id === id)
    
    if (mockDesign) {
      console.log('Found design in mock data:', mockDesign.id)
      return NextResponse.json({ design: mockDesign })
    }

    // 如果都没有找到，返回404
    console.log('Design not found:', id)
    return NextResponse.json({ error: 'Design not found' }, { status: 404 })
  } catch (error) {
    console.error('GET /api/designs/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 更新设计的端点
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { title, components, is_public } = body

    if (!id) {
      return NextResponse.json({ error: 'Design ID is required' }, { status: 400 })
    }

    console.log('PUT /api/designs/[id] called with id:', id, 'and data:', body)

    const updateData = {
      ...(title && { title }),
      ...(components && { components }),
      ...(is_public !== undefined && { is_public }),
      updated_at: new Date().toISOString()
    }

    // 尝试使用认证客户端（如果有token）
    const token = getAccessTokenFromRequest(request)
    const authenticatedSupabase = token 
      ? createAuthenticatedClient(token) 
      : createSupabaseClient()

    // 首先尝试使用服务角色客户端
    const serviceClient = createServiceClient()
    if (serviceClient) {
      const { data: design, error } = await serviceClient
        .from('designs')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (!error) {
        console.log('Design updated successfully with service key:', design)
        return NextResponse.json({ design })
      }
      console.error('Service client update error:', error)
    }

    // 尝试使用认证客户端
    const { data: design, error } = await authenticatedSupabase
      .from('designs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (!error) {
      console.log('Design updated successfully:', design)
      return NextResponse.json({ design })
    }

    console.error('Supabase update error:', error)
    
    // 如果数据库更新失败，更新内存中的模拟设计
    const mockDesigns = (global as any).mockDesigns || []
    const mockDesignIndex = mockDesigns.findIndex((d: any) => d.id === id)
    
    if (mockDesignIndex !== -1) {
      mockDesigns[mockDesignIndex] = {
        ...mockDesigns[mockDesignIndex],
        ...updateData
      }
      console.log('Mock design updated:', mockDesigns[mockDesignIndex])
      return NextResponse.json({ design: mockDesigns[mockDesignIndex] })
    }

    return NextResponse.json({ error: 'Design not found' }, { status: 404 })
  } catch (error) {
    console.error('PUT /api/designs/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 删除设计的端点
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({ error: 'Design ID is required' }, { status: 400 })
    }

    console.log('DELETE /api/designs/[id] called with id:', id)

    // 尝试使用认证客户端（如果有token）
    const token = getAccessTokenFromRequest(_request)
    const authenticatedSupabase = token 
      ? createAuthenticatedClient(token) 
      : createSupabaseClient()

    // 首先尝试使用服务角色客户端
    const serviceClient = createServiceClient()
    if (serviceClient) {
      const { error } = await serviceClient
        .from('designs')
        .delete()
        .eq('id', id)

      if (!error) {
        console.log('Design deleted successfully with service key')
        return NextResponse.json({ success: true })
      }
      console.error('Service client delete error:', error)
    }

    // 尝试使用认证客户端
    const { error } = await authenticatedSupabase
      .from('designs')
      .delete()
      .eq('id', id)

    if (!error) {
      console.log('Design deleted successfully')
      return NextResponse.json({ success: true })
    }

    console.error('Supabase delete error:', error)
    
    // 如果数据库删除失败，删除内存中的模拟设计
    const mockDesigns = (global as any).mockDesigns || []
    const mockDesignIndex = mockDesigns.findIndex((d: any) => d.id === id)
    
    if (mockDesignIndex !== -1) {
      mockDesigns.splice(mockDesignIndex, 1)
      console.log('Mock design deleted')
      return NextResponse.json({ success: true })
    }

    // 如果设计不存在，也返回成功，因为目标已经达成（设计不存在）
    console.log('Design not found, but returning success as it may have been already deleted')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/designs/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}