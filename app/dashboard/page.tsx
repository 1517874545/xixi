"use client"

import { useState, useEffect } from "react"
import { useAuthApi } from "@/lib/auth-api-context"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts"
import { Users, Heart, MessageSquare, Star, TrendingUp, Download } from "lucide-react"
import { designsApi, likesApi, commentsApi } from "@/lib/api"
import { toast } from "sonner"

interface DashboardStats {
  totalDesigns: number
  totalLikes: number
  totalComments: number
  totalFavorites: number
  designsPerDay: { date: string; count: number }[]
  likesPerDay: { date: string; count: number }[]
  componentUsage: { name: string; count: number }[]
  popularDesigns: { title: string; likes: number; comments: number }[]
}

export default function DashboardPage() {
  const { user } = useAuthApi()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalDesigns: 0,
    totalLikes: 0,
    totalComments: 0,
    totalFavorites: 0,
    designsPerDay: [],
    likesPerDay: [],
    componentUsage: [],
    popularDesigns: []
  })
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d")

  const COLORS = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
  ]

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    fetchDashboardData()
  }, [user, timeRange])

  const fetchDashboardData = async () => {
    if (!user) return

    setLoading(true)
    try {
      // 获取用户的所有设计
      const designsResponse = await designsApi.getUserDesigns(user.id)
      const designs = designsResponse || []

      // 获取点赞和评论数据
      const likesResponse = await likesApi.getUserLikes(user.id)
      const commentsResponse = await commentsApi.getUserComments(user.id)

      // 计算统计数据
      const totalDesigns = designs.length
      const totalLikes = likesResponse?.length || 0
      const totalComments = commentsResponse?.length || 0

      // 计算每日数据
      const designsPerDay = calculateDailyData(designs, 'created_at')
      const likesPerDay = calculateDailyData(likesResponse || [], 'created_at')

      // 计算组件使用情况
      const componentUsage = calculateComponentUsage(designs)

      // 获取热门设计
      const popularDesigns = designs
        .map(design => ({
          title: design.title,
          likes: design.likes_count || 0,
          comments: design.comments_count || 0
        }))
        .sort((a, b) => b.likes - a.likes)
        .slice(0, 5)

      setStats({
        totalDesigns,
        totalLikes,
        totalComments,
        totalFavorites: 0, // 暂时设为0，后续可以添加收藏功能
        designsPerDay,
        likesPerDay,
        componentUsage,
        popularDesigns
      })
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      toast.error("获取数据失败")
    } finally {
      setLoading(false)
    }
  }

  const calculateDailyData = (data: any[], dateField: string) => {
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90
    const result = []
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const count = data.filter(item => {
        const itemDate = new Date(item[dateField]).toISOString().split('T')[0]
        return itemDate === dateStr
      }).length
      
      result.push({
        date: dateStr,
        count
      })
    }
    
    return result
  }

  const calculateComponentUsage = (designs: any[]) => {
    const usage: Record<string, number> = {}
    
    designs.forEach(design => {
      if (design.components) {
        Object.values(design.components).forEach((componentId: any) => {
          if (componentId && typeof componentId === 'string') {
            usage[componentId] = (usage[componentId] || 0) + 1
          }
        })
      }
    })
    
    return Object.entries(usage)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
  }

  const exportData = () => {
    const csvContent = [
      ['指标', '数值'],
      ['总作品数', stats.totalDesigns],
      ['总点赞数', stats.totalLikes],
      ['总评论数', stats.totalComments],
      ['总收藏数', stats.totalFavorites]
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `petcraft-dashboard-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    
    toast.success("数据导出成功")
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">加载数据中...</h1>
          <p className="text-muted-foreground">请稍等，我们正在获取您的统计数据</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">数据分析仪表板</h1>
            <p className="text-muted-foreground mt-2">查看您的创作数据和平台表现</p>
          </div>
          <Button onClick={exportData} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            导出数据
          </Button>
        </div>

        {/* 时间范围选择器 */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={timeRange === "7d" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange("7d")}
          >
            7天
          </Button>
          <Button
            variant={timeRange === "30d" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange("30d")}
          >
            30天
          </Button>
          <Button
            variant={timeRange === "90d" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange("90d")}
          >
            90天
          </Button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">总作品数</p>
                <p className="text-2xl font-bold">{stats.totalDesigns}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Heart className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">总点赞数</p>
                <p className="text-2xl font-bold">{stats.totalLikes}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <MessageSquare className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">总评论数</p>
                <p className="text-2xl font-bold">{stats.totalComments}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">总收藏数</p>
                <p className="text-2xl font-bold">{stats.totalFavorites}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* 图表区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* 作品创建趋势 */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              作品创建趋势
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.designsPerDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* 点赞趋势 */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Heart className="h-5 w-5" />
              点赞趋势
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.likesPerDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 组件使用情况 */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">组件使用情况</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.componentUsage}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {stats.componentUsage.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* 热门作品 */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">热门作品</h3>
            <div className="space-y-3">
              {stats.popularDesigns.map((design, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="font-medium truncate flex-1 mr-4">{design.title}</span>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      {design.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {design.comments}
                    </span>
                  </div>
                </div>
              ))}
              {stats.popularDesigns.length === 0 && (
                <p className="text-muted-foreground text-center py-8">暂无热门作品数据</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}