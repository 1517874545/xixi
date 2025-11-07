"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { mockComponents, mockDesigns, type Design } from "@/lib/mock-data"
import { User, Heart, Star, Users } from "lucide-react"
import { designsApi, likesApi } from "@/lib/api"
import { useAuthApi } from "@/lib/auth-api-context"
import { FollowButton } from "@/components/follow-button"
import { DesignPreview } from "@/components/design-preview"

export default function ProfilePage() {
  const { user } = useAuthApi()
  const [likedDesigns, setLikedDesigns] = useState<Design[]>([])
  const [userDesigns, setUserDesigns] = useState<Design[]>([])
  const [favoriteDesigns, setFavoriteDesigns] = useState<Design[]>([])
  const [followers, setFollowers] = useState<string[]>([])
  const [following, setFollowing] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState("designs")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadProfileData()
    }
  }, [user])

  const loadProfileData = async () => {
    if (!user) return
    
    // 在函数开始处定义 currentUser，让它在整个函数中可用
    const currentUser = user?.id || (typeof window !== 'undefined' ? localStorage.getItem('temp_user_id') : null) || 'demo-user'
    
    try {
      setLoading(true)

      // 获取当前用户的设计作品
      try {
        
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
        const userDesignsFromApi = await designsApi.getAll({ userId: currentUser })
        console.log('=== Profile Page: Loading Designs ===')
        console.log('Current user:', currentUser)
        console.log('Loaded designs from API:', userDesignsFromApi.length)
        console.log('All designs:', userDesignsFromApi.map(d => ({
          id: d.id,
          title: d.title,
          design_type: d.design_type,
          image_url: d.image_url ? 'has_url' : 'no_url',
          has_components: !!d.components,
          likes_count: d.likes_count,
          comments_count: d.comments_count
        })))
        
        // 合并API数据和本地存储数据，优先使用最新的数据
        const mergedDesigns = mergeDesigns(userDesignsFromApi, latestDesigns)
        
        // API 返回的数据应该已经包含了正确的 likes_count 和 comments_count
        // 因为 API 在查询时会从数据库统计这些数据
        // 如果没有，我们需要确保至少有一个默认值
        const designsWithCounts = mergedDesigns.map(design => ({
          ...design,
          likes_count: typeof design.likes_count === 'number' ? design.likes_count : 0,
          comments_count: typeof design.comments_count === 'number' ? design.comments_count : 0
        }))
        
        const totalLikes = designsWithCounts.reduce((sum, d) => sum + (d.likes_count || 0), 0)
        const totalComments = designsWithCounts.reduce((sum, d) => sum + (d.comments_count || 0), 0)
        console.log('Total likes calculated:', totalLikes)
        console.log('Total comments calculated:', totalComments)
        console.log('Final designs data:', designsWithCounts.map(d => ({
          id: d.id,
          likes: d.likes_count,
          comments: d.comments_count
        })))
        
        setUserDesigns(designsWithCounts)
      } catch (error) {
        console.error('Failed to load user designs:', error)
        
        // 如果API调用失败，尝试从本地存储加载
        if (typeof window !== 'undefined') {
          try {
            const savedDesigns = JSON.parse(localStorage.getItem("petcraft_designs") || "[]")
            
            // 只显示当前用户的设计
            const userSavedDesigns = savedDesigns
              .filter((d: any) => d.user_id === currentUser)
              .map((d: any) => ({
                ...d,
                likes_count: d.likes_count ?? 0,
                comments_count: d.comments_count ?? 0
              }))
            
            if (userSavedDesigns.length > 0) {
              setUserDesigns(userSavedDesigns)
              console.log('Loaded designs from localStorage:', userSavedDesigns.length)
            } else {
              setUserDesigns([])
            }
          } catch (localError) {
            console.error('Failed to load from localStorage:', localError)
            setUserDesigns([])
          }
        } else {
          setUserDesigns([])
        }
      }

      // 获取喜欢的作品
      let likedDesignIds: string[] = []
      const userId = user?.id || (typeof window !== 'undefined' ? localStorage.getItem('temp_user_id') : null)
      
      try {
        // 首先尝试从 API 获取（优先，确保数据准确性）
        if (userId) {
          try {
            const apiLikes = await likesApi.getUserLikes(userId)
            if (apiLikes && Array.isArray(apiLikes)) {
              likedDesignIds = apiLikes
              console.log('Loaded likes from API:', likedDesignIds.length)
            }
          } catch (apiError) {
            console.error('Failed to load likes from API:', apiError)
          }
        }
        
        // 如果 API 返回为空，尝试从本地存储获取
        if (likedDesignIds.length === 0 && typeof window !== 'undefined' && userId) {
          try {
            // 使用与 like-button 相同的存储键格式
            const key = `likes_${userId}`
            const savedLikes = JSON.parse(localStorage.getItem(key) || "[]")
            if (savedLikes && Array.isArray(savedLikes)) {
              likedDesignIds = savedLikes
              console.log('Loaded likes from localStorage:', likedDesignIds.length)
            }
            
            // 也检查旧的存储格式（向后兼容）
            if (likedDesignIds.length === 0) {
              const oldLikes = JSON.parse(localStorage.getItem("petcraft_likes") || "[]")
              if (oldLikes && Array.isArray(oldLikes)) {
                // 注意：旧格式是全局的，不能直接使用，除非确定是当前用户的
                // 但为了向后兼容，我们可以检查一下
                console.log('Found old format likes, but skipping for security (user-specific data needed)')
              }
            }
          } catch (localError) {
            console.error('Failed to load likes from localStorage:', localError)
          }
        }
      } catch (error) {
        console.error('Failed to load likes:', error)
        likedDesignIds = []
      }
      
      // 获取完整的设计对象
      const likedDesignsPromises = likedDesignIds.map(id => {
        return designsApi.getById(id).catch(() => {
          // 如果API获取失败，尝试从模拟数据中查找
          const mockDesign = mockDesigns.find(d => d.id === id)
          if (mockDesign) {
            return mockDesign
          }
          
          // 尝试从本地存储的设计中查找
          try {
            const savedDesigns = JSON.parse(localStorage.getItem("petcraft_designs") || "[]")
            const savedDesign = savedDesigns.find((d: Design) => d.id === id)
            if (savedDesign) {
              return savedDesign
            }
          } catch {
            // 忽略错误
          }
          
          return null
        })
      })
      
      const likedDesignsResults = await Promise.all(likedDesignsPromises)
      const likedDesigns = likedDesignsResults.filter(Boolean) as Design[]
      setLikedDesigns(likedDesigns)

      // 获取收藏的作品
      let favoriteDesignIds: string[] = []
      
      try {
        // 首先尝试从 API 获取收藏
        const userId = user?.id || localStorage.getItem('temp_user_id')
        if (userId) {
          try {
            const response = await fetch(`/api/favorites?userId=${userId}`)
            if (response.ok) {
              const data = await response.json()
              if (data.favorites && Array.isArray(data.favorites)) {
                favoriteDesignIds = data.favorites
                console.log('Loaded favorites from API:', favoriteDesignIds.length)
              }
            }
          } catch (apiError) {
            console.error('Failed to load favorites from API:', apiError)
          }
        }
        
        // 如果 API 返回为空，尝试从本地存储获取
        if (favoriteDesignIds.length === 0 && typeof window !== 'undefined') {
          const userId = user?.id || localStorage.getItem('temp_user_id')
          if (userId) {
            try {
              // 使用与 favorite-button 相同的存储键格式
              const key = `favorites_${userId}`
              const savedFavorites = JSON.parse(localStorage.getItem(key) || "[]")
              if (savedFavorites && Array.isArray(savedFavorites)) {
                favoriteDesignIds = savedFavorites
                console.log('Loaded favorites from localStorage:', favoriteDesignIds.length)
              }
              
              // 也检查旧的存储格式（向后兼容）
              if (favoriteDesignIds.length === 0) {
                const oldFavorites = JSON.parse(localStorage.getItem("petcraft_favorites") || "[]")
                if (oldFavorites && Array.isArray(oldFavorites)) {
                  favoriteDesignIds = oldFavorites
                  console.log('Loaded favorites from old localStorage format:', favoriteDesignIds.length)
                }
              }
            } catch (localError) {
              console.error('Failed to load favorites from localStorage:', localError)
            }
          }
        }
      } catch (error) {
        console.error('Failed to load favorites:', error)
      }
      
      // 获取完整的设计对象
      if (favoriteDesignIds.length > 0) {
        try {
          const favoriteDesignsPromises = favoriteDesignIds.map((id: string) => {
            return designsApi.getById(id).catch(() => {
              // 如果API获取失败，尝试从模拟数据中查找
              const mockDesign = mockDesigns.find(d => d.id === id)
              if (mockDesign) {
                return mockDesign
              }
              
              // 尝试从本地存储的设计中查找
              try {
                const savedDesigns = JSON.parse(localStorage.getItem("petcraft_designs") || "[]")
                const savedDesign = savedDesigns.find((d: Design) => d.id === id)
                if (savedDesign) {
                  return savedDesign
                }
              } catch {
                // 忽略错误
              }
              
              return null
            })
          })
          
          const favoriteDesignsResults = await Promise.all(favoriteDesignsPromises)
          const favoriteDesigns = favoriteDesignsResults.filter(Boolean) as Design[]
          setFavoriteDesigns(favoriteDesigns)
          console.log('Loaded favorite designs:', favoriteDesigns.length)
        } catch (error) {
          console.error('Failed to load favorite designs:', error)
          setFavoriteDesigns([])
        }
      } else {
        setFavoriteDesigns([])
      }

      // 获取关注数据（优先从API获取，然后fallback到本地存储）
      if (currentUser && currentUser !== 'demo-user') {
        try {
          // 获取粉丝（关注我的人）
          const followersResponse = await fetch(`/api/follows?userId=${currentUser}`)
          if (followersResponse.ok) {
            const followersData = await followersResponse.json()
            setFollowers(followersData.followers || [])
          } else {
            throw new Error('Failed to fetch followers')
          }

          // 获取关注的人（我关注的人）
          const followingResponse = await fetch(`/api/follows?followerId=${currentUser}`)
          if (followingResponse.ok) {
            const followingData = await followingResponse.json()
            setFollowing(followingData.follows || [])
          } else {
            throw new Error('Failed to fetch following')
          }
        } catch (apiError) {
          console.error('Failed to load follow data from API:', apiError)
          // Fallback到本地存储
          if (typeof window !== 'undefined') {
            try {
              const savedFollowers = JSON.parse(localStorage.getItem("petcraft_followers") || "[]")
              const savedFollowing = JSON.parse(localStorage.getItem("petcraft_following") || "[]")
              
              setFollowers(savedFollowers)
              setFollowing(savedFollowing)
            } catch (localError) {
              console.error('Failed to load follow data from localStorage:', localError)
              setFollowers([])
              setFollowing([])
            }
          } else {
            setFollowers([])
            setFollowing([])
          }
        }
      } else {
        // 如果没有有效的用户ID，从本地存储加载或设置为空
        if (typeof window !== 'undefined') {
          try {
            const savedFollowers = JSON.parse(localStorage.getItem("petcraft_followers") || "[]")
            const savedFollowing = JSON.parse(localStorage.getItem("petcraft_following") || "[]")
            
            setFollowers(savedFollowers)
            setFollowing(savedFollowing)
          } catch (localError) {
            console.error('Failed to load follow data from localStorage:', localError)
            setFollowers([])
            setFollowing([])
          }
        } else {
          setFollowers([])
          setFollowing([])
        }
      }

    } catch (error) {
      console.error('Failed to load profile data:', error)
      setLikedDesigns([])
      setUserDesigns([])
      setFavoriteDesigns([])
      setFollowers([])
      setFollowing([])
    } finally {
      setLoading(false)
    }
  }

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

  // 渲染设计卡片
  const renderDesignCard = (design: Design) => (
    <Link key={design.id} href={`/design/${design.id}`}>
      <Card className="p-4 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]">
        <div className="mb-4">
          <DesignPreview 
            design={design} 
            components={mockComponents}
            className="hover:scale-105 transition-transform"
          />
        </div>
        <div>
          <h3 className="font-semibold mb-1">{design.title}</h3>
          <p className="text-sm text-muted-foreground">{design.user_name || "Anonymous"}</p>
        </div>
      </Card>
    </Link>
  )

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-24 bg-muted rounded-lg mb-8"></div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
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
              <h1 className="text-2xl font-bold mb-2">{user?.name || user?.email?.split('@')[0] || 'User'}</h1>
              <p className="text-muted-foreground mb-4">{user?.email || 'No email'}</p>
              <div className="flex gap-6 text-sm">
                <div>
                  <span className="font-semibold">{userDesigns.length}</span>
                  <span className="text-muted-foreground ml-1">作品</span>
                </div>
                <div>
                  <span className="font-semibold">
                    {userDesigns.reduce((sum, d) => sum + (d.likes_count || 0), 0)}
                  </span>
                  <span className="text-muted-foreground ml-1">总点赞</span>
                </div>
                <div>
                  <span className="font-semibold">
                    {userDesigns.reduce((sum, d) => sum + (d.comments_count || 0), 0)}
                  </span>
                  <span className="text-muted-foreground ml-1">总评论</span>
                </div>
                <div>
                  <span className="font-semibold">
                    {followers.length}
                  </span>
                  <span className="text-muted-foreground ml-1">粉丝</span>
                </div>
                <div>
                  <span className="font-semibold">
                    {following.length}
                  </span>
                  <span className="text-muted-foreground ml-1">关注</span>
                </div>
                <div>
                  <span className="font-semibold">
                    {favoriteDesigns.length}
                  </span>
                  <span className="text-muted-foreground ml-1">收藏</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="designs" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              我的作品
            </TabsTrigger>
            <TabsTrigger value="likes" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              点赞作品
            </TabsTrigger>
            <TabsTrigger value="favorites" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              收藏作品
            </TabsTrigger>
            <TabsTrigger value="follows" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              关注/粉丝
            </TabsTrigger>
          </TabsList>

          {/* 我的作品 */}
          <TabsContent value="designs">
            {userDesigns.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">还没有创建任何作品。开始创作吧！</p>
                <Link href="/editor" className="text-primary hover:underline mt-2 inline-block">
                  去创作
                </Link>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {userDesigns.map(renderDesignCard)}
              </div>
            )}
          </TabsContent>

          {/* 点赞作品 */}
          <TabsContent value="likes">
            {likedDesigns.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">还没有点赞任何作品。去画廊看看吧！</p>
                <Link href="/gallery" className="text-primary hover:underline mt-2 inline-block">
                  去画廊
                </Link>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {likedDesigns.map(renderDesignCard)}
              </div>
            )}
          </TabsContent>

          {/* 收藏作品 */}
          <TabsContent value="favorites">
            {favoriteDesigns.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">还没有收藏任何作品。去发现更多精彩作品吧！</p>
                <Link href="/gallery" className="text-primary hover:underline mt-2 inline-block">
                  去画廊
                </Link>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {favoriteDesigns.map(renderDesignCard)}
              </div>
            )}
          </TabsContent>

          {/* 关注/粉丝 */}
          <TabsContent value="follows">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  粉丝 ({followers.length})
                </h3>
                {followers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">还没有粉丝</p>
                ) : (
                  <div className="space-y-3">
                    {followers.map((followerId, index) => (
                      <div key={followerId} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <span>用户 {followerId.slice(0, 8)}...</span>
                        </div>
                        <FollowButton targetUserId={followerId} />
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  关注 ({following.length})
                </h3>
                {following.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">还没有关注任何人</p>
                ) : (
                  <div className="space-y-3">
                    {following.map((followingId, index) => (
                      <div key={followingId} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <span>用户 {followingId.slice(0, 8)}...</span>
                        </div>
                        <FollowButton targetUserId={followingId} />
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}