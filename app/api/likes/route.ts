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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { design_id } = body

    // TODO: Implement proper authentication
    // For now, simulate like functionality without user tracking
    return NextResponse.json({ 
      liked: true,
      message: 'Like functionality will be available after authentication implementation'
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const designId = searchParams.get('designId')
    const userId = searchParams.get('userId')

    if (userId) {
      // 对于匿名用户，返回空数组（因为没有用户认证）
      // 在实际应用中，这里应该使用真实的用户ID
      return NextResponse.json({ likedDesigns: [] })
    }

    if (designId) {
      // Check if design exists and return basic like info
      const { data: design } = await supabase
        .from('designs')
        .select('id')
        .eq('id', designId)
        .single()

      if (design) {
        // Return false for now since we don't have user tracking
        return NextResponse.json({ liked: false })
      } else {
        return NextResponse.json({ error: 'Design not found' }, { status: 404 })
      }
    }

    return NextResponse.json({ error: 'designId or userId parameter is required' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}