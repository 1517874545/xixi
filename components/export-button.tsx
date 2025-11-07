"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Share2, FileText, Image, Download, ChevronDown } from "lucide-react"
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

  const exportAsRaster = async (format: 'png' | 'jpg', size: 'small' | 'medium' | 'large' = 'medium') => {
    const targetSvg = svgElement || svgCanvas
    if (!targetSvg) {
      toast.error("无法获取SVG元素，请确保设计已加载完成")
      return
    }

    setIsExporting(true)
    
    try {
      // 定义尺寸
      const sizes = {
        small: 512,
        medium: 1024,
        large: 2048
      }
      const targetSize = sizes[size]
      
      const svgData = new XMLSerializer().serializeToString(targetSvg)
      const img = document.createElement('img')
      
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        
        if (!ctx) {
          toast.error("无法创建画布")
          setIsExporting(false)
          return
        }
        
        // 设置画布尺寸
        const aspectRatio = img.width / img.height
        canvas.width = targetSize
        canvas.height = targetSize / aspectRatio
        
        // JPG格式使用白色背景
        if (format === 'jpg') {
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
        }
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        const mimeType = format === 'png' ? 'image/png' : 'image/jpeg'
        const quality = format === 'jpg' ? 0.95 : undefined
        
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `${design.title || "petcraft-design"}-${size}.${format}`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
            toast.success(`${format.toUpperCase()} 导出成功（${size}）`)
            setIsExporting(false)
          }
        }, mimeType, quality)
      }
      
      img.onerror = () => {
        toast.error("图片加载失败")
        setIsExporting(false)
      }
      
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
      img.src = URL.createObjectURL(svgBlob)
    } catch (error) {
      toast.error(`${format.toUpperCase()} 导出失败`)
      console.error("Export error:", error)
      setIsExporting(false)
    }
  }

  const exportAsPNG = (size: 'small' | 'medium' | 'large' = 'medium') => exportAsRaster('png', size)
  const exportAsJPG = (size: 'small' | 'medium' | 'large' = 'medium') => exportAsRaster('jpg', size)

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
      {/* SVG 导出 */}
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
      
      {/* PNG 导出（多尺寸） */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={isExporting}
            className="flex items-center gap-1"
          >
            <Image className="h-4 w-4" />
            PNG
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>选择尺寸</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => exportAsPNG('small')}>
            <Download className="h-4 w-4 mr-2" />
            小尺寸 (512px)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => exportAsPNG('medium')}>
            <Download className="h-4 w-4 mr-2" />
            中尺寸 (1024px)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => exportAsPNG('large')}>
            <Download className="h-4 w-4 mr-2" />
            大尺寸 (2048px)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* JPG 导出 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={isExporting}
            className="flex items-center gap-1"
          >
            <Image className="h-4 w-4" />
            JPG
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>选择尺寸</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => exportAsJPG('small')}>
            <Download className="h-4 w-4 mr-2" />
            小尺寸 (512px)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => exportAsJPG('medium')}>
            <Download className="h-4 w-4 mr-2" />
            中尺寸 (1024px)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => exportAsJPG('large')}>
            <Download className="h-4 w-4 mr-2" />
            大尺寸 (2048px)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* 分享 */}
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