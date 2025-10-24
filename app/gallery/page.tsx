"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { mockComponents, type Design } from "@/lib/mock-data"
import { FollowButton } from "@/components/follow-button"
import { User, MessageCircle, Heart } from "lucide-react"
import { designsApi } from "@/lib/api"

export default function GalleryPage() {
  const router = useRouter()
  const [designs, setDesigns] = useState<Design[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDesigns = async () => {
      try {
        const publicDesigns = await designsApi.getAll({ isPublic: true })
        
        // 从本地存储中获取最新的点赞和评论数据
        try {
          const savedDesigns = JSON.parse(localStorage.getItem("petcraft_designs") || "[]")
          const savedLikes = JSON.parse(localStorage.getItem("petcraft_likes") || "[]")
          const savedComments = JSON.parse(localStorage.getItem("petcraft_comments") || "[]")
          
          // 更新设计数据，优先使用本地存储的数据
          const updatedDesigns = publicDesigns.map(design => {
            const savedDesign = savedDesigns.find((d: any) => d.id === design.id)
            
            // 计算实际的点赞数（基于本地存储的点赞数据）
            const actualLikesCount = savedLikes.filter((id: string) => id === design.id).length
            
            // 计算实际的评论数（基于本地存储的评论数据）
            const actualCommentsCount = savedComments.filter((c: any) => c.design_id === design.id).length
            
            if (savedDesign) {
              return {
                ...design,
                likes_count: Math.max(actualLikesCount, savedDesign.likes_count || 0),
                comments_count: Math.max(actualCommentsCount, savedDesign.comments_count || 0)
              }
            }
            
            // 即使没有保存的设计数据，也要使用本地存储的点赞和评论数
            return {
              ...design,
              likes_count: Math.max(actualLikesCount, design.likes_count || 0),
              comments_count: Math.max(actualCommentsCount, design.comments_count || 0)
            }
          })
          
          setDesigns(updatedDesigns)
        } catch (localError) {
          console.error('Failed to load local data:', localError)
          setDesigns(publicDesigns)
        }
      } catch (error) {
        console.error('Failed to load designs:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDesigns()
  }, [])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Community Gallery</h1>
          <p className="text-muted-foreground">
            Explore amazing pet illustrations created by our community
            {designs.length > 0 && ` · ${designs.length} ${designs.length === 1 ? "design" : "designs"}`}
          </p>
        </div>

        {designs.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No public designs yet. Be the first to share!</p>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {designs.map((design: any) => (
              <Card
                key={design.id}
                className="p-4 hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => router.push(`/design/${design.id}`)}
              >
                <svg
                  viewBox="0 0 300 300"
                  className="w-full h-48 mb-4 bg-muted rounded-lg group-hover:scale-105 transition-transform"
                >
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

                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold mb-1">{design.title}</h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>{design.user_name || "Anonymous"}</span>
                      </div>
                      {design.user_id !== "user1" && (
                        <div onClick={(e) => e.stopPropagation()}>
                          <FollowButton userId={design.user_id} />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-2 border-t text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      <span>{design.likes_count || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-4 w-4" />
                      <span>{design.comments_count || 0}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
