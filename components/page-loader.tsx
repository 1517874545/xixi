"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Card } from "@/components/ui/card"

interface PageLoaderProps {
  /**
   * 加载模式：
   * - "grid" - 网格布局（用于设计列表）
   * - "stats" - 统计卡片布局（用于统计页面）
   * - "simple" - 简单居中布局（用于一般页面）
   */
  variant?: "grid" | "stats" | "simple"
  /**
   * 显示的项目数量
   */
  count?: number
  /**
   * 自定义加载文本
   */
  message?: string
  /**
   * 是否显示顶部进度指示器
   */
  showProgress?: boolean
}

export function PageLoader({
  variant = "simple",
  count = 6,
  message,
  showProgress = true,
}: PageLoaderProps) {
  // 顶部进度条
  const ProgressBar = () => (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-muted overflow-hidden">
      <div 
        className="h-full bg-primary progress-bar-shimmer"
        style={{
          background: 'linear-gradient(90deg, transparent, hsl(var(--primary)), transparent)',
          width: '30%',
        }}
      />
    </div>
  )

  // 网格布局（用于设计列表）
  if (variant === "grid") {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {showProgress && <ProgressBar />}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(count)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="px-4 pt-3 pb-0">
                  <Skeleton className="h-6 w-24 mb-3" />
                </div>
                <div className="px-4 pb-4">
                  <Skeleton className="w-full h-48 rounded-lg mb-4" />
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-3" />
                  <div className="flex items-center gap-4 mb-4">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-8 flex-1" />
                    <Skeleton className="h-8 w-10" />
                    <Skeleton className="h-8 w-10" />
                    <Skeleton className="h-8 w-10" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // 统计卡片布局
  if (variant === "stats") {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {showProgress && <ProgressBar />}
          <div className="mb-6">
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-5 w-64" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-7 w-16 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(Math.min(count, 6))].map((_, i) => (
              <Card key={i} className="p-4">
                <Skeleton className="w-full h-48 rounded-lg mb-4" />
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // 简单居中布局
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto text-center">
        {showProgress && <ProgressBar />}
        <div className="flex flex-col items-center justify-center gap-4">
          <Spinner className="h-8 w-8 text-primary" />
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">
              {message || "加载中..."}
            </h2>
            <p className="text-muted-foreground">
              请稍候，我们正在为您加载内容
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

