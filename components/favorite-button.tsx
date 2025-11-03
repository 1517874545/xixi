"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useAuthApi } from "@/lib/auth-api-context"
import { Heart } from "lucide-react"

interface FavoriteButtonProps {
  designId: string
  className?: string
}

export function FavoriteButton({ designId, className }: FavoriteButtonProps) {
  const { user } = useAuthApi()
  const [isFavorited, setIsFavorited] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // 获取用户ID（支持临时用户）
  const getUserId = () => {
    if (user?.id) return user.id
    
    // 检查是否有临时用户ID
    if (typeof window !== 'undefined') {
      const tempUserId = localStorage.getItem('temp_user_id')
      if (tempUserId) return tempUserId
      
      // 如果没有临时用户ID，创建一个
      const newTempUserId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('temp_user_id', newTempUserId)
      return newTempUserId
    }
    
    return null
  }

  useEffect(() => {
    const userId = getUserId()
    if (userId && designId) {
      checkFavoriteStatus(userId)
    }
  }, [user, designId])

  const checkFavoriteStatus = async (userId: string) => {
    try {
      const response = await fetch(`/api/favorites?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setIsFavorited(data.favorites?.includes(designId) || false)
      } else {
        // 如果API失败，检查本地存储
        checkLocalFavoriteStatus(userId)
      }
    } catch (error) {
      console.error('Error checking favorite status:', error)
      // 如果API失败，检查本地存储
      checkLocalFavoriteStatus(userId)
    }
  }

  const checkLocalFavoriteStatus = (userId: string) => {
    if (typeof window !== 'undefined') {
      try {
        const favorites = JSON.parse(localStorage.getItem(`favorites_${userId}`) || '[]')
        setIsFavorited(favorites.includes(designId))
      } catch (error) {
        console.error('Error checking local favorite status:', error)
      }
    }
  }

  const handleFavorite = async () => {
    const userId = getUserId()
    if (!userId) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          designId: designId
        })
      })

      if (response.ok) {
        const data = await response.json()
        // 无论是否已经收藏，都设置为已收藏状态
        setIsFavorited(true)
        // 同时保存到本地存储
        saveToLocalFavorites(userId, designId, true)
        
        // 如果是已经收藏的情况，静默处理（不显示错误）
        if (data.alreadyFavorited) {
          console.log('Item already favorited')
        }
      } else {
        // 如果API失败，尝试解析错误信息
        let errorMessage = '收藏失败'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
          
          // 如果错误是"Already favorited"，说明已经收藏了，更新状态即可
          if (errorMessage.includes('Already favorited') || errorMessage.includes('已经收藏')) {
            console.log('Item already favorited, updating state')
            setIsFavorited(true)
            saveToLocalFavorites(userId, designId, true)
            return
          }
          
          console.error('Favorite API error:', errorData)
        } catch (e) {
          const errorText = await response.text().catch(() => '')
          console.error('Favorite API error (text):', errorText || 'Unknown error')
          errorMessage = errorText || errorMessage
          
          // 检查文本中是否包含已收藏的提示
          if (errorMessage.includes('Already favorited') || errorMessage.includes('已经收藏')) {
            console.log('Item already favorited, updating state')
            setIsFavorited(true)
            saveToLocalFavorites(userId, designId, true)
            return
          }
        }
        
        // 如果错误是因为权限问题或表不存在，使用本地存储作为备选方案
        if (errorMessage.includes('暂时不可用') || errorMessage.includes('does not exist')) {
          setIsFavorited(true)
          saveToLocalFavorites(userId, designId, true)
          console.log('Using local storage as fallback for favorite')
        } else {
          // 其他错误，静默处理，不显示错误（因为可能是网络问题）
          console.warn('Favorite operation failed:', errorMessage)
        }
      }
    } catch (error) {
      console.error('Favorite error:', error)
      // 使用本地存储作为备选方案
      setIsFavorited(true)
      saveToLocalFavorites(userId, designId, true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnfavorite = async () => {
    const userId = getUserId()
    if (!userId) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/favorites?userId=${userId}&designId=${designId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setIsFavorited(false)
        // 同时从本地存储移除
        saveToLocalFavorites(userId, designId, false)
      } else {
        // 如果API失败，尝试解析错误信息
        let errorMessage = '取消收藏失败'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
          console.error('Unfavorite API error:', errorData)
        } catch (e) {
          const errorText = await response.text().catch(() => '')
          console.error('Unfavorite API error (text):', errorText || 'Unknown error')
          errorMessage = errorText || errorMessage
        }
        
        // 如果错误是因为权限问题或表不存在，使用本地存储作为备选方案
        if (errorMessage.includes('暂时不可用') || errorMessage.includes('does not exist')) {
          setIsFavorited(false)
          saveToLocalFavorites(userId, designId, false)
          console.log('Using local storage as fallback for unfavorite')
        } else {
          // 其他错误，显示错误但不改变状态
          console.error('Unfavorite failed:', errorMessage)
        }
      }
    } catch (error) {
      console.error('Unfavorite error:', error)
      // 使用本地存储作为备选方案
      setIsFavorited(false)
      saveToLocalFavorites(userId, designId, false)
    } finally {
      setIsLoading(false)
    }
  }

  const saveToLocalFavorites = (userId: string, designId: string, isFavorite: boolean) => {
    if (typeof window !== 'undefined') {
      try {
        const key = `favorites_${userId}`
        const currentFavorites = JSON.parse(localStorage.getItem(key) || '[]')
        
        if (isFavorite) {
          if (!currentFavorites.includes(designId)) {
            currentFavorites.push(designId)
          }
        } else {
          const index = currentFavorites.indexOf(designId)
          if (index > -1) {
            currentFavorites.splice(index, 1)
          }
        }
        
        localStorage.setItem(key, JSON.stringify(currentFavorites))
      } catch (error) {
        console.error('Error saving to local favorites:', error)
      }
    }
  }

  return (
    <Button
      variant={isFavorited ? "default" : "outline"}
      size="sm"
      onClick={isFavorited ? handleUnfavorite : handleFavorite}
      disabled={isLoading}
      className={className}
    >
      <Heart 
        className={`h-4 w-4 mr-2 ${isFavorited ? 'fill-current' : ''}`} 
      />
      {isFavorited ? "已收藏" : "收藏"}
    </Button>
  )
}