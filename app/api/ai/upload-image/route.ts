import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, userId, designId } = await request.json()

    if (!imageUrl) {
      return NextResponse.json(
        { error: '图片URL不能为空' },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: '用户ID不能为空' },
        { status: 400 }
      )
    }

    console.log('Downloading image from URL:', imageUrl)

    // 从豆包AI的URL下载图片
    const imageResponse = await fetch(imageUrl, {
      signal: AbortSignal.timeout(30000), // 30秒超时
    })

    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.status}`)
    }

    const imageBuffer = await imageResponse.arrayBuffer()
    const imageBlob = new Blob([imageBuffer])
    
    // 从URL推断文件扩展名
    const urlPath = new URL(imageUrl).pathname
    const extension = urlPath.match(/\.(jpg|jpeg|png|webp)$/i)?.[1] || 'jpg'
    const fileName = designId 
      ? `ai-designs/${userId}/${designId}.${extension}`
      : `ai-designs/${userId}/${Date.now()}.${extension}`

    // 上传到Supabase Storage
    const supabase = createServiceClient()
    if (!supabase) {
      throw new Error('Supabase service client not available')
    }

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('designs') // 假设有一个'designs'存储桶，如果没有需要创建
      .upload(fileName, imageBlob, {
        contentType: `image/${extension === 'jpg' ? 'jpeg' : extension}`,
        upsert: true,
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      
      // 如果存储桶不存在，返回原始URL
      if (uploadError.message?.includes('bucket') || uploadError.message?.includes('not found')) {
        console.warn('Storage bucket not found, returning original URL')
        return NextResponse.json({
          url: imageUrl,
          path: null,
          message: '使用原始URL（存储桶未配置）'
        })
      }

      throw uploadError
    }

    // 获取公开URL
    const { data: { publicUrl } } = supabase.storage
      .from('designs')
      .getPublicUrl(fileName)

    console.log('Image uploaded successfully:', publicUrl)

    return NextResponse.json({
      url: publicUrl || imageUrl,
      path: fileName,
      message: '图片上传成功'
    })
  } catch (error) {
    console.error('Image upload error:', error)
    
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: '下载超时，请稍后重试' },
        { status: 504 }
      )
    }

    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : '上传失败，请重试'
      },
      { status: 500 }
    )
  }
}

