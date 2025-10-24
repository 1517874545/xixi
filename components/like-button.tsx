"use client"

import { useState, useEffect } from "react"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { likesApi } from "@/lib/api"

interface LikeButtonProps {
  designId: string
  initialLiked?: boolean
  initialCount?: number
  onLikeChange?: (liked: boolean, count: number) => void
  onCountUpdate?: (count: number) => void
}

export function LikeButton({ designId, initialLiked = false, initialCount = 0, onLikeChange, onCountUpdate }: LikeButtonProps) {
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
      
      try {
        const isLiked = await likesApi.checkLiked(designId)
        setLiked(isLiked)
      } catch (error) {
        console.error('Failed to check like status:', error)
        // Fall back to initial value on error
        setLiked(initialLiked)
      }
    }
    
    checkLikeStatus()
  }, [designId, initialLiked])

  const handleLike = async () => {
    if (loading) return
    
    setLoading(true)
    try {
      // 直接使用本地状态切换，避免API返回随机值导致负数
      const newLiked = !liked
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
      
      // 异步调用API，但不依赖其结果
      likesApi.toggle(designId).catch(error => {
        console.error('API call failed but local state updated:', error)
      })
      
    } catch (error) {
      console.error('Failed to toggle like:', error)
      // Fallback to local toggle on error
      const newLiked = !liked
      const newCount = newLiked ? Math.max(0, count + 1) : Math.max(0, count - 1)
      setLiked(newLiked)
      setCount(newCount)
      onLikeChange?.(newLiked, newCount)
      onCountUpdate?.(newCount)
      
      // 即使API失败，也保存到本地存储
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
      
      console.log('Like fallback for design:', designId, 'Liked:', newLiked, 'Likes array:', currentLikes)
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
