"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useAuthApi } from "@/lib/auth-api-context"
import { UserPlus, UserMinus } from "lucide-react"

interface FollowButtonProps {
  targetUserId: string
  targetUserName?: string
  className?: string
}

export function FollowButton({ targetUserId, targetUserName, className }: FollowButtonProps) {
  const { user } = useAuthApi()
  const [isFollowing, setIsFollowing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (user && targetUserId) {
      checkFollowStatus()
    }
  }, [user, targetUserId])

  const checkFollowStatus = async () => {
    if (!user) return

    try {
      const response = await fetch(`/api/follows?followerId=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setIsFollowing(data.follows.includes(targetUserId))
      }
    } catch (error) {
      console.error('Error checking follow status:', error)
    }
  }

  const handleFollow = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/follows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          followerId: user.id,
          followedId: targetUserId
        })
      })

      if (response.ok) {
        setIsFollowing(true)
      } else {
        const error = await response.json()
        console.error('Follow error:', error)
      }
    } catch (error) {
      console.error('Follow error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnfollow = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/follows?followerId=${user.id}&followedId=${targetUserId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setIsFollowing(false)
      } else {
        const error = await response.json()
        console.error('Unfollow error:', error)
      }
    } catch (error) {
      console.error('Unfollow error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user || user.id === targetUserId) {
    return null
  }

  return (
    <Button
      variant={isFollowing ? "outline" : "default"}
      size="sm"
      onClick={isFollowing ? handleUnfollow : handleFollow}
      disabled={isLoading}
      className={className}
    >
      {isFollowing ? (
        <>
          <UserMinus className="h-4 w-4 mr-2" />
          已关注
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4 mr-2" />
          关注{targetUserName ? ` ${targetUserName}` : ''}
        </>
      )}
    </Button>
  )
}