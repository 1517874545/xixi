"use client"

import { type Design, type Component } from "@/lib/mock-data"

interface DesignPreviewProps {
  design: Design
  components?: Component[]
  className?: string
}

export function DesignPreview({ design, components = [], className = "" }: DesignPreviewProps) {
  // 添加调试日志
  console.log('DesignPreview rendering:', {
    id: design.id,
    title: design.title,
    design_type: design.design_type,
    has_image_url: !!design.image_url,
    image_url_preview: design.image_url ? design.image_url.substring(0, 50) + '...' : 'none'
  })
  
  // 如果是AI图片类型，显示图片
  if (design.design_type === 'ai_image') {
    console.log('Rendering AI image for design:', design.id)
    if (design.image_url) {
      return (
        <div className={`w-full h-48 bg-muted rounded-lg overflow-hidden ${className}`}>
          <img
            src={design.image_url}
            alt={design.title}
            className="w-full h-full object-contain"
            onError={(e) => {
              console.error('Failed to load AI image:', design.image_url)
              // 如果图片加载失败，显示错误提示
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              const parent = target.parentElement
              if (parent && !parent.querySelector('.error-message')) {
                const errorDiv = document.createElement('div')
                errorDiv.className = 'error-message flex items-center justify-center h-full text-muted-foreground text-sm'
                errorDiv.textContent = '图片加载失败'
                parent.appendChild(errorDiv)
              }
            }}
          />
        </div>
      )
    } else {
      // 如果没有image_url，显示占位符
      return (
        <div className={`w-full h-48 bg-muted rounded-lg flex items-center justify-center ${className}`}>
          <span className="text-muted-foreground text-sm">AI图片URL缺失</span>
        </div>
      )
    }
  }

  // 否则显示SVG（原有逻辑）
  return (
    <svg
      viewBox="0 0 300 300"
      className={`w-full h-48 bg-muted rounded-lg ${className}`}
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
          style={{ color: design.components?.earsColor || design.components?.bodyColor }}
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
          style={{ color: design.components?.accessoriesColor || "#000000" }}
        />
      )}
    </svg>
  )
}

