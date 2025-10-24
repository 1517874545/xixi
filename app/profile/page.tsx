"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { mockUser, mockComponents, mockDesigns, type Design } from "@/lib/mock-data"
import { User, Heart } from "lucide-react"
import { designsApi, likesApi } from "@/lib/api"

export default function ProfilePage() {
  const [likedDesigns, setLikedDesigns] = useState<Design[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProfileData()
  }, [])

  const loadProfileData = async () => {
    try {
      setLoading(true)

      // 获取喜欢的作品ID - 优先使用本地存储，因为API返回的是固定模拟数据
      let likedDesignIds: string[] = []
      try {
        // 首先尝试从本地存储获取
        if (typeof window !== 'undefined') {
          likedDesignIds = JSON.parse(localStorage.getItem("petcraft_likes") || "[]")
        }
        
        // 如果本地存储为空，再尝试从API获取（获取模拟数据）
        if (likedDesignIds.length === 0) {
          const apiLikes = await likesApi.getUserLikes(mockUser.id)
          likedDesignIds = apiLikes
        }
      } catch (error) {
        console.error('Failed to load likes:', error)
        likedDesignIds = []
      }
      
      console.log('Liked design IDs:', likedDesignIds)
      
      // 获取完整的设计对象
      const likedDesignsPromises = likedDesignIds.map(id => {
        return designsApi.getById(id).catch(() => {
          // 如果API获取失败，尝试从模拟数据中查找
          const mockDesign = mockDesigns.find(d => d.id === id)
          if (mockDesign) {
            console.log('Found mock design:', id)
            return mockDesign
          }
          
          // 尝试从本地存储的设计中查找
          try {
            const savedDesigns = JSON.parse(localStorage.getItem("petcraft_designs") || "[]")
            const savedDesign = savedDesigns.find((d: Design) => d.id === id)
            if (savedDesign) {
              console.log('Found saved design:', id)
              return savedDesign
            }
          } catch {
            // 忽略错误
          }
          
          console.log('Design not found:', id)
          return null
        })
      })
      
      const likedDesignsResults = await Promise.all(likedDesignsPromises)
      const likedDesigns = likedDesignsResults.filter(Boolean) as Design[]
      
      console.log('Loaded liked designs:', likedDesigns.length)
      setLikedDesigns(likedDesigns)
    } catch (error) {
      console.error('Failed to load profile data:', error)
      // Fallback to empty arrays on error
      setLikedDesigns([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Profile Header */}
        <Card className="p-6 mb-8">
          <div className="flex items-start gap-6">
            <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-12 w-12 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2">{mockUser.name}</h1>
              <p className="text-muted-foreground mb-4">{mockUser.email}</p>
              <div className="flex gap-6 text-sm">
                <div>
                  <span className="font-semibold">{mockUser.designs_count}</span>
                  <span className="text-muted-foreground ml-1">Designs</span>
                </div>
                <div>
                  <span className="font-semibold">{mockUser.followers_count}</span>
                  <span className="text-muted-foreground ml-1">Followers</span>
                </div>
                <div>
                  <span className="font-semibold">{mockUser.following_count}</span>
                  <span className="text-muted-foreground ml-1">Following</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Liked Designs */}
        <div className="mt-6">
            {likedDesigns.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">No liked designs yet. Explore the gallery!</p>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {likedDesigns.map((design) => (
                  <Link key={design.id} href={`/design/${design.id}`}>
                    <Card className="p-4 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]">
                      <svg viewBox="0 0 300 300" className="w-full h-48 mb-4 bg-muted rounded-lg">
                        {design.components?.background && (
                          <g
                            dangerouslySetInnerHTML={{
                              __html: mockComponents.find((c) => c.id === design.components?.background)?.svg_data || "",
                            }}
                            style={{ color: design.components?.bodyColor }}
                          />
                        )}
                        {design.components?.body && (
                          <g
                            dangerouslySetInnerHTML={{
                              __html: mockComponents.find((c) => c.id === design.components?.body)?.svg_data || "",
                            }}
                            style={{ color: design.components?.bodyColor }}
                          />
                        )}
                        {design.components?.ears && (
                          <g
                            dangerouslySetInnerHTML={{
                              __html: mockComponents.find((c) => c.id === design.components?.ears)?.svg_data || "",
                            }}
                            style={{ color: design.components?.bodyColor }}
                          />
                        )}
                        {design.components?.eyes && (
                          <g
                            dangerouslySetInnerHTML={{
                              __html: mockComponents.find((c) => c.id === design.components?.eyes)?.svg_data || "",
                            }}
                          />
                        )}
                        {design.components?.nose && (
                          <g
                            dangerouslySetInnerHTML={{
                              __html: mockComponents.find((c) => c.id === design.components?.nose)?.svg_data || "",
                            }}
                          />
                        )}
                        {design.components?.mouth && (
                          <g
                            dangerouslySetInnerHTML={{
                              __html: mockComponents.find((c) => c.id === design.components?.mouth)?.svg_data || "",
                            }}
                          />
                        )}
                        {design.components?.accessories && (
                          <g
                            dangerouslySetInnerHTML={{
                              __html:
                                mockComponents.find((c) => c.id === design.components?.accessories)?.svg_data || "",
                            }}
                          />
                        )}
                      </svg>
                      <div>
                        <h3 className="font-semibold mb-1">{design.title}</h3>
                        <p className="text-sm text-muted-foreground">{design.user_name || "Anonymous"}</p>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
        </div>
      </div>
    </div>
  )
}
