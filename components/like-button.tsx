"use client"

import { useState, useEffect } from "react"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { likesApi } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"

interface LikeButtonProps {
  designId: string
  initialLiked?: boolean
  initialCount?: number
  onLikeChange?: (liked: boolean, count: number) => void
  onCountUpdate?: (count: number) => void
}

export function LikeButton({ designId, initialLiked = false, initialCount = 0, onLikeChange, onCountUpdate }: LikeButtonProps) {
  const { user } = useAuth()
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Check initial like status from API
    const checkLikeStatus = async () => {
      // Skip API call for mock design IDs or invalid IDs
      if (!designId || designId.startsWith('design') || designId.startsWith('mock')) {
        setLiked(initialLiked)
        return
      }
      
      // 如果没有用户ID，使用初始值
      if (!user?.id) {
        setLiked(initialLiked)
        return
      }
      
      try {
        const isLiked = await likesApi.checkLiked(designId, user.id)
        setLiked(isLiked)
      } catch (error) {
        console.error('Failed to check like status:', error)
        // Fall back to initial value on error
        setLiked(initialLiked)
      }
    }
    
    checkLikeStatus()
  }, [designId, initialLiked, user?.id])

  const handleLike = async () => {
    if (loading || !user?.id) return
    
    setLoading(true)
    try {
      // 先调用API，等待API返回结果
      const result = await likesApi.toggle(designId, user.id)
      
      // 根据API返回的结果更新本地状态
      const newLiked = result.liked
      const newCount = newLiked ? Math.max(0, count + 1) : Math.max(0, count - 1)

      setLiked(newLiked)
      setCount(newCount)
      onLikeChange?.(newLiked, newCount)
      onCountUpdate?.(newCount)
      
      // 保存点赞状态到本地存储，确保profile页面能访问
      let currentLikes = []
      if (typeof window !== 'undefined') {
        currentLikes = JSON.parse(localStorage.getItem("petcraft_likes") || "[]")
        if (newLiked) {
          if (!currentLikes.includes(designId)) {
            currentLikes.push(designId)
          }
        } else {
          const index = currentLikes.indexOf(designId)
          if (index > -1) {
            currentLikes.splice(index, 1)
          }
        }
        localStorage.setItem("petcraft_likes", JSON.stringify(currentLikes))
      }
      
      console.log('Like updated for design:', designId, 'Liked:', newLiked, 'Likes array:', currentLikes)
      
    } catch (error) {
      console.error('Failed to toggle like:', error)
      // API调用失败时，不更新本地状态，避免重复点赞
      // 可以显示错误提示，但不改变点赞状态
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={handleLike} 
      disabled={loading}
      className="gap-1"
    >
      <Heart className={cn("h-4 w-4", liked && "fill-primary text-primary")} />
      <span className="text-sm">{count}</span>
    </Button>
  )
}
