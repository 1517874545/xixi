"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, X, Tag, Sparkles } from "lucide-react"

interface SearchFilterProps {
  onSearch: (query: string) => void
  onFilter: (filters: FilterOptions) => void
  availableTags: string[]
}

export interface FilterOptions {
  tags: string[]
  sortBy: "newest" | "popular" | "oldest"
  componentType?: string
  color?: string
  designType?: "all" | "ai" | "svg"
}

export default function SearchFilter({ onSearch, onFilter, availableTags }: SearchFilterProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<"newest" | "popular" | "oldest">("newest")
  const [componentType, setComponentType] = useState("")
  const [color, setColor] = useState("")
  const [designType, setDesignType] = useState<"all" | "ai" | "svg">("all")

  const handleSearch = () => {
    onSearch(searchQuery)
  }

  const handleFilter = () => {
    onFilter({
      tags: selectedTags,
      sortBy,
      componentType: componentType || undefined,
      color: color || undefined,
      designType: designType !== "all" ? designType : undefined
    })
  }

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const clearFilters = () => {
    setSelectedTags([])
    setSortBy("newest")
    setComponentType("")
    setColor("")
    setDesignType("all")
    setSearchQuery("")
    onSearch("")
    onFilter({
      tags: [],
      sortBy: "newest",
      componentType: undefined,
      color: undefined,
      designType: undefined
    })
  }

  const componentTypes = [
    "body", "ears", "eyes", "nose", "mouth", "accessories", "background"
  ]

  const colors = [
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
    "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9"
  ]

  return (
    <div className="space-y-4">
      {/* 搜索栏 */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="搜索作品标题、作者或标签..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            className="pl-10"
          />
        </div>
        <Button onClick={handleSearch} className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          搜索
        </Button>
        <Button 
          variant="outline" 
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          筛选
        </Button>
      </div>

      {/* 筛选面板 */}
      {showFilters && (
        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">筛选选项</h3>
            <Button variant="ghost" size="sm" onClick={clearFilters} className="flex items-center gap-1">
              <X className="h-3 w-3" />
              清除筛选
            </Button>
          </div>

          {/* 标签筛选 */}
          <div>
            <label className="text-sm font-medium mb-2 block">标签</label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map(tag => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer flex items-center gap-1"
                  onClick={() => handleTagToggle(tag)}
                >
                  <Tag className="h-3 w-3" />
                  {tag}
                </Badge>
              ))}
              {availableTags.length === 0 && (
                <span className="text-sm text-muted-foreground">暂无可用标签</span>
              )}
            </div>
          </div>

          {/* 排序选项 */}
          <div>
            <label className="text-sm font-medium mb-2 block">排序方式</label>
            <div className="flex gap-2">
              {[
                { value: "newest", label: "最新" },
                { value: "popular", label: "最受欢迎" },
                { value: "oldest", label: "最早" }
              ].map(option => (
                <Button
                  key={option.value}
                  variant={sortBy === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortBy(option.value as any)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* 组件类型筛选 */}
          <div>
            <label htmlFor="component-type-select" className="text-sm font-medium mb-2 block">组件类型</label>
            <select 
              id="component-type-select"
              value={componentType}
              onChange={(e) => setComponentType(e.target.value)}
              className="w-full p-2 border rounded-md"
              aria-label="选择组件类型"
            >
              <option value="">所有类型</option>
              {componentTypes.map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* 颜色筛选 */}
          <div>
            <label htmlFor="color-select" className="text-sm font-medium mb-2 block">主要颜色</label>
            <div className="flex flex-wrap gap-2 items-center">
              <select 
                id="color-select"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="p-2 border rounded-md"
                aria-label="选择主要颜色"
              >
                <option value="">所有颜色</option>
                {colors.map(color => (
                  <option key={color} value={color}>
                    {color}
                  </option>
                ))}
              </select>
              {color && (
                <div 
                  className="w-8 h-8 rounded border"
                  style={{ backgroundColor: color }}
                  role="img"
                  aria-label={`已选择的颜色: ${color}`}
                />
              )}
            </div>
          </div>

          {/* 作品类型筛选 */}
          <div>
            <label className="text-sm font-medium mb-2 block">作品类型</label>
            <div className="flex gap-2">
              <Button
                variant={designType === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setDesignType("all")}
                className="flex items-center gap-1"
              >
                全部
              </Button>
              <Button
                variant={designType === "ai" ? "default" : "outline"}
                size="sm"
                onClick={() => setDesignType("ai")}
                className="flex items-center gap-1"
              >
                <Sparkles className="h-3 w-3" />
                AI创作
              </Button>
              <Button
                variant={designType === "svg" ? "default" : "outline"}
                size="sm"
                onClick={() => setDesignType("svg")}
                className="flex items-center gap-1"
              >
                SVG设计
              </Button>
            </div>
          </div>

          <Button onClick={handleFilter} className="w-full">
            应用筛选
          </Button>
        </Card>
      )}

      {/* 当前筛选状态 */}
      {(selectedTags.length > 0 || searchQuery || sortBy !== "newest" || componentType || color || designType !== "all") && (
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <span className="text-muted-foreground">当前筛选:</span>
          {searchQuery && (
            <Badge variant="secondary">搜索: {searchQuery}</Badge>
          )}
          {selectedTags.map(tag => (
            <Badge key={tag} variant="secondary">标签: {tag}</Badge>
          ))}
          {sortBy !== "newest" && (
            <Badge variant="secondary">
              排序: {sortBy === "popular" ? "最受欢迎" : "最早"}
            </Badge>
          )}
          {componentType && (
            <Badge variant="secondary">组件: {componentType}</Badge>
          )}
          {color && (
            <Badge variant="secondary">颜色: {color}</Badge>
          )}
          {designType !== "all" && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {designType === "ai" && <Sparkles className="h-3 w-3" />}
              {designType === "ai" ? "AI创作" : "SVG设计"}
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={clearFilters} className="flex items-center gap-1">
            <X className="h-3 w-3" />
            清除
          </Button>
        </div>
      )}
    </div>
  )
}