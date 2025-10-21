"use client"

import { useState } from "react"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface LikeButtonProps {
  designId: string
  initialLiked?: boolean
  initialCount?: number
  onLikeChange?: (liked: boolean, count: number) => void
}

export function LikeButton({ designId, initialLiked = false, initialCount = 0, onLikeChange }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)

  const handleLike = () => {
    const newLiked = !liked
    const newCount = newLiked ? count + 1 : count - 1

    setLiked(newLiked)
    setCount(newCount)

    // Store in localStorage
    const likes = JSON.parse(localStorage.getItem("petcraft_likes") || "[]")
    if (newLiked) {
      likes.push(designId)
    } else {
      const index = likes.indexOf(designId)
      if (index > -1) likes.splice(index, 1)
    }
    localStorage.setItem("petcraft_likes", JSON.stringify(likes))

    onLikeChange?.(newLiked, newCount)
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleLike} className="gap-1">
      <Heart className={cn("h-4 w-4", liked && "fill-primary text-primary")} />
      <span className="text-sm">{count}</span>
    </Button>
  )
}
