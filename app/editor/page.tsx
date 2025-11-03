"use client"

import { useState, useEffect } from "react"
import { useAuthApi } from "@/lib/auth-api-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { type Component, type Design } from "@/lib/mock-data"
import { Save, Download, Globe } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { designsApi } from "@/lib/api"
import ExportButton from "@/components/export-button"

export default function EditorPage() {
  const { user } = useAuthApi()
  const router = useRouter()
  const { toast } = useToast()

  const [editingDesignId, setEditingDesignId] = useState<string | null>(null)
  const [components, setComponents] = useState<Component[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedComponents, setSelectedComponents] = useState<Record<string, string>>({
    body: "",
    ears: "",
    eyes: "",
    nose: "",
    mouth: "",
    accessories: "",
    background: "",
  })
  const [colors, setColors] = useState({
    body: "#fbbf24",
    ears: "#fbbf24",
    accessories: "#ec4899",
  })
  const [title, setTitle] = useState("")
  const [isPublic, setIsPublic] = useState(false)
  const [activeTab, setActiveTab] = useState<Component["type"]>("body")

  const presetColors = [
    "#fbbf24", // amber
    "#f97316", // orange
    "#ef4444", // red
    "#ec4899", // pink
    "#a855f7", // purple
    "#3b82f6", // blue
    "#06b6d4", // cyan
    "#10b981", // green
    "#84cc16", // lime
    "#78716c", // stone
    "#ffffff", // white
    "#000000", // black
  ]

  // 从API获取组件数据
  useEffect(() => {
    const fetchComponents = async () => {
      try {
        const response = await fetch('/api/components')
        if (response.ok) {
          const data = await response.json()
          setComponents(data.components || [])
          
          // 设置默认选中的组件
          if (data.components && data.components.length > 0) {
            const defaultComponents: Record<string, string> = {}
            const types = ['body', 'ears', 'eyes', 'nose', 'mouth', 'accessories', 'background']
            
            types.forEach(type => {
              const typeComponents = data.components.filter((c: Component) => c.type === type)
              if (typeComponents.length > 0) {
                defaultComponents[type] = typeComponents[0].id
              }
            })
            
            setSelectedComponents(defaultComponents)
          }
        } else {
          console.error('Failed to fetch components:', response.status)
          toast({
            title: "Error",
            description: "Failed to load components. Please refresh the page.",
            variant: "destructive"
          })
        }
      } catch (error) {
        console.error('Error fetching components:', error)
        toast({
          title: "Error",
          description: "Failed to load components. Please check your connection.",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchComponents()
  }, [toast])

  const componentsByType = components.reduce(
    (acc, comp) => {
      if (!acc[comp.type]) acc[comp.type] = []
      acc[comp.type].push(comp)
      return acc
    },
    {} as Record<string, Component[]>,
  )

  const tabs: Component["type"][] = ["body", "ears", "eyes", "nose", "mouth", "accessories", "background"]

  useEffect(() => {
    const editingDesignStr = localStorage.getItem("petcraft_editing_design")
    if (editingDesignStr) {
      try {
        const design: Design = JSON.parse(editingDesignStr)
        setEditingDesignId(design.id)
        setTitle(design.title)

        // Load components
        if (design.components) {
          setSelectedComponents({
            body: design.components.body || "",
            ears: design.components.ears || "",
            eyes: design.components.eyes || "",
            nose: design.components.nose || "",
            mouth: design.components.mouth || "",
            accessories: design.components.accessories || "",
            background: design.components.background || "",
          })

          // Load colors if they exist
          if (design.components.bodyColor) {
            setColors({
              body: design.components.bodyColor,
              ears: design.components.bodyColor,
              accessories: "#ec4899",
            })
          }
        }

        // Clear the editing design from localStorage
        localStorage.removeItem("petcraft_editing_design")

        toast({
          title: "Design loaded",
          description: "You can now edit your design.",
        })
      } catch (error) {
        console.error("Failed to load design for editing:", error)
      }
    }
  }, [toast])

  const handleSave = async () => {
    // 临时解决方案：如果用户未登录，创建一个临时用户ID
    let userId = user?.id
    
    if (!userId) {
      // 检查本地存储是否有临时用户ID
      userId = localStorage.getItem('temp_user_id')
      
      if (!userId) {
        // 创建临时用户ID
        userId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        localStorage.setItem('temp_user_id', userId)
        
        toast({
          title: "使用临时账户",
          description: "您正在使用临时账户保存设计。建议注册账户以永久保存。",
        })
      }
    }

    if (!title.trim()) {
      toast({
        title: "标题不能为空",
        description: "请为您的设计输入一个标题。",
        variant: "destructive",
      })
      return
    }

    const design = {
      title,
      user_id: userId, // 使用用户ID（真实或临时）
      components: { 
        body: selectedComponents.body || '',
        ears: selectedComponents.ears || '',
        eyes: selectedComponents.eyes || '',
        nose: selectedComponents.nose || '',
        mouth: selectedComponents.mouth || '',
        accessories: selectedComponents.accessories || '',
        background: selectedComponents.background || '',
        bodyColor: colors.body,
        ...selectedComponents
      },
      is_public: isPublic,
    }

    try {
      let savedDesign
      
      if (editingDesignId) {
        // Update existing design using API
        savedDesign = await designsApi.update(editingDesignId, design)
        toast({
          title: "设计已更新",
          description: "您的更改已保存。",
        })
      } else {
        // Create new design using API
        savedDesign = await designsApi.create(design)
        toast({
          title: "设计已保存",
          description: "您的设计已成功创建。",
        })
      }
      
      console.log('Design saved successfully:', savedDesign)
      
      // 确保设计数据也保存到本地存储，作为备份
      if (typeof window !== 'undefined') {
        try {
          const savedDesigns = JSON.parse(localStorage.getItem("petcraft_designs") || "[]")
          const existingIndex = savedDesigns.findIndex((d: any) => d.id === savedDesign.id)
          
          if (existingIndex !== -1) {
            savedDesigns[existingIndex] = savedDesign
          } else {
            savedDesigns.push(savedDesign)
          }
          
          localStorage.setItem("petcraft_designs", JSON.stringify(savedDesigns))
          console.log('Design also saved to localStorage as backup')
        } catch (localError) {
          console.error('Failed to save design to localStorage:', localError)
        }
      }
      
      // 添加延迟以确保数据同步完成
      setTimeout(() => {
        router.push("/my-designs")
      }, 500)
    } catch (error) {
      console.error('Failed to save design:', error)
      
      // 获取详细的错误信息
      const errorMessage = error instanceof Error ? error.message : '保存设计失败，请重试'
      
      // 如果API保存失败，尝试保存到本地存储
      if (typeof window !== 'undefined') {
        try {
          const mockDesign = {
            id: editingDesignId || `local-${Date.now()}`,
            ...design,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            likes_count: 0,
            comments_count: 0
          }
          
          const savedDesigns = JSON.parse(localStorage.getItem("petcraft_designs") || "[]")
          const existingIndex = savedDesigns.findIndex((d: any) => d.id === mockDesign.id)
          
          if (existingIndex !== -1) {
            savedDesigns[existingIndex] = mockDesign
          } else {
            savedDesigns.push(mockDesign)
          }
          
          localStorage.setItem("petcraft_designs", JSON.stringify(savedDesigns))
          
          toast({
            title: "设计已保存到本地",
            description: "您的设计已保存到本地存储。请检查网络连接。",
          })
          
          router.push("/my-designs")
          return
        } catch (localError) {
          console.error('Failed to save design to localStorage:', localError)
        }
      }
      
      toast({
        title: "保存失败",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }

  const handleDownload = () => {
    const svg = document.getElementById("pet-canvas")
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const blob = new Blob([svgData], { type: "image/svg+xml" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${title || "pet-illustration"}.svg`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Loading Components...</h1>
          <p className="text-muted-foreground">Please wait while we load the pet components</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Loading Components...</h1>
          <p className="text-muted-foreground">Please wait while we load the pet components</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">{editingDesignId ? "Edit Your Pet" : "Create Your Pet"}</h1>

        <div className="grid lg:grid-cols-[1fr,400px] gap-8">
          {/* Canvas Area */}
          <div className="space-y-4">
            <Card className="p-8">
              <div className="flex justify-center">
                <svg
                  id="pet-canvas"
                  viewBox="0 0 300 300"
                  className="w-full max-w-md h-auto border-2 border-border rounded-lg"
                  style={{ backgroundColor: "#f9fafb" }}
                >
                  {/* Background */}
                  {selectedComponents.background && (
                    <g
                      dangerouslySetInnerHTML={{
                        __html: components.find((c) => c.id === selectedComponents.background)?.svg_data || "",
                      }}
                    />
                  )}

                  {/* Body */}
                  {selectedComponents.body && (
                    <g
                      dangerouslySetInnerHTML={{
                        __html: components.find((c) => c.id === selectedComponents.body)?.svg_data || "",
                      }}
                      style={{ color: colors.body }}
                    />
                  )}

                  {/* Ears */}
                  {selectedComponents.ears && (
                    <g
                      dangerouslySetInnerHTML={{
                        __html: components.find((c) => c.id === selectedComponents.ears)?.svg_data || "",
                      }}
                      style={{ color: colors.ears }}
                    />
                  )}

                  {/* Eyes */}
                  {selectedComponents.eyes && (
                    <g
                      dangerouslySetInnerHTML={{
                        __html: components.find((c) => c.id === selectedComponents.eyes)?.svg_data || "",
                      }}
                    />
                  )}

                  {/* Nose */}
                  {selectedComponents.nose && (
                    <g
                      dangerouslySetInnerHTML={{
                        __html: components.find((c) => c.id === selectedComponents.nose)?.svg_data || "",
                      }}
                    />
                  )}

                  {/* Mouth */}
                  {selectedComponents.mouth && (
                    <g
                      dangerouslySetInnerHTML={{
                        __html: components.find((c) => c.id === selectedComponents.mouth)?.svg_data || "",
                      }}
                    />
                  )}

                  {/* Accessories */}
                  {selectedComponents.accessories && (
                    <g
                      dangerouslySetInnerHTML={{
                        __html: components.find((c) => c.id === selectedComponents.accessories)?.svg_data || "",
                      }}
                      style={{ color: colors.accessories }}
                    />
                  )}
                </svg>
              </div>
            </Card>

            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Design Title</Label>
                  <Input
                    id="title"
                    placeholder="My Awesome Pet"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-sm">Customize Colors</h3>

                  {/* Body Color */}
                  <div className="space-y-2">
                    <Label htmlFor="body-color">Body Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="body-color"
                        type="color"
                        value={colors.body}
                        onChange={(e) => setColors((prev) => ({ ...prev, body: e.target.value }))}
                        className="w-16 h-10 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={colors.body}
                        onChange={(e) => setColors((prev) => ({ ...prev, body: e.target.value }))}
                        className="flex-1 font-mono text-sm"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {presetColors.map((color) => (
                        <button
                          key={`body-${color}`}
                          onClick={() => setColors((prev) => ({ ...prev, body: color }))}
                          className="w-8 h-8 rounded-md border-2 transition-all hover:scale-110"
                          style={{
                            backgroundColor: color,
                            borderColor: colors.body === color ? "#000" : "#e5e7eb",
                          }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Ears Color */}
                  <div className="space-y-2">
                    <Label htmlFor="ears-color">Ears Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="ears-color"
                        type="color"
                        value={colors.ears}
                        onChange={(e) => setColors((prev) => ({ ...prev, ears: e.target.value }))}
                        className="w-16 h-10 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={colors.ears}
                        onChange={(e) => setColors((prev) => ({ ...prev, ears: e.target.value }))}
                        className="flex-1 font-mono text-sm"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {presetColors.map((color) => (
                        <button
                          key={`ears-${color}`}
                          onClick={() => setColors((prev) => ({ ...prev, ears: color }))}
                          className="w-8 h-8 rounded-md border-2 transition-all hover:scale-110"
                          style={{
                            backgroundColor: color,
                            borderColor: colors.ears === color ? "#000" : "#e5e7eb",
                          }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Accessories Color */}
                  <div className="space-y-2">
                    <Label htmlFor="accessories-color">Accessories Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="accessories-color"
                        type="color"
                        value={colors.accessories}
                        onChange={(e) => setColors((prev) => ({ ...prev, accessories: e.target.value }))}
                        className="w-16 h-10 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={colors.accessories}
                        onChange={(e) => setColors((prev) => ({ ...prev, accessories: e.target.value }))}
                        className="flex-1 font-mono text-sm"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {presetColors.map((color) => (
                        <button
                          key={`accessories-${color}`}
                          onClick={() => setColors((prev) => ({ ...prev, accessories: color }))}
                          className="w-8 h-8 rounded-md border-2 transition-all hover:scale-110"
                          style={{
                            backgroundColor: color,
                            borderColor: colors.accessories === color ? "#000" : "#e5e7eb",
                          }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* 发布到画廊选项 */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is-public"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="is-public" className="flex items-center gap-2 cursor-pointer">
                      <Globe className="h-4 w-4" />
                      发布到社区画廊
                    </Label>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={handleSave} className="flex-1 gap-2">
                      <Save className="h-4 w-4" />
                      {editingDesignId ? "更新设计" : "保存设计"}
                    </Button>
                    <Button onClick={handleDownload} variant="outline" className="gap-2 bg-transparent">
                      <Download className="h-4 w-4" />
                      下载
                    </Button>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium mb-2 block">导出和分享</Label>
                    <ExportButton 
                      design={{
                        id: editingDesignId || "new-design",
                        title: title || "未命名设计",
                        components: selectedComponents
                      }}
                      svgElement={document.getElementById("pet-canvas") as SVGSVGElement}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Component Selector */}
          <div className="space-y-4">
            <Card className="p-4">
              <h2 className="font-semibold mb-4">Choose Components</h2>

              {/* Tabs */}
              <div className="flex flex-wrap gap-1 mb-4">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
                      activeTab === tab
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Component Grid */}
              <div className="grid grid-cols-2 gap-3 max-h-[600px] overflow-y-auto">
                {componentsByType[activeTab]?.map((component) => (
                  <button
                    key={component.id}
                    onClick={() => setSelectedComponents((prev) => ({ ...prev, [activeTab]: component.id }))}
                    className={`p-4 border-2 rounded-lg transition-all hover:border-primary ${
                      selectedComponents[activeTab] === component.id ? "border-primary bg-primary/5" : "border-border"
                    }`}
                  >
                    <svg viewBox="0 0 300 300" className="w-full h-24">
                      <g
                        dangerouslySetInnerHTML={{ __html: component.svg_data }}
                        style={{
                          color:
                            activeTab === "body"
                              ? colors.body
                              : activeTab === "ears"
                                ? colors.ears
                                : activeTab === "accessories"
                                  ? colors.accessories
                                  : undefined,
                        }}
                      />
                    </svg>
                    <p className="text-xs mt-2 font-medium">{component.name}</p>
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
