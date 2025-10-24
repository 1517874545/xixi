"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { mockComponents, type Design } from "@/lib/mock-data"
import { Trash2, Eye, EyeOff, Edit, Share2, Heart, MessageCircle, TrendingUp, Calendar } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { designsApi } from "@/lib/api"

export default function MyDesignsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [designs, setDesigns] = useState<Design[]>([])
  const [filteredDesigns, setFilteredDesigns] = useState<Design[]>([])
  const [sortBy, setSortBy] = useState<"date" | "likes">("date")
  const [filterBy, setFilterBy] = useState<"all" | "public" | "private">("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
      return
    }

    if (user) {
      loadDesigns()
    }
  }, [user, authLoading, router])

  const loadDesigns = async () => {
    try {
      setLoading(true)
      // 加载所有设计（包括公开和私有）
      const userDesigns = await designsApi.getAll()
      
      // 从本地存储中获取最新的点赞和评论数据
      if (typeof window !== 'undefined') {
        try {
          const savedDesigns = JSON.parse(localStorage.getItem("petcraft_designs") || "[]")
          const savedLikes = JSON.parse(localStorage.getItem("petcraft_likes") || "[]")
          const savedComments = JSON.parse(localStorage.getItem("petcraft_comments") || "[]")
          
          // 更新设计数据，优先使用本地存储的数据
          const updatedDesigns = userDesigns.map(design => {
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
          setDesigns(userDesigns)
        }
      } else {
        setDesigns(userDesigns)
      }
    } catch (error) {
      console.error('Failed to load designs:', error)
      toast({
        title: "Error",
        description: "Failed to load your designs",
        variant: "destructive"
      })
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

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this design?")) return

    try {
      await designsApi.delete(id)
      const updatedDesigns = designs.filter((d) => d.id !== id)
      setDesigns(updatedDesigns)
      toast({
        title: "Design deleted",
        description: "Your design has been removed.",
      })
    } catch (error) {
      console.error('Failed to delete design:', error)
      toast({
        title: "Error",
        description: "Failed to delete design",
        variant: "destructive"
      })
    }
  }

  const togglePublic = async (id: string) => {
    const design = designs.find((d) => d.id === id)

    if (design && !design.is_public) {
      if (!confirm("Make this design public? It will be visible to everyone in the community gallery.")) {
        return
      }
    }

    try {
      const updatedDesign = await designsApi.update(id, { is_public: !design?.is_public })
      const updatedDesigns = designs.map((d) => (d.id === id ? updatedDesign : d))
      setDesigns(updatedDesigns)

      toast({
        title: updatedDesign.is_public ? "Design published" : "Design unpublished",
        description: updatedDesign.is_public
          ? "Your design is now visible in the public gallery."
          : "Your design is now private.",
      })
    } catch (error) {
      console.error('Failed to update design visibility:', error)
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
                          style={{ color: design.components?.bodyColor }}
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
