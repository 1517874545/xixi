import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 安全地获取环境变量
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase environment variables are missing')
  // 在构建时返回一个安全的客户端
}

const supabase = createClient(
  supabaseUrl || 'https://example.supabase.co',
  supabaseKey || 'example-key'
)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const designId = searchParams.get('designId')
    const userId = searchParams.get('userId')

    if (userId) {
      // 模拟用户喜欢的作品数据
      // 在实际应用中，这里应该查询数据库
      const mockLikedDesigns = ["design1", "design2", "design3"] // 模拟用户喜欢的作品ID
      return NextResponse.json({ likedDesigns: mockLikedDesigns })
    }

    if (designId) {
      // 模拟检查用户是否喜欢该作品
      // 在实际应用中，这里应该查询数据库
      const mockLiked = Math.random() > 0.5 // 随机返回true或false
      return NextResponse.json({ liked: mockLiked })
    }

    // 如果既没有userId也没有designId，返回错误
    return NextResponse.json({ error: 'designId or userId parameter is required' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { design_id } = body

    if (!design_id) {
      return NextResponse.json({ error: 'design_id is required' }, { status: 400 })
    }

    // 模拟点赞/取消点赞操作
    // 在实际应用中，这里应该操作数据库
    const mockLiked = Math.random() > 0.5 // 随机返回true或false
    
    return NextResponse.json({ 
      liked: mockLiked,
      message: mockLiked ? 'Liked successfully' : 'Unliked successfully'
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}