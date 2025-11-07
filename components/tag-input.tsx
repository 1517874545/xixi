"use client"

import { useState, useEffect, useRef } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Tag as TagIcon, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  maxTags?: number
  className?: string
  showSuggestions?: boolean
}

export function TagInput({
  value = [],
  onChange,
  placeholder = "添加标签...",
  maxTags = 10,
  className,
  showSuggestions = true
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("")
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestionList, setShowSuggestionList] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // 从 API 获取标签建议
  useEffect(() => {
    if (!showSuggestions || !inputValue.trim() || inputValue.length < 2) {
      setSuggestions([])
      setShowSuggestionList(false)
      return
    }

    const fetchSuggestions = async () => {
      try {
        const response = await fetch(`/api/tags?type=search&query=${encodeURIComponent(inputValue)}&limit=5`)
        if (response.ok) {
          const data = await response.json()
          const tagNames = data.tags?.map((t: any) => t.name) || []
          // 过滤掉已选择的标签
          const filteredSuggestions = tagNames.filter((tag: string) => !value.includes(tag))
          setSuggestions(filteredSuggestions)
          setShowSuggestionList(filteredSuggestions.length > 0)
        }
      } catch (error) {
        console.error('Error fetching tag suggestions:', error)
      }
    }

    const debounceTimer = setTimeout(fetchSuggestions, 300)
    return () => clearTimeout(debounceTimer)
  }, [inputValue, value, showSuggestions])

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase()
    
    // 验证标签
    if (!trimmedTag) {
      return
    }
    
    if (trimmedTag.length > 50) {
      alert('标签名称不能超过 50 个字符')
      return
    }
    
    if (value.includes(trimmedTag)) {
      alert('标签已存在')
      setInputValue("")
      return
    }
    
    if (value.length >= maxTags) {
      alert(`最多只能添加 ${maxTags} 个标签`)
      return
    }
    
    onChange([...value, trimmedTag])
    setInputValue("")
    setShowSuggestionList(false)
    
    // 重新聚焦到输入框
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (inputValue.trim()) {
        addTag(inputValue)
      }
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      // 删除最后一个标签
      removeTag(value[value.length - 1])
    } else if (e.key === 'Escape') {
      setShowSuggestionList(false)
    }
  }

  const selectSuggestion = (tag: string) => {
    addTag(tag)
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* 已添加的标签 */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="pl-2 pr-1 py-1 flex items-center gap-1"
            >
              <TagIcon className="h-3 w-3" />
              {tag}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground rounded-full"
                onClick={() => removeTag(tag)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* 输入框 */}
      <div className="relative">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => showSuggestions && suggestions.length > 0 && setShowSuggestionList(true)}
            onBlur={() => setTimeout(() => setShowSuggestionList(false), 200)}
            placeholder={value.length >= maxTags ? `已达到 ${maxTags} 个标签上限` : placeholder}
            disabled={value.length >= maxTags}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => inputValue.trim() && addTag(inputValue)}
            disabled={!inputValue.trim() || value.length >= maxTags}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* 建议列表 */}
        {showSuggestionList && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className="w-full px-3 py-2 text-left hover:bg-accent transition-colors flex items-center gap-2"
                onClick={() => selectSuggestion(suggestion)}
              >
                <TagIcon className="h-3 w-3 text-muted-foreground" />
                <span>{suggestion}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 提示文字 */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>按 Enter 添加标签，最多 {maxTags} 个</span>
        {value.length > 0 && (
          <span>{value.length} / {maxTags}</span>
        )}
      </div>
    </div>
  )
}

