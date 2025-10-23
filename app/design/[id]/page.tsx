"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { mockComponents, mockDesigns, mockComments, type Design } from "@/lib/mock-data"
import { LikeButton } from "@/components/like-button"
import { CommentSection } from "@/components/comment-section"
import { FollowButton } from "@/components/follow-button"
import { useAuth } from "@/lib/auth-context"
import { ArrowLeft, Share2, Edit, User, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { designsApi } from "@/lib/api"

export default function DesignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [design, setDesign] = useState<Design | null>(null)
  const [isLiked, setIsLiked] = useState(false)
  const [comments, setComments] = useState<any[]>([])

  useEffect(() => {
    const designId = params.id as string
    
    const loadDesign = async () => {
      try {
        // 首先尝试从API获取设计
        const foundDesign = await designsApi.getById(designId)
        if (foundDesign) {
          setDesign(foundDesign)
          return
        }
      } catch (error) {
        console.error('Failed to load design from API:', error)
        
        // 如果API失败，尝试从本地存储和模拟数据中查找
        const savedDesigns = JSON.parse(localStorage.getItem("petcraft_designs") || "[]")
        const allDesigns = [...mockDesigns, ...savedDesigns]
        const foundDesign = allDesigns.find((d: Design) => d.id === designId)

        if (foundDesign) {
          setDesign(foundDesign)
        }
      }
    }

    loadDesign()

    // Load likes
    const likes = JSON.parse(localStorage.getItem("petcraft_likes") || "[]")
    setIsLiked(likes.includes(designId))

    // Load comments
    const allComments = JSON.parse(localStorage.getItem("petcraft_comments") || "[]")
    const designComments = [
      ...mockComments.filter((c) => c.design_id === designId),
      ...allComments.filter((c: any) => c.design_id === designId),
    ]
    setComments(designComments)
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
            <svg viewBox="0 0 300 300" className="w-full h-auto bg-muted rounded-lg">
              {/* Background */}
              {design.components?.background && (
                <g
                  dangerouslySetInnerHTML={{
                    __html: mockComponents.find((c) => c.id === design.components?.background)?.svg_data || "",
                  }}
                  style={{ color: design.components?.bodyColor }}
                />
              )}

              {/* Body */}
              {design.components?.body && (
                <g
                  dangerouslySetInnerHTML={{
                    __html: mockComponents.find((c) => c.id === design.components?.body)?.svg_data || "",
                  }}
                  style={{ color: design.components?.bodyColor }}
                />
              )}

              {/* Ears */}
              {design.components?.ears && (
                <g
                  dangerouslySetInnerHTML={{
                    __html: mockComponents.find((c) => c.id === design.components?.ears)?.svg_data || "",
                  }}
                  style={{ color: design.components?.earsColor || design.components?.bodyColor }}
                />
              )}

              {/* Eyes */}
              {design.components?.eyes && (
                <g
                  dangerouslySetInnerHTML={{
                    __html: mockComponents.find((c) => c.id === design.components?.eyes)?.svg_data || "",
                  }}
                />
              )}

              {/* Nose */}
              {design.components?.nose && (
                <g
                  dangerouslySetInnerHTML={{
                    __html: mockComponents.find((c) => c.id === design.components?.nose)?.svg_data || "",
                  }}
                />
              )}

              {/* Mouth */}
              {design.components?.mouth && (
                <g
                  dangerouslySetInnerHTML={{
                    __html: mockComponents.find((c) => c.id === design.components?.mouth)?.svg_data || "",
                  }}
                />
              )}

              {/* Accessories */}
              {design.components?.accessories && (
                <g
                  dangerouslySetInnerHTML={{
                    __html: mockComponents.find((c) => c.id === design.components?.accessories)?.svg_data || "",
                  }}
                  style={{ color: design.components?.accessoriesColor || "#000000" }}
                />
              )}
            </svg>
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
              <div className="flex items-center justify-between py-4 border-y">
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
                {!isOwner && design.user_id !== "user1" && <FollowButton userId={design.user_id} />}
              </div>
            </div>

            {/* Interactions */}
            <div className="flex items-center gap-4">
              <LikeButton designId={design.id} initialLiked={isLiked} initialCount={design.likes_count || 0} />
            </div>

            {/* Comments Section */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Comments</h2>
              <CommentSection designId={design.id} initialComments={comments} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
