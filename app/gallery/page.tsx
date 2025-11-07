"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import SearchFilter, { type FilterOptions } from "@/components/search-filter"
import { type Design } from "@/lib/mock-data"
import { User, MessageCircle, Heart } from "lucide-react"
import { designsApi } from "@/lib/api"
import { FollowButton } from "@/components/follow-button"
import { FavoriteButton } from "@/components/favorite-button"
import { useAuthApi } from "@/lib/auth-api-context"
import { DesignPreview } from "@/components/design-preview"

export default function GalleryPage() {
  const router = useRouter()
  const { user } = useAuthApi()
  const [allDesigns, setAllDesigns] = useState<Design[]>([])
  const [filteredDesigns, setFilteredDesigns] = useState<Design[]>([])
  const [loading, setLoading] = useState(true)
  const [components, setComponents] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState<FilterOptions>({
    tags: [],
    sortBy: "newest",
    componentType: undefined,
    color: undefined,
    designType: undefined
  })

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

  // 获取所有可用标签
  const getAvailableTags = (designs: Design[]): string[] => {
    const allTags = new Set<string>()
    designs.forEach(design => {
      if (design.tags && Array.isArray(design.tags)) {
        design.tags.forEach(tag => allTags.add(tag))
      }
    })
    return Array.from(allTags)
  }

  // 应用搜索和筛选
  const applyFilters = (designs: Design[], query: string, filterOptions: FilterOptions): Design[] => {
    let filtered = designs

    // 搜索过滤
    if (query.trim()) {
      filtered = filtered.filter(design => 
        design.title.toLowerCase().includes(query.toLowerCase()) ||
        (design.user_name && design.user_name.toLowerCase().includes(query.toLowerCase())) ||
        (design.tags && design.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase())))
      )
    }

    // 标签过滤
    if (filterOptions.tags.length > 0) {
      filtered = filtered.filter(design => 
        design.tags && filterOptions.tags.every(tag => design.tags.includes(tag))
      )
    }

    // 组件类型过滤
    if (filterOptions.componentType) {
      filtered = filtered.filter(design => 
        design.components && design.components[filterOptions.componentType]
      )
    }

    // 颜色过滤
    if (filterOptions.color) {
      filtered = filtered.filter(design => 
        design.components && 
        (design.components.bodyColor === filterOptions.color ||
         design.components.earsColor === filterOptions.color ||
         design.components.accessoriesColor === filterOptions.color)
      )
    }

    // 作品类型过滤（AI 或 SVG）
    if (filterOptions.designType) {
      if (filterOptions.designType === "ai") {
        // 只显示 AI 创作的作品
        filtered = filtered.filter(design => design.design_type === "ai_image")
      } else if (filterOptions.designType === "svg") {
        // 显示 SVG 设计（包括没有 design_type 的旧作品，默认为 SVG）
        filtered = filtered.filter(design => 
          design.design_type !== "ai_image"
        )
      }
    }

    // 排序
    switch (filterOptions.sortBy) {
      case "popular":
        filtered.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
        break
      case "oldest":
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        break
      case "newest":
      default:
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
    }

    return filtered
  }

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
            
            setAllDesigns(updatedDesigns)
          } catch (localError) {
            console.error('Failed to load local data:', localError)
            setAllDesigns(mergedDesigns)
          }
        } else {
          setAllDesigns(mergedDesigns)
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
              setAllDesigns(publicSavedDesigns)
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

  // 当搜索查询或筛选条件变化时，重新应用筛选
  useEffect(() => {
    if (allDesigns.length > 0) {
      const filtered = applyFilters(allDesigns, searchQuery, filters)
      setFilteredDesigns(filtered)
    }
  }, [allDesigns, searchQuery, filters])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const handleFilter = (filterOptions: FilterOptions) => {
    setFilters(filterOptions)
  }

  const availableTags = getAvailableTags(allDesigns)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">社区画廊</h1>
          <p className="text-muted-foreground">
            探索社区创作的精彩宠物插画
            {filteredDesigns.length > 0 && ` · ${filteredDesigns.length} ${filteredDesigns.length === 1 ? "个作品" : "个作品"}`}
          </p>
        </div>

        {/* 搜索和筛选组件 */}
        <div className="mb-8">
          <SearchFilter
            onSearch={handleSearch}
            onFilter={handleFilter}
            availableTags={availableTags}
          />
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="p-4 animate-pulse">
                <div className="w-full h-48 bg-muted rounded-lg mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                  <div className="flex gap-4 pt-2">
                    <div className="h-3 bg-muted rounded w-8"></div>
                    <div className="h-3 bg-muted rounded w-8"></div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : filteredDesigns.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">
              {allDesigns.length === 0 
                ? "还没有公开的作品。成为第一个分享的人吧！" 
                : "没有找到符合筛选条件的作品。尝试调整搜索条件或筛选选项。"
              }
            </p>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDesigns.map((design: any) => (
              <Card
                key={design.id}
                className="p-4 hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => router.push(`/design/${design.id}`)}
              >
                <div className="mb-4 group-hover:scale-105 transition-transform">
                  <DesignPreview 
                    design={design} 
                    components={components}
                    className="group-hover:scale-105 transition-transform"
                  />
                </div>

                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold mb-1">{design.title}</h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>{design.user_name || "匿名用户"}</span>
                      </div>
                      {user && design.user_id && design.user_id !== user.id && (
                        <div onClick={(e) => e.stopPropagation()}>
                          <FollowButton 
                            targetUserId={design.user_id} 
                            targetUserName={design.user_name}
                            className="text-xs"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 标签显示 */}
                  {design.tags && design.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {design.tags.slice(0, 3).map((tag: string) => (
                        <span key={tag} className="text-xs bg-muted px-2 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                      {design.tags.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{design.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        <span>{design.likes_count || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        <span>{design.comments_count || 0}</span>
                      </div>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <FavoriteButton designId={design.id} className="h-8 w-8" />
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