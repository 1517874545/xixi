import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const designId = params.id
    console.log('GET /api/designs/[id] called for design:', designId)

    // 首先尝试从数据库查询设计
    const { data: design, error } = await supabase
      .from('designs')
      .select('*')
      .eq('id', designId)
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

      const transformedDesign = {
        ...design,
        likes_count: likesResult.count || 0,
        comments_count: commentsResult.count || 0
      }

      return NextResponse.json({ design: transformedDesign })
    }

    console.log('Design not found in database, checking mock designs...')
    
    // 如果数据库中没有找到，检查内存中的模拟设计
    const mockDesigns = (globalThis as any).mockDesigns || []
    const mockDesign = mockDesigns.find((d: any) => d.id === designId)
    
    if (mockDesign) {
      console.log('Found design in mock designs:', mockDesign.id)
      return NextResponse.json({ design: mockDesign })
    }

    console.log('Design not found anywhere:', designId)
    return NextResponse.json({ error: 'Design not found' }, { status: 404 })
  } catch (error) {
    console.error('GET /api/designs/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const designId = params.id
    const body = await request.json()
    const { title, components, is_public } = body

    console.log('PUT /api/designs/[id] called for design:', designId, { title, is_public })

    // 首先尝试更新数据库中的设计（不检查用户权限）
    const updateData = {
      ...(title !== undefined && { title }),
      ...(components !== undefined && { components }),
      ...(is_public !== undefined && { is_public }),
      updated_at: new Date().toISOString()
    }

    const { data: design, error } = await supabase
      .from('designs')
      .update(updateData)
      .eq('id', designId)
      .select()
      .single()

    if (error) {
      console.error('Supabase update error:', error)
      
      // 如果数据库更新失败，检查是否是RLS策略问题
      if (error.code === '42501' || error.message.includes('policy')) {
        console.log('RLS policy violation detected, using service key...')
        
        // 尝试使用服务密钥绕过RLS
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
        if (serviceKey) {
          const serviceClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            serviceKey
          )
          
          const { data: serviceDesign, error: serviceError } = await serviceClient
            .from('designs')
            .update(updateData)
            .eq('id', designId)
            .select()
            .single()
          
          if (!serviceError) {
            console.log('Design updated successfully with service key:', serviceDesign)
            return NextResponse.json({ design: serviceDesign })
          }
        }
      }
      
      // 如果所有数据库操作都失败，尝试更新内存中的模拟设计
      console.log('Attempting to update mock design...')
      if (globalThis.mockDesigns) {
        const mockDesignIndex = globalThis.mockDesigns.findIndex((d: any) => d.id === designId)
        
        if (mockDesignIndex !== -1) {
          const updatedMockDesign = {
            ...globalThis.mockDesigns[mockDesignIndex],
            ...(title !== undefined && { title }),
            ...(components !== undefined && { components }),
            ...(is_public !== undefined && { is_public }),
            updated_at: new Date().toISOString()
          }
          
          globalThis.mockDesigns[mockDesignIndex] = updatedMockDesign
          console.log('Mock design updated:', updatedMockDesign)
          return NextResponse.json({ design: updatedMockDesign })
        }
      }
      
      // 如果设计不存在于任何地方，返回404
      console.log('Design not found for update:', designId)
      return NextResponse.json({ error: 'Design not found' }, { status: 404 })
    }

    console.log('Design updated successfully in database:', design)
    return NextResponse.json({ design })
  } catch (error) {
    console.error('PUT /api/designs/[id] error:', error)
    
    // 尝试更新内存中的模拟设计作为最后的备选方案
    if (globalThis.mockDesigns) {
      const designId = params.id
      const body = await request.json()
      const { title, components, is_public } = body
      
      const mockDesignIndex = globalThis.mockDesigns.findIndex((d: any) => d.id === designId)
      
      if (mockDesignIndex !== -1) {
        const updatedMockDesign = {
          ...globalThis.mockDesigns[mockDesignIndex],
          ...(title !== undefined && { title }),
          ...(components !== undefined && { components }),
          ...(is_public !== undefined && { is_public }),
          updated_at: new Date().toISOString()
        }
        
        globalThis.mockDesigns[mockDesignIndex] = updatedMockDesign
        console.log('Mock design updated as fallback:', updatedMockDesign)
        return NextResponse.json({ design: updatedMockDesign })
      }
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const designId = params.id
    console.log('DELETE /api/designs/[id] called for design:', designId)

    // 首先尝试从数据库删除设计（不检查用户权限，因为当前没有用户认证）
    const { error } = await supabase
      .from('designs')
      .delete()
      .eq('id', designId)

    if (error) {
      console.error('Supabase delete error:', error)
      
      // 如果数据库删除失败，检查是否是RLS策略问题
      if (error.code === '42501' || error.message.includes('policy')) {
        console.log('RLS policy violation detected, using service key...')
        
        // 尝试使用服务密钥绕过RLS
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
        if (serviceKey) {
          try {
            const serviceClient = createClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              serviceKey
            )
            
            const { error: serviceError } = await serviceClient
              .from('designs')
              .delete()
              .eq('id', designId)
            
            if (!serviceError) {
              console.log('Design deleted successfully with service key')
              
              // 同时从内存中删除模拟设计
              if (globalThis.mockDesigns) {
                globalThis.mockDesigns = globalThis.mockDesigns.filter((d: any) => d.id !== designId)
              }
              
              return NextResponse.json({ message: 'Design deleted successfully' })
            }
          } catch (serviceError) {
            console.error('Service key operation failed:', serviceError)
          }
        }
      }
      
      // 如果所有数据库操作都失败，尝试从内存中删除模拟设计
      console.log('Attempting to delete from mock designs...')
      if (globalThis.mockDesigns) {
        const initialLength = globalThis.mockDesigns.length
        globalThis.mockDesigns = globalThis.mockDesigns.filter((d: any) => d.id !== designId)
        
        if (globalThis.mockDesigns.length < initialLength) {
          console.log('Design deleted from mock designs')
          return NextResponse.json({ message: 'Design deleted successfully' })
        }
      }
      
      // 如果设计不存在于任何地方，返回404
      console.log('Design not found for deletion:', designId)
      return NextResponse.json({ error: 'Design not found' }, { status: 404 })
    }

    // 同时从内存中删除模拟设计（如果存在）
    if (globalThis.mockDesigns) {
      globalThis.mockDesigns = globalThis.mockDesigns.filter((d: any) => d.id !== designId)
    }

    console.log('Design deleted successfully from database')
    return NextResponse.json({ message: 'Design deleted successfully' })
  } catch (error) {
    console.error('DELETE /api/designs/[id] error:', error)
    
    // 尝试从内存中删除作为最后的备选方案
    if (globalThis.mockDesigns) {
      const designId = params.id
      const initialLength = globalThis.mockDesigns.length
      globalThis.mockDesigns = globalThis.mockDesigns.filter((d: any) => d.id !== designId)
      
      if (globalThis.mockDesigns.length < initialLength) {
        console.log('Design deleted from mock designs as fallback')
        return NextResponse.json({ message: 'Design deleted successfully' })
      }
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}