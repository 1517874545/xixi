import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient, createServiceClient } from '@/lib/supabase-server'

// GET /api/tags - 获取标签列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'popular', 'search', 'all'
    const query = searchParams.get('query') // 搜索关键词
    const limit = parseInt(searchParams.get('limit') || '20')

    const supabase = createSupabaseClient()

    if (type === 'popular') {
      // 获取热门标签
      const { data: tags, error } = await supabase
        .from('tags')
        .select('id, name, usage_count')
        .gt('usage_count', 0)
        .order('usage_count', { ascending: false })
        .order('name', { ascending: true })
        .limit(limit)

      if (error) {
        console.error('Error fetching popular tags:', error)
        // 如果表不存在，返回空数组
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          return NextResponse.json({ tags: [] })
        }
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ tags: tags || [] })
    }

    if (type === 'search' && query) {
      // 搜索标签（自动补全）
      const { data: tags, error } = await supabase
        .from('tags')
        .select('id, name, usage_count')
        .ilike('name', `${query}%`)
        .order('usage_count', { ascending: false })
        .order('name', { ascending: true })
        .limit(limit)

      if (error) {
        console.error('Error searching tags:', error)
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          return NextResponse.json({ tags: [] })
        }
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ tags: tags || [] })
    }

    // 获取所有标签
    const { data: tags, error } = await supabase
      .from('tags')
      .select('id, name, usage_count')
      .order('name', { ascending: true })
      .limit(limit)

    if (error) {
      console.error('Error fetching tags:', error)
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json({ tags: [] })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ tags: tags || [] })
  } catch (error) {
    console.error('Tags API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/tags - 创建标签或为作品添加标签
export async function POST(request: NextRequest) {
  try {
    const { designId, tagNames } = await request.json()

    if (!designId || !tagNames || !Array.isArray(tagNames) || tagNames.length === 0) {
      return NextResponse.json(
        { error: '缺少必要参数：designId 和 tagNames' },
        { status: 400 }
      )
    }

    // 限制标签数量
    if (tagNames.length > 10) {
      return NextResponse.json(
        { error: '每个作品最多只能添加 10 个标签' },
        { status: 400 }
      )
    }

    // 验证标签名称
    for (const tagName of tagNames) {
      if (typeof tagName !== 'string' || tagName.trim().length === 0) {
        return NextResponse.json(
          { error: '标签名称不能为空' },
          { status: 400 }
        )
      }
      if (tagName.length > 50) {
        return NextResponse.json(
          { error: '标签名称不能超过 50 个字符' },
          { status: 400 }
        )
      }
    }

    const serviceClient = createServiceClient()
    const supabase = serviceClient || createSupabaseClient()

    // 清理标签名称
    const cleanedTagNames = tagNames.map(name => name.trim().toLowerCase())

    // 1. 为每个标签创建或获取标签ID
    const tagIds: string[] = []
    for (const tagName of cleanedTagNames) {
      // 检查标签是否已存在
      const { data: existingTag, error: searchError } = await supabase
        .from('tags')
        .select('id')
        .eq('name', tagName)
        .single()

      if (existingTag) {
        tagIds.push(existingTag.id)
      } else {
        // 创建新标签
        const { data: newTag, error: createError } = await supabase
          .from('tags')
          .insert({
            name: tagName,
            usage_count: 0
          })
          .select('id')
          .single()

        if (createError) {
          console.error('Error creating tag:', createError)
          // 如果是唯一约束冲突，尝试重新获取
          if (createError.code === '23505') {
            const { data: retryTag } = await supabase
              .from('tags')
              .select('id')
              .eq('name', tagName)
              .single()
            if (retryTag) {
              tagIds.push(retryTag.id)
              continue
            }
          }
          continue
        }

        if (newTag) {
          tagIds.push(newTag.id)
        }
      }
    }

    // 2. 删除作品的旧标签
    const { error: deleteError } = await supabase
      .from('design_tags')
      .delete()
      .eq('design_id', designId)

    if (deleteError && deleteError.code !== '42P01') {
      console.error('Error deleting old tags:', deleteError)
    }

    // 3. 为作品添加新标签
    if (tagIds.length > 0) {
      const designTags = tagIds.map(tagId => ({
        design_id: designId,
        tag_id: tagId
      }))

      const { error: insertError } = await supabase
        .from('design_tags')
        .insert(designTags)

      if (insertError) {
        console.error('Error inserting design tags:', insertError)
        // 如果表不存在
        if (insertError.code === '42P01' || insertError.message?.includes('does not exist')) {
          return NextResponse.json(
            { 
              error: '标签功能暂时不可用，请稍后再试',
              details: 'Tags tables do not exist'
            },
            { status: 503 }
          )
        }
        return NextResponse.json(
          { error: insertError.message || '添加标签失败' },
          { status: 500 }
        )
      }
    }

    // 4. 获取最终的标签列表
    const { data: finalTags, error: fetchError } = await supabase
      .from('design_tags')
      .select(`
        tag_id,
        tags (
          id,
          name
        )
      `)
      .eq('design_id', designId)

    if (fetchError) {
      console.error('Error fetching final tags:', fetchError)
    }

    const tags = finalTags?.map(dt => ({
      id: (dt.tags as any)?.id,
      name: (dt.tags as any)?.name
    })) || []

    return NextResponse.json({
      success: true,
      tags,
      message: '标签更新成功'
    })

  } catch (error) {
    console.error('Tags API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/tags - 删除作品的标签
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const designId = searchParams.get('designId')
    const tagId = searchParams.get('tagId')

    if (!designId) {
      return NextResponse.json(
        { error: '缺少必要参数：designId' },
        { status: 400 }
      )
    }

    const serviceClient = createServiceClient()
    const supabase = serviceClient || createSupabaseClient()

    if (tagId) {
      // 删除特定标签
      const { error } = await supabase
        .from('design_tags')
        .delete()
        .eq('design_id', designId)
        .eq('tag_id', tagId)

      if (error) {
        console.error('Error deleting tag:', error)
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          return NextResponse.json({ success: true })
        }
        return NextResponse.json(
          { error: error.message || '删除标签失败' },
          { status: 500 }
        )
      }
    } else {
      // 删除作品的所有标签
      const { error } = await supabase
        .from('design_tags')
        .delete()
        .eq('design_id', designId)

      if (error) {
        console.error('Error deleting all tags:', error)
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          return NextResponse.json({ success: true })
        }
        return NextResponse.json(
          { error: error.message || '删除标签失败' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Tags API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

