"use client"

import { useState, useEffect } from "react"
import { UserPlus, UserMinus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FollowButtonProps {
  userId: string
  initialFollowing?: boolean
  onFollowChange?: (following: boolean) => void
}

export function FollowButton({ userId, initialFollowing = false, onFollowChange }: FollowButtonProps) {
  const [following, setFollowing] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // 在客户端初始化状态，确保与服务器渲染一致
    if (typeof window !== 'undefined') {
      const follows = JSON.parse(localStorage.getItem("petcraft_follows") || "[]")
      const isFollowing = follows.includes(userId)
      setFollowing(isFollowing)
    } else {
      setFollowing(initialFollowing)
    }
  }, [userId, initialFollowing])

  const handleFollow = () => {
    const newFollowing = !following
    setFollowing(newFollowing)

    // Store in localStorage (client-side only)
    if (typeof window !== 'undefined') {
      const follows = JSON.parse(localStorage.getItem("petcraft_follows") || "[]")
      if (newFollowing) {
        follows.push(userId)
      } else {
        const index = follows.indexOf(userId)
        if (index > -1) follows.splice(index, 1)
      }
      localStorage.setItem("petcraft_follows", JSON.stringify(follows))
    }

    onFollowChange?.(newFollowing)
  }

  // 避免 SSR 和客户端渲染不匹配
  if (!mounted) {
    return (
      <Button variant="default" size="sm" className="gap-2 opacity-0">
        <UserPlus className="h-4 w-4" />
        Follow
      </Button>
    )
  }

  return (
    <Button variant={following ? "outline" : "default"} size="sm" onClick={handleFollow} className="gap-2">
      {following ? (
        <>
          <UserMinus className="h-4 w-4" />
          Following
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4" />
          Follow
        </>
      )}
    </Button>
  )
}
