"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { mockDesigns, mockComments, type Design } from "@/lib/mock-data"
import { LikeButton } from "@/components/like-button"
import { FavoriteButton } from "@/components/favorite-button"
import { CommentSection } from "@/components/comment-section"
import { useAuthApi } from "@/lib/auth-api-context"
import { ArrowLeft, Share2, Edit, User, Calendar, MessageCircle, Heart } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { designsApi, commentsApi } from "@/lib/api"
import { DesignPreview } from "@/components/design-preview"

export default function DesignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthApi()
  const { toast } = useToast()
  const [design, setDesign] = useState<Design | null>(null)
  const [isLiked, setIsLiked] = useState(false)
  const [comments, setComments] = useState<any[]>([])
  const [currentLikesCount, setCurrentLikesCount] = useState(0)
  const [components, setComponents] = useState<any[]>([])

  useEffect(() => {
    // 加载组件数据
    const fetchComponents = async () => {
      try {
        const response = await fetch('/api/components')
        if (response.ok) {
          const data = await response.json()
          setComponents(data.components || [])
        }
      } catch (error) {
        console.error('Error fetching components:', error)
      }
    }
    
    fetchComponents()
  }, [])

  useEffect(() => {
    const designId = params.id as string
    
    const loadDesign = async () => {
      try {
        // 首先尝试从API获取设计
        const foundDesign = await designsApi.getById(designId)
        if (foundDesign) {
          // 从本地存储获取最新的点赞和评论数据
          if (typeof window !== 'undefined') {
            try {
              const savedLikes = JSON.parse(localStorage.getItem("petcraft_likes") || "[]")
              const savedComments = JSON.parse(localStorage.getItem("petcraft_comments") || "[]")
              const savedDesigns = JSON.parse(localStorage.getItem("petcraft_designs") || "[]")
              
              // 计算实际的点赞数
              const actualLikesCount = savedLikes.filter((id: string) => id === designId).length
              
              // 计算实际的评论数
              const actualCommentsCount = savedComments.filter((c: any) => c.design_id === designId).length
              
              // 更新设计数据
              const updatedDesign = {
                ...foundDesign,
                likes_count: Math.max(actualLikesCount, foundDesign.likes_count || 0),
                comments_count: Math.max(actualCommentsCount, foundDesign.comments_count || 0)
              }
              
              setDesign(updatedDesign)
              setCurrentLikesCount(updatedDesign.likes_count || 0)
              return
            } catch (localError) {
              console.error('Failed to load local data:', localError)
            }
          }
          
          setDesign(foundDesign)
          setCurrentLikesCount(foundDesign.likes_count || 0)
          return
        }
      } catch (error) {
        console.error('Failed to load design from API:', error)
        
        // 如果API失败，尝试从本地存储和模拟数据中查找
        const savedDesigns = JSON.parse(localStorage.getItem("petcraft_designs") || "[]")
        const allDesigns = [...mockDesigns, ...savedDesigns]
        const foundDesign = allDesigns.find((d: Design) => d.id === designId)

        if (foundDesign) {
          // 从本地存储获取最新的点赞和评论数据
          if (typeof window !== 'undefined') {
            try {
              const savedLikes = JSON.parse(localStorage.getItem("petcraft_likes") || "[]")
              const savedComments = JSON.parse(localStorage.getItem("petcraft_comments") || "[]")
              
              // 计算实际的点赞数
              const actualLikesCount = savedLikes.filter((id: string) => id === designId).length
              
              // 计算实际的评论数
              const actualCommentsCount = savedComments.filter((c: any) => c.design_id === designId).length
              
              // 更新设计数据
              const updatedDesign = {
                ...foundDesign,
                likes_count: Math.max(actualLikesCount, foundDesign.likes_count || 0),
                comments_count: Math.max(actualCommentsCount, foundDesign.comments_count || 0)
              }
              
              setDesign(updatedDesign)
              setCurrentLikesCount(updatedDesign.likes_count || 0)
            } catch (localError) {
              console.error('Failed to load local data:', localError)
              setDesign(foundDesign)
              setCurrentLikesCount(foundDesign.likes_count || 0)
            }
          } else {
            setDesign(foundDesign)
            setCurrentLikesCount(foundDesign.likes_count || 0)
          }
        }
      }
    }

    const loadComments = async () => {
      try {
        // 首先尝试从本地存储获取评论
        if (typeof window !== 'undefined') {
          try {
            const allComments = JSON.parse(localStorage.getItem("petcraft_comments") || "[]")
            const designComments = [
              ...mockComments.filter((c) => c.design_id === designId),
              ...allComments.filter((c: any) => c.design_id === designId),
            ]
            setComments(designComments)
            return
          } catch (localError) {
            console.error('Failed to load comments from localStorage:', localError)
          }
        }
        
        // 如果本地存储没有，尝试从API获取
        const fetchedComments = await commentsApi.getByDesign(designId)
        setComments(fetchedComments)
      } catch (error) {
        console.error('Failed to load comments:', error)
        // Fallback to local storage and mock data
        const allComments = JSON.parse(localStorage.getItem("petcraft_comments") || "[]")
        const designComments = [
          ...mockComments.filter((c) => c.design_id === designId),
          ...allComments.filter((c: any) => c.design_id === designId),
        ]
        setComments(designComments)
      }
    }

    const loadData = async () => {
      await loadDesign()
      
      // Load likes
      if (typeof window !== 'undefined') {
        const likes = JSON.parse(localStorage.getItem("petcraft_likes") || "[]")
        setIsLiked(likes.includes(designId))
      }
      
      // Load comments
      await loadComments()
    }

    loadData()
  }, [params.id])

  const handleShare = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    toast({
      title: "Link copied!",
      description: "Design link has been copied to clipboard",
    })
  }

  const handleEdit = () => {
    if (design) {
      localStorage.setItem("petcraft_editing_design", JSON.stringify(design))
      router.push("/editor")
    }
  }

  if (!design) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">Design not found</p>
            <Button onClick={() => router.push("/gallery")} className="mt-4">
              Back to Gallery
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  const isOwner = user && design.user_id === user.id

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
            {isOwner && (
              <Button variant="outline" size="icon" onClick={handleEdit}>
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Design Preview */}
          <Card className="p-6">
            <DesignPreview 
              design={design} 
              components={components}
              className="w-full h-auto"
            />
          </Card>

          {/* Design Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-3xl font-bold">{design.title}</h1>
                {design.is_public ? (
                  <Badge variant="default">Public</Badge>
                ) : (
                  <Badge variant="secondary">Private</Badge>
                )}
              </div>

              {/* Creator Info */}
              <div className="flex items-center py-4 border-y">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{design.user_name || "Anonymous"}</p>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(design.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactions */}
            <div className="flex items-center gap-4">
              <LikeButton 
                designId={design.id} 
                initialLiked={isLiked} 
                initialCount={design.likes_count || 0} 
                onLikeChange={(liked, count) => {
                  setIsLiked(liked)
                  setCurrentLikesCount(count)
                  // 更新本地存储中的设计数据
                  const savedDesigns = JSON.parse(localStorage.getItem("petcraft_designs") || "[]")
                  const designIndex = savedDesigns.findIndex((d: Design) => d.id === design.id)
                  if (designIndex !== -1) {
                    savedDesigns[designIndex].likes_count = count
                    localStorage.setItem("petcraft_designs", JSON.stringify(savedDesigns))
                  }
                }}
                onCountUpdate={(count) => {
                  setCurrentLikesCount(count)
                  // 更新本地存储中的设计数据
                  const savedDesigns = JSON.parse(localStorage.getItem("petcraft_designs") || "[]")
                  const designIndex = savedDesigns.findIndex((d: Design) => d.id === design.id)
                  if (designIndex !== -1) {
                    savedDesigns[designIndex].likes_count = count
                    localStorage.setItem("petcraft_designs", JSON.stringify(savedDesigns))
                  }
                }}
              />
              <FavoriteButton designId={design.id} />
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MessageCircle className="h-4 w-4" />
                <span>{comments.length}</span>
              </div>
            </div>

            {/* Comments Section */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Comments</h2>
              <CommentSection 
                designId={design.id} 
                initialComments={comments} 
                onCommentUpdate={(count) => {
                  // 更新本地存储中的设计数据
                  const savedDesigns = JSON.parse(localStorage.getItem("petcraft_designs") || "[]")
                  const designIndex = savedDesigns.findIndex((d: Design) => d.id === design.id)
                  if (designIndex !== -1) {
                    savedDesigns[designIndex].comments_count = count
                    localStorage.setItem("petcraft_designs", JSON.stringify(savedDesigns))
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
