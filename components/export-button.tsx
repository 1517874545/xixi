"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Share2, FileText, Image } from "lucide-react"
import { toast } from "sonner"

interface ExportButtonProps {
  design: {
    id: string
    title: string
    components: any
  }
  svgElement?: SVGSVGElement | null
}

export default function ExportButton({ design, svgElement }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [svgCanvas, setSvgCanvas] = useState<SVGSVGElement | null>(null)

  useEffect(() => {
    // 等待页面加载完成后获取SVG元素
    const timer = setTimeout(() => {
      const canvas = document.getElementById("pet-canvas") as unknown as SVGSVGElement
      setSvgCanvas(canvas)
    }, 100)
    
    return () => clearTimeout(timer)
  }, [])

  const exportAsSVG = async () => {
    const targetSvg = svgElement || svgCanvas
    if (!targetSvg) {
      toast.error("无法获取SVG元素，请确保设计已加载完成")
      return
    }

    setIsExporting(true)
    
    try {
      const svgData = new XMLSerializer().serializeToString(targetSvg)
      const blob = new Blob([svgData], { type: "image/svg+xml" })
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement("a")
      a.href = url
      a.download = `${design.title || "petcraft-design"}.svg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success("SVG导出成功")
    } catch (error) {
      toast.error("SVG导出失败")
      console.error("Export SVG error:", error)
    } finally {
      setIsExporting(false)
    }
  }

  const exportAsPNG = async () => {
    const targetSvg = svgElement || svgCanvas
    if (!targetSvg) {
      toast.error("无法获取SVG元素，请确保设计已加载完成")
      return
    }

    setIsExporting(true)
    
    try {
      const svgData = new XMLSerializer().serializeToString(targetSvg)
      const img = document.createElement('img')
      
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        
        if (!ctx) {
          toast.error("无法创建画布")
          return
        }
        
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)
        
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `${design.title || "petcraft-design"}.png`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
            toast.success("PNG导出成功")
          }
        }, "image/png")
      }
      
      img.src = "data:image/svg+xml;base64," + btoa(encodeURIComponent(svgData))
    } catch (error) {
      toast.error("PNG导出失败")
      console.error("Export PNG error:", error)
    } finally {
      setIsExporting(false)
    }
  }

  const shareDesign = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: design.title || "PetCraft 设计",
          text: `看看我在 PetCraft Studio 创作的宠物插画：${design.title}`,
          url: window.location.href,
        })
        toast.success("分享成功")
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          toast.error("分享失败")
        }
      }
    } else {
      // 复制链接到剪贴板
      try {
        await navigator.clipboard.writeText(window.location.href)
        toast.success("链接已复制到剪贴板")
      } catch (error) {
        toast.error("复制链接失败")
      }
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={exportAsSVG}
        disabled={isExporting}
        className="flex items-center gap-2"
      >
        <FileText className="h-4 w-4" />
        SVG
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={exportAsPNG}
        disabled={isExporting}
        className="flex items-center gap-2"
      >
        <Image className="h-4 w-4" />
        PNG
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={shareDesign}
        className="flex items-center gap-2"
      >
        <Share2 className="h-4 w-4" />
        分享
      </Button>
    </div>
  )
}