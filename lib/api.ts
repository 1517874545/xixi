import { Design, Component, Comment } from './mock-data'

const API_BASE_URL = '/api'

// 获取认证token的函数
async function getAuthToken(): Promise<string | null> {
  try {
    const { supabase } = await import('./supabase')
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || null
  } catch (error) {
    console.error('Failed to get auth token:', error)
    return null
  }
}

// 创建带认证头的fetch函数
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  try {
    const token = await getAuthToken()
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    }

    const response = await fetch(url, { ...options, headers })
    
    if (response.status === 401) {
      // Token可能已过期，尝试刷新
      const { supabase } = await import('./supabase')
      const { data: { session } } = await supabase.auth.refreshSession()
      
      if (session?.access_token) {
        // 使用新token重试请求
        const newHeaders = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          ...options.headers,
        }
        return await fetch(url, { ...options, headers: newHeaders })
      }
    }
    
    return response
  } catch (error) {
    console.error('fetchWithAuth error:', error)
    // 如果认证失败，仍然尝试普通请求
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    }
    return await fetch(url, { ...options, headers })
  }
}

// API Service for Components
export const componentsApi = {
  async getAll(): Promise<Component[]> {
    const response = await fetch(`${API_BASE_URL}/components`)
    if (!response.ok) {
      throw new Error('Failed to fetch components')
    }
    const data = await response.json()
    return data.components
  }
}

// API Service for Designs
export const designsApi = {
  async getAll(params?: { userId?: string; isPublic?: boolean; limit?: number; offset?: number }): Promise<Design[]> {
    const searchParams = new URLSearchParams()
    if (params?.userId) searchParams.append('userId', params.userId)
    if (params?.isPublic !== undefined) searchParams.append('isPublic', params.isPublic.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.offset) searchParams.append('offset', params.offset.toString())

    const response = await fetchWithAuth(`${API_BASE_URL}/designs?${searchParams}`)
    if (!response.ok) {
      throw new Error('Failed to fetch designs')
    }
    const data = await response.json()
    return data.designs
  },

  async getUserDesigns(userId: string): Promise<Design[]> {
    return this.getAll({ userId })
  },

  async getById(id: string): Promise<Design> {
    const response = await fetchWithAuth(`${API_BASE_URL}/designs/${id}`)
    if (!response.ok) {
      throw new Error('Failed to fetch design')
    }
    const data = await response.json()
    return data.design
  },

  async create(design: Omit<Design, 'id' | 'created_at' | 'likes_count' | 'comments_count'> & { user_id: string }): Promise<Design> {
    const response = await fetch(`${API_BASE_URL}/designs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(design),
    })
    if (!response.ok) {
      let errorMessage = '保存设计失败'
      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorMessage
      } catch {
        const errorText = await response.text()
        errorMessage = errorText || errorMessage
      }
      console.error('Failed to create design:', errorMessage)
      throw new Error(errorMessage)
    }
    const data = await response.json()
    return data.design
  },

  async update(id: string, updates: Partial<Design>): Promise<Design> {
    const response = await fetch(`${API_BASE_URL}/designs/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    })
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Failed to update design:', errorText)
      throw new Error('Failed to update design')
    }
    const data = await response.json()
    return data.design
  },

  async delete(id: string): Promise<void> {
    const response = await fetchWithAuth(`${API_BASE_URL}/designs/${id}`, {
      method: 'DELETE',
    })
    
    // 处理响应
    if (response.ok) {
      // 尝试解析响应内容
      try {
        const result = await response.json()
        if (result.success === false) {
          throw new Error('Delete operation failed')
        }
        // 如果success为true或未定义，都认为是成功的
        return
      } catch {
        // 如果响应不是JSON，但状态码是200-299，也认为是成功的
        return
      }
    }
    
    // 处理错误响应
    if (response.status === 404) {
      // 404表示设计不存在，但这也算删除成功（目标已经达成）
      console.log('Design not found (404), but considering delete operation successful')
      return
    }
    
    // 尝试解析错误信息
    try {
      const errorData = await response.json()
      throw new Error(errorData.error || `Failed to delete design (${response.status})`)
    } catch {
      throw new Error(`Failed to delete design (${response.status})`)
    }
  }
}

// API Service for Likes
export const likesApi = {
  async toggle(designId: string, userId: string): Promise<{ liked: boolean }> {
    const response = await fetch(`${API_BASE_URL}/likes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ design_id: designId, user_id: userId }),
    })
    if (!response.ok) {
      throw new Error('Failed to toggle like')
    }
    return response.json()
  },

  async checkLiked(designId: string, userId: string): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/likes?designId=${designId}&userId=${userId}`)
    if (!response.ok) {
      throw new Error('Failed to check like status')
    }
    const data = await response.json()
    return data.liked
  },

  async getUserLikes(userId: string): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/likes?userId=${userId}`)
    if (!response.ok) {
      throw new Error('Failed to fetch user likes')
    }
    const data = await response.json()
    return data.likedDesigns
  }
}

// API Service for Comments
export const commentsApi = {
  async getByDesign(designId: string, params?: { limit?: number; offset?: number }): Promise<Comment[]> {
    const searchParams = new URLSearchParams({ designId })
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.offset) searchParams.append('offset', params.offset.toString())

    const response = await fetch(`${API_BASE_URL}/comments?${searchParams}`)
    if (!response.ok) {
      throw new Error('Failed to fetch comments')
    }
    const data = await response.json()
    return data.comments
  },

  async getUserComments(userId: string): Promise<Comment[]> {
    const response = await fetch(`${API_BASE_URL}/comments?userId=${userId}`)
    if (!response.ok) {
      throw new Error('Failed to fetch user comments')
    }
    const data = await response.json()
    return data.comments || []
  },

  async create(designId: string, content: string, userId: string): Promise<Comment> {
    const response = await fetch(`${API_BASE_URL}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ design_id: designId, content, user_id: userId }),
    })
    if (!response.ok) {
      throw new Error('Failed to create comment')
    }
    const data = await response.json()
    return data.comment
  }
}