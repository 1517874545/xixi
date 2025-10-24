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

export async function GET() {
  try {
    const { data: components, error } = await supabase
      .from('components')
      .select('*')
      .order('type')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ components })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}