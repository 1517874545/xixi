import { NextRequest, NextResponse } from 'next/server'

// 豆包 API 配置
const DOUBAO_API_URL = 'https://ark.cn-beijing.volces.com/api/v3/images/generations'
const DOUBAO_API_KEY = process.env.DOUBAO_API_KEY || '2def65ad-06c6-4a41-87ee-fe1c99763d92'

export async function POST(request: NextRequest) {
  try {
    const { prompt, userId } = await request.json()

    if (!prompt || !prompt.trim()) {
      return NextResponse.json(
        { error: '提示词不能为空' },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: '用户ID不能为空' },
        { status: 400 }
      )
    }

    console.log('='.repeat(60))
    console.log('🎨 开始调用豆包 AI 生成图片')
    console.log('Prompt:', prompt.trim())
    console.log('User ID:', userId)
    console.log('='.repeat(60))

    // 直接调用豆包 API
    const response = await fetch(DOUBAO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DOUBAO_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'doubao-seedream-4-0-250828',
        prompt: prompt.trim(),
        n: 1,
        size: '1024x1024',
        response_format: 'url',
      }),
      // 设置超时（60秒，因为 AI 生成需要时间）
      signal: AbortSignal.timeout(60000),
    })

    console.log('📡 豆包 API 响应状态:', response.status, response.statusText)

    // 获取响应内容
    const responseText = await response.text()
    console.log('📄 响应内容长度:', responseText.length)
    
    // 检查响应是否为空
    if (!responseText || responseText.trim().length === 0) {
      console.error('❌ 豆包 API 返回空响应')
      return NextResponse.json(
        { error: 'AI服务返回空响应' },
        { status: 500 }
      )
    }

    // 解析 JSON
    let data
    try {
      data = JSON.parse(responseText)
      console.log('✅ JSON 解析成功')
      console.log('响应数据:', JSON.stringify(data, null, 2))
    } catch (parseError) {
      console.error('❌ JSON 解析失败:', parseError)
      console.error('响应内容:', responseText.substring(0, 500))
      return NextResponse.json(
        { 
          error: `AI服务返回了无效的响应格式: ${responseText.substring(0, 100)}`,
          success: false 
        },
        { status: 500 }
      )
    }

    // 检查 HTTP 状态码
    if (!response.ok) {
      console.error('❌ 豆包 API 调用失败:', response.status, data)
      const errorMessage = data.error?.message || data.message || JSON.stringify(data)
      return NextResponse.json(
        { error: `AI生成失败: ${errorMessage}` },
        { status: response.status }
      )
    }

    // 提取图片 URL
    if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
      console.error('❌ 响应中没有图片数据:', data)
      return NextResponse.json(
        { error: '生成失败：响应中没有图片' },
        { status: 500 }
      )
    }

    const imageUrl = data.data[0].url
    if (!imageUrl) {
      console.error('❌ 图片 URL 为空:', data.data[0])
      return NextResponse.json(
        { error: '生成失败：图片 URL 为空' },
        { status: 500 }
      )
    }

    console.log('🎉 图片生成成功！')
    console.log('图片 URL:', imageUrl)
    console.log('='.repeat(60))

    return NextResponse.json({
      success: true,
      imageUrl: imageUrl,
      prompt: prompt.trim(),
      message: '图片生成成功'
    })
  } catch (error) {
    console.error('❌ AI 生成错误:', error)
    
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: '生成超时，请稍后重试（AI 生成需要较长时间）' },
        { status: 504 }
      )
    }

    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : '生成失败，请重试',
        success: false 
      },
      { status: 500 }
    )
  }
}

