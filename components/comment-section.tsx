"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { MessageCircle, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import type { Comment } from "@/lib/mock-data"
import { commentsApi } from "@/lib/api"

interface CommentSectionProps {
  designId: string
  initialComments?: Comment[]
  onCommentUpdate?: (count: number) => void
}

export function CommentSection({ designId, initialComments = [], onCommentUpdate }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [newComment, setNewComment] = useState("")
  const [showComments, setShowComments] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // 页面加载时自动加载评论
    loadComments()
  }, [designId])

  useEffect(() => {
    // 当评论数量变化时通知父组件
    onCommentUpdate?.(comments.length)
  }, [comments.length, onCommentUpdate])

  useEffect(() => {
    // 当显示评论时，重新加载确保数据最新
    if (showComments) {
      loadComments()
    }
  }, [showComments])

  const loadComments = async () => {
    try {
      // 首先尝试从本地存储获取评论（确保数据持久化）
      if (typeof window !== 'undefined') {
        try {
          const allComments = JSON.parse(localStorage.getItem("petcraft_comments") || "[]")
          const designComments = allComments.filter((comment: Comment) => comment.design_id === designId)
          
          if (designComments.length > 0) {
            console.log('Loaded comments from localStorage:', designComments.length)
            setComments(designComments)
            return
          }
        } catch (localError) {
          console.error('Failed to load comments from localStorage:', localError)
        }
      }
      
      // 如果本地存储没有评论，尝试从API获取
      const fetchedComments = await commentsApi.getByDesign(designId)
      setComments(fetchedComments)
      
      // 将API获取的评论保存到本地存储
      if (fetchedComments.length > 0 && typeof window !== 'undefined') {
        try {
          const allComments = JSON.parse(localStorage.getItem("petcraft_comments") || "[]")
          const existingIds = new Set(allComments.map((c: Comment) => c.id))
          const newComments = fetchedComments.filter(comment => !existingIds.has(comment.id))
          
          if (newComments.length > 0) {
            localStorage.setItem("petcraft_comments", JSON.stringify([...allComments, ...newComments]))
            console.log('Saved API comments to localStorage:', newComments.length)
          }
        } catch (saveError) {
          console.error('Failed to save API comments to localStorage:', saveError)
        }
      }
      
    } catch (error) {
      console.error('Failed to load comments:', error)
      setComments([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || loading) return

    setLoading(true)
    
    // 首先创建本地评论对象
    const localComment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      design_id: designId,
      content: newComment,
      user_name: 'You',
      created_at: new Date().toISOString()
    }

    try {
      // 立即保存到本地存储和状态
      if (typeof window !== 'undefined') {
        try {
          const currentComments = JSON.parse(localStorage.getItem("petcraft_comments") || "[]")
          currentComments.push(localComment)
          localStorage.setItem("petcraft_comments", JSON.stringify(currentComments))
          console.log('Comment saved to localStorage:', localComment.id)
          
          // 更新本地存储中的设计评论数
          const savedDesigns = JSON.parse(localStorage.getItem("petcraft_designs") || "[]")
          const designIndex = savedDesigns.findIndex((d: any) => d.id === designId)
          if (designIndex !== -1) {
            savedDesigns[designIndex].comments_count = (savedDesigns[designIndex].comments_count || 0) + 1
            localStorage.setItem("petcraft_designs", JSON.stringify(savedDesigns))
          }
        } catch (localError) {
          console.error('Failed to save comment to localStorage:', localError)
        }
      }
      
      // 立即更新UI
      setComments(prev => [localComment as Comment, ...prev])
      setNewComment("")
      
      // 异步调用API（不阻塞用户操作）
      commentsApi.create(designId, newComment)
        .then(apiComment => {
          console.log('Comment created via API:', apiComment.id)
          
          // 更新本地存储中的评论ID（如果API返回了不同的ID）
          if (typeof window !== 'undefined') {
            try {
              const currentComments = JSON.parse(localStorage.getItem("petcraft_comments") || "[]")
              const index = currentComments.findIndex((c: Comment) => c.id === localComment.id)
              if (index !== -1) {
                currentComments[index] = { ...apiComment, user_name: 'You' }
                localStorage.setItem("petcraft_comments", JSON.stringify(currentComments))
                
                // 更新UI状态
                setComments(prev => prev.map(c => c.id === localComment.id ? { ...apiComment, user_name: 'You' } : c))
              }
            } catch (updateError) {
              console.error('Failed to update comment with API data:', updateError)
            }
          }
        })
        .catch(apiError => {
          console.error('API comment creation failed, but local comment is saved:', apiError)
        })
      
    } catch (error) {
      console.error('Failed to create comment:', error)
      // 即使出现错误，也确保评论显示在UI中
      setComments(prev => [localComment as Comment, ...prev])
      setNewComment("")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <Button variant="ghost" size="sm" onClick={() => setShowComments(!showComments)} className="gap-1">
        <MessageCircle className="h-4 w-4" />
        <span className="text-sm">{comments.length}</span>
      </Button>

      {showComments && (
        <Card className="p-4 space-y-4">
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {comments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No comments yet. Be the first!</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{comment.user_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm">{comment.content}</p>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="min-h-[60px] resize-none"
              disabled={loading}
            />
            <Button type="submit" size="icon" disabled={!newComment.trim() || loading}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </Card>
      )}
    </div>
  )
}
