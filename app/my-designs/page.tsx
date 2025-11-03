"use client"

import { useEffect, useState } from "react"
import { useAuthApi } from "@/lib/auth-api-context"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { type Design } from "@/lib/mock-data"
import { Trash2, Eye, EyeOff, Edit, Share2, Heart, MessageCircle, TrendingUp, Calendar } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { designsApi } from "@/lib/api"

export default function MyDesignsPage() {
  const { user, loading: authLoading } = useAuthApi()
  const router = useRouter()
  const { toast } = useToast()
  const [designs, setDesigns] = useState<Design[]>([])
  const [filteredDesigns, setFilteredDesigns] = useState<Design[]>([])
  const [sortBy, setSortBy] = useState<"date" | "likes">("date")
  const [filterBy, setFilterBy] = useState<"all" | "public" | "private">("all")
  const [loading, setLoading] = useState(true)
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
    // 检查是否有临时用户ID
    const tempUserId = localStorage.getItem('temp_user_id')
    
    // 如果没有用户且没有临时用户ID，跳转到登录页面
    if (!authLoading && !user && !tempUserId) {
      router.push("/login")
      return
    }

    // 如果有用户或临时用户ID，加载设计
    if (user || tempUserId) {
      loadDesigns()
    }
  }, [user, authLoading, router])

  const loadDesigns = async () => {
    try {
      setLoading(true)
      
      // 获取当前用户ID（优先使用真实用户ID，其次使用临时用户ID）
      const tempUserId = localStorage.getItem('temp_user_id')
      const currentUser = user?.id || tempUserId || 'demo-user'
      
      // 首先检查本地存储是否有最新数据
      let latestDesigns = []
      if (typeof window !== 'undefined') {
        try {
          const savedDesigns = JSON.parse(localStorage.getItem("petcraft_designs") || "[]")
          const userSavedDesigns = savedDesigns.filter((d: any) => d.user_id === currentUser)
          if (userSavedDesigns.length > 0) {
            latestDesigns = userSavedDesigns
            console.log('Loaded designs from localStorage:', latestDesigns.length)
          }
        } catch (localError) {
          console.error('Failed to load from localStorage:', localError)
        }
      }
      
      // 加载当前用户的所有设计
      const userDesigns = await designsApi.getAll({ userId: currentUser })
      
      console.log('Loaded designs from API:', userDesigns.length)
      
      // 合并API数据和本地存储数据，优先使用最新的数据
      const mergedDesigns = mergeDesigns(userDesigns, latestDesigns)
      
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
      console.error('Failed to load designs:', error)
      
      // 如果API调用失败，尝试从本地存储加载
      if (typeof window !== 'undefined') {
        try {
          const savedDesigns = JSON.parse(localStorage.getItem("petcraft_designs") || "[]")
          const tempUserId = localStorage.getItem('temp_user_id')
          const currentUser = user?.id || tempUserId || 'demo-user'
          
          // 只显示当前用户的设计
          const userSavedDesigns = savedDesigns.filter((d: any) => d.user_id === currentUser)
          
          if (userSavedDesigns.length > 0) {
            setDesigns(userSavedDesigns)
            console.log('Loaded designs from localStorage:', userSavedDesigns.length)
          } else {
            toast({
              title: "Error",
              description: "Failed to load your designs",
              variant: "destructive"
            })
          }
        } catch (localError) {
          console.error('Failed to load from localStorage:', localError)
          toast({
            title: "Error",
            description: "Failed to load your designs",
            variant: "destructive"
          })
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to load your designs",
          variant: "destructive"
        })
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let filtered = [...designs]

    // Filter by visibility
    if (filterBy === "public") {
      filtered = filtered.filter((d) => d.is_public)
    } else if (filterBy === "private") {
      filtered = filtered.filter((d) => !d.is_public)
    }

    // Sort
    if (sortBy === "likes") {
      filtered.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
    } else {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }

    setFilteredDesigns(filtered)
  }, [designs, sortBy, filterBy])

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

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this design?")) return

    try {
      await designsApi.delete(id)
      
      // 更新前端状态
      const updatedDesigns = designs.filter((d) => d.id !== id)
      setDesigns(updatedDesigns)
      
      // 同时清理本地存储中的数据
      if (typeof window !== 'undefined') {
        try {
          // 清理设计数据
          const savedDesigns = JSON.parse(localStorage.getItem("petcraft_designs") || "[]")
          const filteredDesigns = savedDesigns.filter((d: any) => d.id !== id)
          localStorage.setItem("petcraft_designs", JSON.stringify(filteredDesigns))
          
          // 清理点赞数据
          const savedLikes = JSON.parse(localStorage.getItem("petcraft_likes") || "[]")
          const filteredLikes = savedLikes.filter((likeId: string) => likeId !== id)
          localStorage.setItem("petcraft_likes", JSON.stringify(filteredLikes))
          
          // 清理评论数据
          const savedComments = JSON.parse(localStorage.getItem("petcraft_comments") || "[]")
          const filteredComments = savedComments.filter((c: any) => c.design_id !== id)
          localStorage.setItem("petcraft_comments", JSON.stringify(filteredComments))
          
          console.log('Cleaned up local storage data for design:', id)
        } catch (localError) {
          console.error('Failed to clean up local storage:', localError)
        }
      }
      
      toast({
        title: "Design deleted",
        description: "Your design has been removed.",
      })
    } catch (error) {
      console.error('Failed to delete design:', error)
      
      // 如果API删除失败，尝试从本地存储中删除
      if (typeof window !== 'undefined') {
        try {
          const savedDesigns = JSON.parse(localStorage.getItem("petcraft_designs") || "[]")
          const filteredDesigns = savedDesigns.filter((d: any) => d.id !== id)
          localStorage.setItem("petcraft_designs", JSON.stringify(filteredDesigns))
          
          const updatedDesigns = designs.filter((d) => d.id !== id)
          setDesigns(updatedDesigns)
          
          toast({
            title: "Design removed locally",
            description: "Design was removed from local storage.",
          })
          return
        } catch (localError) {
          console.error('Failed to delete from local storage:', localError)
        }
      }
      
      toast({
        title: "Error",
        description: "Failed to delete design",
        variant: "destructive"
      })
    }
  }

  const togglePublic = async (id: string) => {
    const design = designs.find((d) => d.id === id)

    if (!design) return

    const newIsPublic = !design.is_public
    
    if (newIsPublic) {
      // 设置为公开的确认
      if (!confirm("Make this design public? It will be visible to everyone in the community gallery.")) {
        return
      }
    } else {
      // 设置为私有的确认
      if (!confirm("Make this design private? It will no longer be visible in the public gallery.")) {
        return
      }
    }

    try {
      const updatedDesign = await designsApi.update(id, { is_public: newIsPublic })
      const updatedDesigns = designs.map((d) => (d.id === id ? updatedDesign : d))
      setDesigns(updatedDesigns)

      // 更新本地存储
      if (typeof window !== 'undefined') {
        try {
          const savedDesigns = JSON.parse(localStorage.getItem("petcraft_designs") || "[]")
          const existingIndex = savedDesigns.findIndex((d: any) => d.id === id)
          
          if (existingIndex !== -1) {
            savedDesigns[existingIndex] = {
              ...savedDesigns[existingIndex],
              is_public: newIsPublic
            }
            localStorage.setItem("petcraft_designs", JSON.stringify(savedDesigns))
          }
        } catch (localError) {
          console.error('Failed to update local storage:', localError)
        }
      }

      toast({
        title: newIsPublic ? "Design published" : "Design unpublished",
        description: newIsPublic
          ? "Your design is now visible in the public gallery."
          : "Your design is now private.",
      })
    } catch (error) {
      console.error('Failed to update design visibility:', error)
      
      // 如果API更新失败，尝试更新本地存储
      if (typeof window !== 'undefined') {
        try {
          const savedDesigns = JSON.parse(localStorage.getItem("petcraft_designs") || "[]")
          const existingIndex = savedDesigns.findIndex((d: any) => d.id === id)
          
          if (existingIndex !== -1) {
            savedDesigns[existingIndex] = {
              ...savedDesigns[existingIndex],
              is_public: newIsPublic
            }
            localStorage.setItem("petcraft_designs", JSON.stringify(savedDesigns))
            
            // 更新前端状态
            const updatedDesigns = designs.map((d) => 
              d.id === id ? { ...d, is_public: newIsPublic } : d
            )
            setDesigns(updatedDesigns)
            
            toast({
              title: newIsPublic ? "Design published locally" : "Design unpublished locally",
              description: newIsPublic
                ? "Your design is now visible in the public gallery (local storage)."
                : "Your design is now private (local storage).",
            })
            return
          }
        } catch (localError) {
          console.error('Failed to update local storage:', localError)
        }
      }
      
      toast({
        title: "Error",
        description: "Failed to update design visibility",
        variant: "destructive"
      })
    }
  }

  const handleEdit = (design: Design) => {
    localStorage.setItem("petcraft_editing_design", JSON.stringify(design))
    router.push("/editor")
  }

  const handleShare = (id: string) => {
    const url = `${window.location.origin}/gallery?design=${id}`
    navigator.clipboard.writeText(url)
    toast({
      title: "Link copied!",
      description: "Design link has been copied to clipboard.",
    })
  }

  const totalLikes = designs.reduce((sum, d) => sum + (d.likes_count || 0), 0)
  const totalComments = designs.reduce((sum, d) => sum + (d.comments_count || 0), 0)
  const publicCount = designs.filter((d) => d.is_public).length

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">My Designs</h1>
          <Button onClick={() => router.push("/editor")}>Create New</Button>
        </div>

        {designs.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Edit className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{designs.length}</p>
                  <p className="text-sm text-muted-foreground">Total Designs</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Heart className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalLikes}</p>
                  <p className="text-sm text-muted-foreground">Total Likes</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <MessageCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalComments}</p>
                  <p className="text-sm text-muted-foreground">Total Comments</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Eye className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{publicCount}</p>
                  <p className="text-sm text-muted-foreground">Public Designs</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {designs.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">You haven't created any designs yet</p>
            <Button onClick={() => router.push("/editor")}>Create Your First Design</Button>
          </Card>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <Tabs
                value={filterBy}
                onValueChange={(v) => setFilterBy(v as typeof filterBy)}
                className="w-full sm:w-auto"
              >
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="public">Public</TabsTrigger>
                  <TabsTrigger value="private">Private</TabsTrigger>
                </TabsList>
              </Tabs>

              <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Newest First</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="likes">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      <span>Most Liked</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDesigns.map((design) => (
                <Card key={design.id} className="overflow-hidden">
                  <div className="px-4 pt-3 pb-0">
                    <div
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mb-3"
                      style={{
                        backgroundColor: design.is_public ? "hsl(var(--primary) / 0.1)" : "hsl(var(--muted))",
                        color: design.is_public ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                      }}
                    >
                      {design.is_public ? (
                        <>
                          <Eye className="h-3 w-3" />
                          <span>Public</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3 w-3" />
                          <span>Private</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="px-4 pb-4 cursor-pointer" onClick={() => router.push(`/design/${design.id}`)}>
                    <svg
                      viewBox="0 0 300 300"
                      className="w-full h-48 mb-4 bg-muted rounded-lg hover:scale-105 transition-transform"
                    >
                      {/* Background */}
                      {design.components?.background && (
                        <g
                          dangerouslySetInnerHTML={{
                            __html: components.find((c) => c.id === design.components?.background)?.svg_data || "",
                          }}
                          style={{ color: design.components?.bodyColor }}
                        />
                      )}

                      {/* Body */}
                      {design.components?.body && (
                        <g
                          dangerouslySetInnerHTML={{
                            __html: components.find((c) => c.id === design.components?.body)?.svg_data || "",
                          }}
                          style={{ color: design.components?.bodyColor }}
                        />
                      )}

                      {/* Ears */}
                      {design.components?.ears && (
                        <g
                          dangerouslySetInnerHTML={{
                            __html: components.find((c) => c.id === design.components?.ears)?.svg_data || "",
                          }}
                          style={{ color: design.components?.bodyColor }}
                        />
                      )}

                      {/* Eyes */}
                      {design.components?.eyes && (
                        <g
                          dangerouslySetInnerHTML={{
                            __html: components.find((c) => c.id === design.components?.eyes)?.svg_data || "",
                          }}
                        />
                      )}

                      {/* Nose */}
                      {design.components?.nose && (
                        <g
                          dangerouslySetInnerHTML={{
                            __html: components.find((c) => c.id === design.components?.nose)?.svg_data || "",
                          }}
                        />
                      )}

                      {/* Mouth */}
                      {design.components?.mouth && (
                        <g
                          dangerouslySetInnerHTML={{
                            __html: components.find((c) => c.id === design.components?.mouth)?.svg_data || "",
                          }}
                        />
                      )}

                      {/* Accessories */}
                      {design.components?.accessories && (
                        <g
                          dangerouslySetInnerHTML={{
                            __html: components.find((c) => c.id === design.components?.accessories)?.svg_data || "",
                          }}
                        />
                      )}
                    </svg>

                    <h3 className="font-semibold mb-1">{design.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {new Date(design.created_at).toLocaleDateString()}
                    </p>

                    <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
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

                  <div className="px-4 pb-4">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEdit(design)
                        }}
                        className="flex-1 gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          togglePublic(design.id)
                        }}
                        className="gap-2"
                        title={design.is_public ? "Make private" : "Publish to gallery"}
                      >
                        {design.is_public ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleShare(design.id)
                        }}
                        className="gap-2"
                        title="Share design"
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(design.id)
                        }}
                        className="gap-2 text-destructive hover:text-destructive"
                        title="Delete design"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
