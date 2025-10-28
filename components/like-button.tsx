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
    
    // 保存当前状态用于回滚
    const previousLiked = liked
    const previousCount = count
    
    // 先乐观更新UI，提升用户体验
    const optimisticLiked = !liked
    const optimisticCount = optimisticLiked ? Math.max(0, count + 1) : Math.max(0, count - 1)
    
    setLiked(optimisticLiked)
    setCount(optimisticCount)
    
    try {
      console.log('Toggling like for design:', designId, 'User:', user.id)
      
      // 调用API
      const result = await likesApi.toggle(designId, user.id)
      
      // API返回的实际结果
      const actualLiked = result.liked
      
      // 根据API结果计算正确的计数
      // 注意：这里应该基于previousCount而不是当前count，因为当前count已经被乐观更新了
      const actualCount = actualLiked ? Math.max(0, previousCount + 1) : Math.max(0, previousCount - 1)
      
      // 更新状态为API返回的实际结果
      setLiked(actualLiked)
      setCount(actualCount)
      onLikeChange?.(actualLiked, actualCount)
      onCountUpdate?.(actualCount)
      
      // 保存点赞状态到本地存储
      if (typeof window !== 'undefined') {
        let currentLikes = JSON.parse(localStorage.getItem("petcraft_likes") || "[]")
        
        if (actualLiked) {
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
      
      console.log('Like updated for design:', designId, 'Liked:', actualLiked, 'Count:', actualCount)
      
    } catch (error) {
      console.error('Failed to toggle like:', error)
      
      // API调用失败时，回滚到之前的状态
      setLiked(previousLiked)
      setCount(previousCount)
      
      // 可以在这里添加错误提示
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
