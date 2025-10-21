"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { mockComponents, type Component, type Design } from "@/lib/mock-data"
import { Save, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function EditorPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [editingDesignId, setEditingDesignId] = useState<string | null>(null)

  const [selectedComponents, setSelectedComponents] = useState<Record<string, string>>({
    body: "1",
    ears: "20",
    eyes: "40",
    nose: "60",
    mouth: "80",
    accessories: "109",
    background: "120",
  })
  const [colors, setColors] = useState({
    body: "#fbbf24",
    ears: "#fbbf24",
    accessories: "#ec4899",
  })
  const [title, setTitle] = useState("")
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

  const componentsByType = mockComponents.reduce(
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
            body: design.components.body || "1",
            ears: design.components.ears || "20",
            eyes: design.components.eyes || "40",
            nose: design.components.nose || "60",
            mouth: design.components.mouth || "80",
            accessories: design.components.accessories || "109",
            background: design.components.background || "120",
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

  const handleSave = () => {
    if (!user) {
      router.push("/login")
      return
    }

    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your design.",
        variant: "destructive",
      })
      return
    }

    const design = {
      title,
      components: { ...selectedComponents, bodyColor: colors.body },
      is_public: false,
    }

    const savedDesigns = JSON.parse(localStorage.getItem("petcraft_designs") || "[]")

    if (editingDesignId) {
      // Update existing design
      const designIndex = savedDesigns.findIndex((d: Design) => d.id === editingDesignId)
      if (designIndex !== -1) {
        savedDesigns[designIndex] = {
          ...savedDesigns[designIndex],
          ...design,
          id: editingDesignId,
        }
        toast({
          title: "Design updated",
          description: "Your changes have been saved.",
        })
      }
    } else {
      // Create new design
      savedDesigns.push({
        ...design,
        id: Date.now().toString(),
        user_id: user.id,
        created_at: new Date().toISOString(),
        likes_count: 0,
        comments_count: 0,
      })
      toast({
        title: "Design saved",
        description: "Your design has been created successfully.",
      })
    }

    localStorage.setItem("petcraft_designs", JSON.stringify(savedDesigns))
    router.push("/my-designs")
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
                        __html: mockComponents.find((c) => c.id === selectedComponents.background)?.svg_data || "",
                      }}
                    />
                  )}

                  {/* Body */}
                  {selectedComponents.body && (
                    <g
                      dangerouslySetInnerHTML={{
                        __html: mockComponents.find((c) => c.id === selectedComponents.body)?.svg_data || "",
                      }}
                      style={{ color: colors.body }}
                    />
                  )}

                  {/* Ears */}
                  {selectedComponents.ears && (
                    <g
                      dangerouslySetInnerHTML={{
                        __html: mockComponents.find((c) => c.id === selectedComponents.ears)?.svg_data || "",
                      }}
                      style={{ color: colors.ears }}
                    />
                  )}

                  {/* Eyes */}
                  {selectedComponents.eyes && (
                    <g
                      dangerouslySetInnerHTML={{
                        __html: mockComponents.find((c) => c.id === selectedComponents.eyes)?.svg_data || "",
                      }}
                    />
                  )}

                  {/* Nose */}
                  {selectedComponents.nose && (
                    <g
                      dangerouslySetInnerHTML={{
                        __html: mockComponents.find((c) => c.id === selectedComponents.nose)?.svg_data || "",
                      }}
                    />
                  )}

                  {/* Mouth */}
                  {selectedComponents.mouth && (
                    <g
                      dangerouslySetInnerHTML={{
                        __html: mockComponents.find((c) => c.id === selectedComponents.mouth)?.svg_data || "",
                      }}
                    />
                  )}

                  {/* Accessories */}
                  {selectedComponents.accessories && (
                    <g
                      dangerouslySetInnerHTML={{
                        __html: mockComponents.find((c) => c.id === selectedComponents.accessories)?.svg_data || "",
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

                <div className="flex gap-2">
                  <Button onClick={handleSave} className="flex-1 gap-2">
                    <Save className="h-4 w-4" />
                    {editingDesignId ? "Update Design" : "Save Design"}
                  </Button>
                  <Button onClick={handleDownload} variant="outline" className="gap-2 bg-transparent">
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
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
