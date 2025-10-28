"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { mockComponents, type Design } from "@/lib/mock-data"
import { User, MessageCircle, Heart } from "lucide-react"
import { designsApi } from "@/lib/api"

export default function GalleryPage() {
  const router = useRouter()
  const [designs, setDesigns] = useState<Design[]>([])
  const [loading, setLoading] = useState(true)

  // 合并设计数据，优先使用最新的数据
  const mergeDesigns = (apiDesigns: Design[], localDesigns: Design[]): Design[] => {
    const mergedMap = new Map()
    
    // 首先添加API数据
    apiDesigns.forEach(design => {
      mergedMap.set(design.id, design)
    })
    
    // 然后添加本地存储数据，覆盖API数据
    localDesigns.forEach(design => {
      mergedMap.set(design.id, design)
    })
    
    // 按创建时间排序
    return Array.from(mergedMap.values()).sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }

  useEffect(() => {
    const loadDesigns = async () => {
      try {
        console.log('Loading public designs from API...')
        const publicDesigns = await designsApi.getAll({ isPublic: true })
        console.log('Loaded public designs from API:', publicDesigns.length)
        
        // 从本地存储中获取最新的公开设计数据
        let latestPublicDesigns = []
        if (typeof window !== 'undefined') {
          try {
            const savedDesigns = JSON.parse(localStorage.getItem("petcraft_designs") || "[]")
            const publicSavedDesigns = savedDesigns.filter((d: any) => d.is_public === true)
            if (publicSavedDesigns.length > 0) {
              latestPublicDesigns = publicSavedDesigns
              console.log('Loaded public designs from localStorage:', latestPublicDesigns.length)
            }
          } catch (localError) {
            console.error('Failed to load from localStorage:', localError)
          }
        }
        
        // 合并API数据和本地存储数据，优先使用最新的数据
        const mergedDesigns = mergeDesigns(publicDesigns, latestPublicDesigns)
        
        // 从本地存储中获取最新的点赞和评论数据
        if (typeof window !== 'undefined') {
          try {
            const savedLikes = JSON.parse(localStorage.getItem("petcraft_likes") || "[]")
            const savedComments = JSON.parse(localStorage.getItem("petcraft_comments") || "[]")
            
            // 更新设计数据，使用本地存储的点赞和评论数据
            const updatedDesigns = mergedDesigns.map(design => {
              // 计算实际的点赞数（基于本地存储的点赞数据）
              const actualLikesCount = savedLikes.filter((id: string) => id === design.id).length
              
              // 计算实际的评论数（基于本地存储的评论数据）
              const actualCommentsCount = savedComments.filter((c: any) => c.design_id === design.id).length
              
              return {
                ...design,
                likes_count: Math.max(actualLikesCount, design.likes_count || 0),
                comments_count: Math.max(actualCommentsCount, design.comments_count || 0)
              }
            })
            
            setDesigns(updatedDesigns)
          } catch (localError) {
            console.error('Failed to load local data:', localError)
            setDesigns(mergedDesigns)
          }
        } else {
          setDesigns(mergedDesigns)
        }
      } catch (error) {
        console.error('Failed to load designs from API:', error)
        
        // 如果API调用失败，尝试从本地存储加载公开设计
        if (typeof window !== 'undefined') {
          try {
            const savedDesigns = JSON.parse(localStorage.getItem("petcraft_designs") || "[]")
            
            // 只显示公开的设计
            const publicSavedDesigns = savedDesigns.filter((d: any) => d.is_public === true)
            
            if (publicSavedDesigns.length > 0) {
              setDesigns(publicSavedDesigns)
              console.log('Loaded public designs from localStorage:', publicSavedDesigns.length)
            } else {
              console.log('No public designs found in localStorage')
            }
          } catch (localError) {
            console.error('Failed to load from localStorage:', localError)
          }
        }
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
