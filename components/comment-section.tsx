"use client"

import type React from "react"

import { useState } from "react"
import { MessageCircle, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import type { Comment } from "@/lib/mock-data"

interface CommentSectionProps {
  designId: string
  initialComments?: Comment[]
}

export function CommentSection({ designId, initialComments = [] }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [newComment, setNewComment] = useState("")
  const [showComments, setShowComments] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    const comment: Comment = {
      id: `c${Date.now()}`,
      user_id: "user1",
      design_id: designId,
      content: newComment,
      created_at: new Date().toISOString(),
      user_name: "PetLover123",
    }

    setComments([...comments, comment])
    setNewComment("")

    // Store in localStorage
    const allComments = JSON.parse(localStorage.getItem("petcraft_comments") || "[]")
    allComments.push(comment)
    localStorage.setItem("petcraft_comments", JSON.stringify(allComments))
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
            />
            <Button type="submit" size="icon" disabled={!newComment.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </Card>
      )}
    </div>
  )
}
