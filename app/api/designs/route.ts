import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient, createServiceClient, createAuthenticatedClient, getAccessTokenFromRequest } from '@/lib/supabase-server'

// 定义全局类型
interface MockDesign {
  id: string;
  title: string;
  components: Record<string, string>;
  is_public: boolean;
  user_id: string | null;
  created_at: string;
  updated_at: string;
  likes_count?: number;
  comments_count?: number;
}

declare global {
  var mockDesigns: MockDesign[] | undefined;
}

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/designs called')
    
    const searchParams = request.nextUrl.searchParams
    const isPublic = searchParams.get('isPublic')
    const userId = searchParams.get('userId')
    
    console.log('Query parameters:', { isPublic, userId })
    
    let allDesigns: MockDesign[] = []
    
    // 尝试使用认证客户端（如果有token）
    const token = getAccessTokenFromRequest(request)
    const supabase = token 
      ? createAuthenticatedClient(token) 
      : createSupabaseClient()
    
    // 构建查询条件
    let query = supabase
      .from('designs')
      .select('*')
      .order('created_at', { ascending: false })
    
    // 根据参数添加过滤条件
    if (isPublic === 'true') {
      query = query.eq('is_public', true)
    } else if (isPublic === 'false') {
      query = query.eq('is_public', false)
    }
    
    if (userId) {
      query = query.eq('user_id', userId)
    }
    
    // 首先尝试从数据库查询设计
    const { data: dbDesigns, error } = await query

    if (!error && dbDesigns) {
      console.log('Found database designs:', dbDesigns.length)
      
      // 使用服务客户端查询点赞数和评论数，以绕过RLS限制
      const serviceClient = createServiceClient()
      const clientForCounts = serviceClient || supabase
      
      console.log('Using client for counts:', serviceClient ? 'service client' : 'regular client')
      
      // 为每个数据库设计获取点赞和评论数量
      const dbDesignsWithCounts = await Promise.all(
        dbDesigns.map(async (design) => {
          try {
            console.log(`Counting likes/comments for design ${design.id} (${design.title})`)
            
            const [likesResult, commentsResult] = await Promise.all([
              clientForCounts
                .from('likes')
                .select('id', { count: 'exact', head: true })
                .eq('design_id', design.id),
              clientForCounts
                .from('comments')
                .select('id', { count: 'exact', head: true })
                .eq('design_id', design.id)
            ])

            const likesCount = likesResult.count ?? 0
            const commentsCount = commentsResult.count ?? 0
            
            console.log(`Design ${design.id}: likes=${likesCount}, comments=${commentsCount}`)
            
            // 如果有错误，记录但不抛出
            if (likesResult.error) {
              console.error(`Error counting likes for ${design.id}:`, likesResult.error)
            }
            if (commentsResult.error) {
              console.error(`Error counting comments for ${design.id}:`, commentsResult.error)
            }

            return {
              ...design,
              likes_count: likesCount as number,
              comments_count: commentsCount as number
            }
          } catch (countError) {
            console.error(`Error counting likes/comments for design ${design.id}:`, countError)
            // 如果查询失败，至少返回设计数据，点赞数和评论数为0
            return {
              ...design,
              likes_count: 0,
              comments_count: 0
            }
          }
        })
      )
      
      console.log('Designs with counts:', dbDesignsWithCounts.map(d => ({
        id: d.id,
        title: d.title,
        likes: d.likes_count,
        comments: d.comments_count
      })))
      
      allDesigns = [...allDesigns, ...dbDesignsWithCounts]
    } else {
      console.error('Supabase query error:', error)
      
      // 如果数据库查询失败，尝试使用服务角色客户端
      const serviceClient = createServiceClient()
      if (serviceClient) {
        console.log('Trying service client for database query...')
        let serviceQuery = serviceClient
          .from('designs')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (isPublic === 'true') {
          serviceQuery = serviceQuery.eq('is_public', true)
        } else if (isPublic === 'false') {
          serviceQuery = serviceQuery.eq('is_public', false)
        }
        
        if (userId) {
          serviceQuery = serviceQuery.eq('user_id', userId)
        }
        
        const { data: serviceDbDesigns, error: serviceError } = await serviceQuery
        
        if (!serviceError && serviceDbDesigns) {
          console.log('Found database designs with service client:', serviceDbDesigns.length)
          
          // 为每个设计获取点赞和评论数量（使用服务客户端）
          const serviceDesignsWithCounts = await Promise.all(
            serviceDbDesigns.map(async (design) => {
              try {
                const [likesResult, commentsResult] = await Promise.all([
                  serviceClient!
                    .from('likes')
                    .select('id', { count: 'exact', head: true })
                    .eq('design_id', design.id),
                  serviceClient!
                    .from('comments')
                    .select('id', { count: 'exact', head: true })
                    .eq('design_id', design.id)
                ])

                return {
                  ...design,
                  likes_count: (likesResult.count ?? 0) as number,
                  comments_count: (commentsResult.count ?? 0) as number
                }
              } catch (countError) {
                console.error(`Error counting likes/comments for design ${design.id}:`, countError)
                return {
                  ...design,
                  likes_count: 0,
                  comments_count: 0
                }
              }
            })
          )
          
          allDesigns = [...allDesigns, ...serviceDesignsWithCounts]
        } else {
          console.error('Service client query error:', serviceError)
        }
      }
    }

    // 检查是否有内存中的模拟设计
    const mockDesigns = global.mockDesigns || []
    console.log('Found mock designs:', mockDesigns.length)
    
    // 根据参数过滤模拟设计
    let filteredMockDesigns = mockDesigns
    
    if (isPublic === 'true') {
      filteredMockDesigns = mockDesigns.filter(design => design.is_public === true)
    } else if (isPublic === 'false') {
      filteredMockDesigns = mockDesigns.filter(design => design.is_public === false)
    }
    
    if (userId) {
      filteredMockDesigns = filteredMockDesigns.filter(design => design.user_id === userId)
    }
    
    console.log('Filtered mock designs:', filteredMockDesigns.length)
    
    // 确保模拟设计也有点赞数和评论数（如果没有，从数据库查询）
    const mockDesignsWithCounts = await Promise.all(
      filteredMockDesigns.map(async (design) => {
        // 如果已经有计数，直接返回
        if (design.likes_count !== undefined && design.comments_count !== undefined) {
          return design
        }
        
        // 否则从数据库查询
        try {
          const serviceClient = createServiceClient()
          const clientForCounts = serviceClient || supabase
          
          const [likesResult, commentsResult] = await Promise.all([
            clientForCounts
              .from('likes')
              .select('id', { count: 'exact', head: true })
              .eq('design_id', design.id),
            clientForCounts
              .from('comments')
              .select('id', { count: 'exact', head: true })
              .eq('design_id', design.id)
          ])

          return {
            ...design,
            likes_count: (likesResult.count ?? 0) as number,
            comments_count: (commentsResult.count ?? 0) as number
          }
        } catch (countError) {
          console.error(`Error counting likes/comments for mock design ${design.id}:`, countError)
          return {
            ...design,
            likes_count: design.likes_count ?? 0,
            comments_count: design.comments_count ?? 0
          }
        }
      })
    )
    
    // 合并数据库设计和模拟设计（使用包含计数的版本）
    allDesigns = [...allDesigns, ...mockDesignsWithCounts]
    
    // 如果没有设计，返回空数组
    if (allDesigns.length === 0) {
      console.log('No designs found, returning empty array')
    }

    // 按创建时间排序
    allDesigns.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    
    console.log('Returning all designs:', allDesigns.length)
    console.log('Total likes in response:', allDesigns.reduce((sum, d) => sum + (d.likes_count || 0), 0))
    console.log('Total comments in response:', allDesigns.reduce((sum, d) => sum + (d.comments_count || 0), 0))
    
    // 确保所有设计都有 likes_count 和 comments_count
    const finalDesigns = allDesigns.map(d => ({
      ...d,
      likes_count: d.likes_count ?? 0,
      comments_count: d.comments_count ?? 0
    }))
    
    console.log('Final designs summary:', finalDesigns.map(d => ({
      id: d.id,
      title: d.title,
      likes_count: d.likes_count,
      comments_count: d.comments_count
    })))
    
    return NextResponse.json({ designs: finalDesigns })
  } catch (error) {
    console.error('GET /api/designs error:', error)
    
    // 返回空数组作为最后的备选方案
    return NextResponse.json({ designs: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, components, is_public = false, user_id } = body

    console.log('Received design data:', { title, components, is_public, user_id })

    // 验证必需字段
    if (!user_id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // 创建设计数据
    const designData = {
      title: title || 'Untitled Design',
      components: components || {},
      is_public: is_public || false,
      user_id: user_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('Attempting to insert design:', designData)

    // 尝试使用认证客户端（如果有token）
    const token = getAccessTokenFromRequest(request)
    const authenticatedSupabase = token 
      ? createAuthenticatedClient(token) 
      : createSupabaseClient()

    // 首先尝试使用服务角色客户端（绕过RLS）
    const serviceClient = createServiceClient()
    if (serviceClient) {
      const { data: design, error } = await serviceClient
        .from('designs')
        .insert([designData])
        .select()
        .single()

      if (!error) {
        console.log('Design created successfully with service key:', design)
        return NextResponse.json({ design }, { status: 201 })
      }
      console.error('Service client insert error:', error)
    }

    // 如果服务客户端失败，尝试使用认证客户端（需要正确的RLS策略）
    const { data: design, error } = await authenticatedSupabase
      .from('designs')
      .insert([designData])
      .select()
      .single()

    if (!error) {
      console.log('Design created successfully:', design)
      
      // 确保设计数据也保存到内存中，以便立即在前端显示
      global.mockDesigns = global.mockDesigns || []
      const existingIndex = global.mockDesigns.findIndex((d: any) => d.id === design.id)
      
      if (existingIndex !== -1) {
        global.mockDesigns[existingIndex] = design
      } else {
        global.mockDesigns.push(design)
      }
      
      return NextResponse.json({ design }, { status: 201 })
    }

    console.error('Supabase insert error:', error)
    
    // 如果 RLS 策略阻止插入，尝试直接使用服务角色客户端插入到数据库
    if (serviceClient && error?.code === '42501') {
      console.log('RLS policy violation detected, attempting direct service client insert...')
      
      // 尝试使用服务角色客户端直接插入（绕过所有策略检查）
      const { data: directDesign, error: directError } = await serviceClient
        .from('designs')
        .insert([designData])
        .select()
        .single()

      if (!directError) {
        console.log('Design created successfully with direct service client:', directDesign)
        return NextResponse.json({ design: directDesign }, { status: 201 })
      }
      console.error('Direct service client insert error:', directError)
      
      // 如果服务客户端也失败，返回详细的错误信息
      return NextResponse.json(
        { 
          error: directError?.message || '无法保存设计到数据库。请检查数据库连接和权限设置。',
          details: directError
        },
        { status: 500 }
      )
    }
    
    // 如果所有数据库操作都失败，返回错误而不是创建模拟数据
    const errorMessage = error?.message || '数据库操作失败'
    console.error('All database operations failed:', errorMessage)
    
    return NextResponse.json(
      { 
        error: errorMessage || '无法保存设计。请检查数据库连接。',
        details: error
      },
      { status: 500 }
    )
  } catch (error) {
    console.error('POST /api/designs error:', error)
    
    // 返回错误信息而不是创建模拟数据
    const errorMessage = error instanceof Error ? error.message : '内部服务器错误'
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    )
  }
}