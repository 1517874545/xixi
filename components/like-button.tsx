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
}

export function LikeButton({ designId, initialLiked = false, initialCount = 0, onLikeChange }: LikeButtonProps) {
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
    
    // Skip API call for mock design IDs or invalid IDs
    if (!designId || designId.startsWith('design') || designId.startsWith('mock')) {
      const newLiked = !liked
      const newCount = newLiked ? count + 1 : count - 1
      
      setLiked(newLiked)
      setCount(newCount)
      onLikeChange?.(newLiked, newCount)
      return
    }
    
    setLoading(true)
    try {
      const result = await likesApi.toggle(designId)
      const newLiked = result.liked
      const newCount = newLiked ? count + 1 : count - 1

      setLiked(newLiked)
      setCount(newCount)
      onLikeChange?.(newLiked, newCount)
    } catch (error) {
      console.error('Failed to toggle like:', error)
      // Fallback to local toggle on error
      const newLiked = !liked
      const newCount = newLiked ? count + 1 : count - 1
      setLiked(newLiked)
      setCount(newCount)
      onLikeChange?.(newLiked, newCount)
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
