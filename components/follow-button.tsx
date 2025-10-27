"use client"

import { useState } from "react"
import { UserPlus, UserMinus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FollowButtonProps {
  userId: string
  initialFollowing?: boolean
  onFollowChange?: (following: boolean) => void
}

export function FollowButton({ userId, initialFollowing = false, onFollowChange }: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing)

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
