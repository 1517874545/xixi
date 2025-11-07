"use client"

import { useState, useEffect } from "react"
import { useAuthApi } from "@/lib/auth-api-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { type Component, type Design } from "@/lib/mock-data"
import { Save, Download, Globe, Sparkles, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { designsApi } from "@/lib/api"
import ExportButton from "@/components/export-button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { TagInput } from "@/components/tag-input"

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
  const [tags, setTags] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<Component["type"] | "ai">("body")
  
  // AI创作相关状态
  const [aiPrompt, setAiPrompt] = useState("")
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiGeneratedImageUrl, setAiGeneratedImageUrl] = useState<string | null>(null)

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
      userId = localStorage.getItem('temp_user_id') || undefined
      
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
      
      // 保存标签（如果有）
      if (tags.length > 0 && savedDesign.id) {
        try {
          await fetch('/api/tags', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              designId: savedDesign.id,
              tagNames: tags
            })
          })
          console.log('Tags saved successfully')
        } catch (tagError) {
          console.error('Failed to save tags:', tagError)
          // 标签保存失败不影响设计保存，只记录错误
        }
      }
      
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

  // AI生成图片
  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) {
      toast({
        title: "请输入描述",
        description: "请描述你想生成的宠物设计",
        variant: "destructive"
      })
      return
    }

    let userId = user?.id
    if (!userId) {
      userId = localStorage.getItem('temp_user_id') || `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('temp_user_id', userId)
    }

    setAiGenerating(true)
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: aiPrompt.trim(),
          userId: userId,
        }),
      })

      // 先获取响应文本（只能读取一次）
      const responseText = await response.text()
      console.log('AI generation response text:', responseText)
      
      // 尝试解析 JSON
      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error('Failed to parse response JSON:', parseError)
        console.error('Response text:', responseText.substring(0, 200))
        throw new Error('服务器返回了无效的响应格式')
      }

      // 检查响应状态
      if (!response.ok) {
        throw new Error(data.error || `生成失败: ${response.status}`)
      }

      // 检查数据是否成功
      if (data.success && data.imageUrl) {
        setAiGeneratedImageUrl(data.imageUrl)
        
        // 自动设置标题（如果还没有）
        if (!title) {
          setTitle(aiPrompt.slice(0, 30))
        }
        
        toast({
          title: "生成成功！",
          description: "图片已生成，可以保存了",
        })
      } else {
        throw new Error(data.error || '生成失败')
      }
    } catch (error) {
      console.error('AI generation error:', error)
      toast({
        title: "生成失败",
        description: error instanceof Error ? error.message : '请稍后重试',
        variant: "destructive"
      })
    } finally {
      setAiGenerating(false)
    }
  }

  // 保存AI生成的设计
  const handleSaveAIDesign = async () => {
    if (!aiGeneratedImageUrl) {
      toast({
        title: "没有可保存的图片",
        description: "请先生成图片",
        variant: "destructive"
      })
      return
    }

    // AI设计必须登录才能保存
    if (!user?.id) {
      toast({
        title: "请先登录",
        description: "保存AI设计需要登录账户。请先注册或登录。",
        variant: "destructive"
      })
      // 可选：跳转到登录页面
      setTimeout(() => {
        router.push('/login')
      }, 1500)
      return
    }

    const userId = user.id

    if (!title.trim()) {
      toast({
        title: "标题不能为空",
        description: "请为您的设计输入一个标题",
        variant: "destructive"
      })
      return
    }

    try {
      // 先上传图片到Supabase Storage（如果还没有）
      let finalImageUrl = aiGeneratedImageUrl
      
      try {
        const uploadResponse = await fetch('/api/ai/upload-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageUrl: aiGeneratedImageUrl,
            userId: userId,
          }),
        })

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          if (uploadData.url) {
            finalImageUrl = uploadData.url
          }
        }
      } catch (uploadError) {
        console.warn('Image upload failed, using original URL:', uploadError)
        // 如果上传失败，使用原始URL
      }

      // 保存到数据库
      const design = {
        title,
        user_id: userId,
        design_type: 'ai_image' as const,
        image_url: finalImageUrl,
        ai_metadata: {
          prompt: aiPrompt,
          model: 'doubao-seedream-4-0-250828',
          generated_at: new Date().toISOString(),
        },
        is_public: isPublic,
      }

      console.log('Saving AI design to database:', design)
      const savedDesign = await designsApi.create(design)
      console.log('Design saved successfully:', savedDesign)
      
      if (!savedDesign || !savedDesign.id) {
        throw new Error('保存失败：服务器未返回有效的设计数据')
      }
      
      toast({
        title: "设计已保存",
        description: "您的AI设计已成功保存",
      })
      
      // 保存标签（如果有）
      if (tags.length > 0 && savedDesign.id) {
        try {
          await fetch('/api/tags', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              designId: savedDesign.id,
              tagNames: tags
            })
          })
          console.log('Tags saved successfully')
        } catch (tagError) {
          console.error('Failed to save tags:', tagError)
          // 标签保存失败不影响设计保存，只记录错误
        }
      }

      // 清空AI相关状态
      setAiPrompt("")
      setAiGeneratedImageUrl(null)
      
      // 等待更长时间确保数据库同步
      setTimeout(() => {
        router.push("/my-designs")
        // 强制刷新页面以确保获取最新数据
        router.refresh()
      }, 1000)
    } catch (error) {
      console.error('Failed to save AI design:', error)
      const errorMessage = error instanceof Error ? error.message : '保存失败，请重试'
      toast({
        title: "保存失败",
        description: errorMessage,
        variant: "destructive"
      })
    }
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

                {/* 标签输入 */}
                <div>
                  <Label htmlFor="tags">Tags (optional)</Label>
                  <TagInput
                    value={tags}
                    onChange={setTags}
                    placeholder="添加标签（如：可爱、猫咪、卡通）"
                    maxTags={10}
                    showSuggestions={true}
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
                      aria-label="发布到社区画廊"
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
                      svgElement={document.getElementById("pet-canvas") as unknown as SVGSVGElement}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Component Selector */}
          <div className="space-y-4">
            <Card className="p-4">
              <Tabs value={activeTab === "ai" ? "ai" : "components"} onValueChange={(v) => {
                if (v === "ai") {
                  setActiveTab("ai")
                } else {
                  setActiveTab(v as Component["type"])
                }
              }}>
                <TabsList className="w-full mb-4">
                  <TabsTrigger value="components" className="flex-1">组件</TabsTrigger>
                  <TabsTrigger value="ai" className="flex-1 gap-1">
                    <Sparkles className="h-4 w-4" />
                    AI创作
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="components">
                  <h2 className="font-semibold mb-4">Choose Components</h2>

                  {/* Component Type Tabs */}
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
                </TabsContent>

                <TabsContent value="ai" className="space-y-4">
                  <h2 className="font-semibold mb-4">AI 智能创作</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="ai-prompt">描述你想生成的宠物</Label>
                      <Textarea
                        id="ai-prompt"
                        placeholder="例如：一只可爱的橙色小猫，大眼睛，戴着粉色蝴蝶结，卡通风格"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        rows={4}
                        className="mt-2"
                        disabled={aiGenerating}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        详细描述你想要的宠物外观、颜色、表情等
                      </p>
                    </div>

                    <Button
                      onClick={handleAIGenerate}
                      disabled={aiGenerating || !aiPrompt.trim()}
                      className="w-full"
                    >
                      {aiGenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          生成中...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          生成设计
                        </>
                      )}
                    </Button>

                    {aiGeneratedImageUrl && (
                      <div className="space-y-4">
                        <div className="border-2 border-border rounded-lg p-4">
                          <Label className="mb-2 block">生成的图片预览</Label>
                          <img
                            src={aiGeneratedImageUrl}
                            alt="AI生成的设计"
                            className="w-full rounded-lg"
                          />
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            onClick={handleSaveAIDesign}
                            className="flex-1"
                            variant="default"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            保存设计
                          </Button>
                          <Button
                            onClick={async () => {
                              if (!aiGeneratedImageUrl) return
                              
                              try {
                                toast({
                                  title: "准备下载",
                                  description: "正在获取图片...",
                                })
                                
                                // 方法1：直接使用 URL（适用于同域或允许跨域的图片）
                                const link = document.createElement('a')
                                link.href = aiGeneratedImageUrl
                                link.download = `${title || 'ai-pet-illustration'}-${Date.now()}.png`
                                link.target = '_blank'
                                
                                // 尝试通过 fetch 获取图片（处理跨域情况）
                                try {
                                  const response = await fetch(aiGeneratedImageUrl, { mode: 'cors' })
                                  if (response.ok) {
                                    const blob = await response.blob()
                                    const blobUrl = URL.createObjectURL(blob)
                                    link.href = blobUrl
                                    
                                    document.body.appendChild(link)
                                    link.click()
                                    document.body.removeChild(link)
                                    
                                    // 清理 blob URL
                                    setTimeout(() => URL.revokeObjectURL(blobUrl), 100)
                                  } else {
                                    throw new Error('Fetch failed')
                                  }
                                } catch (fetchError) {
                                  // 如果 fetch 失败（跨域等），直接使用原始链接
                                  console.warn('Fetch failed, using direct link:', fetchError)
                                  document.body.appendChild(link)
                                  link.click()
                                  document.body.removeChild(link)
                                }
                                
                                toast({
                                  title: "下载成功",
                                  description: "图片已开始下载",
                                })
                              } catch (error) {
                                console.error('Download error:', error)
                                toast({
                                  title: "下载失败",
                                  description: "请尝试右键图片另存为",
                                  variant: "destructive"
                                })
                              }
                            }}
                            variant="outline"
                            className="gap-2"
                          >
                            <Download className="h-4 w-4" />
                            下载
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
