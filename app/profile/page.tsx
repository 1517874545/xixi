"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { mockUser, mockDesigns, mockComponents, type Design } from "@/lib/mock-data"
import { User, Heart } from "lucide-react"

export default function ProfilePage() {
  const [myDesigns, setMyDesigns] = useState<Design[]>([])
  const [likedDesigns, setLikedDesigns] = useState<Design[]>([])

  useEffect(() => {
    // Load user's designs
    const savedDesigns = JSON.parse(localStorage.getItem("petcraft_designs") || "[]")
    const userDesigns = [...mockDesigns, ...savedDesigns].filter((d: Design) => d.user_id === mockUser.id)
    setMyDesigns(userDesigns)

    // Load liked designs
    const likes = JSON.parse(localStorage.getItem("petcraft_likes") || "[]")
    const allDesigns = [...mockDesigns, ...savedDesigns]
    const liked = allDesigns.filter((d: Design) => likes.includes(d.id))
    setLikedDesigns(liked)
  }, [])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Profile Header */}
        <Card className="p-6 mb-8">
          <div className="flex items-start gap-6">
            <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-12 w-12 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2">{mockUser.name}</h1>
              <p className="text-muted-foreground mb-4">{mockUser.email}</p>
              <div className="flex gap-6 text-sm">
                <div>
                  <span className="font-semibold">{mockUser.designs_count}</span>
                  <span className="text-muted-foreground ml-1">Designs</span>
                </div>
                <div>
                  <span className="font-semibold">{mockUser.followers_count}</span>
                  <span className="text-muted-foreground ml-1">Followers</span>
                </div>
                <div>
                  <span className="font-semibold">{mockUser.following_count}</span>
                  <span className="text-muted-foreground ml-1">Following</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="designs" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="designs" className="gap-2">
              <User className="h-4 w-4" />
              My Designs
            </TabsTrigger>
            <TabsTrigger value="liked" className="gap-2">
              <Heart className="h-4 w-4" />
              Liked
            </TabsTrigger>
          </TabsList>

          <TabsContent value="designs" className="mt-6">
            {myDesigns.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">No designs yet. Start creating!</p>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {myDesigns.map((design) => (
                  <Link key={design.id} href={`/design/${design.id}`}>
                    <Card className="p-4 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]">
                      <svg viewBox="0 0 300 300" className="w-full h-48 mb-4 bg-muted rounded-lg">
                        {design.components.background && (
                          <g
                            dangerouslySetInnerHTML={{
                              __html: mockComponents.find((c) => c.id === design.components.background)?.svg_data || "",
                            }}
                            style={{ color: design.components.bodyColor }}
                          />
                        )}
                        {design.components.body && (
                          <g
                            dangerouslySetInnerHTML={{
                              __html: mockComponents.find((c) => c.id === design.components.body)?.svg_data || "",
                            }}
                            style={{ color: design.components.bodyColor }}
                          />
                        )}
                        {design.components.ears && (
                          <g
                            dangerouslySetInnerHTML={{
                              __html: mockComponents.find((c) => c.id === design.components.ears)?.svg_data || "",
                            }}
                            style={{ color: design.components.bodyColor }}
                          />
                        )}
                        {design.components.eyes && (
                          <g
                            dangerouslySetInnerHTML={{
                              __html: mockComponents.find((c) => c.id === design.components.eyes)?.svg_data || "",
                            }}
                          />
                        )}
                        {design.components.nose && (
                          <g
                            dangerouslySetInnerHTML={{
                              __html: mockComponents.find((c) => c.id === design.components.nose)?.svg_data || "",
                            }}
                          />
                        )}
                        {design.components.mouth && (
                          <g
                            dangerouslySetInnerHTML={{
                              __html: mockComponents.find((c) => c.id === design.components.mouth)?.svg_data || "",
                            }}
                          />
                        )}
                        {design.components.accessories && (
                          <g
                            dangerouslySetInnerHTML={{
                              __html:
                                mockComponents.find((c) => c.id === design.components.accessories)?.svg_data || "",
                            }}
                          />
                        )}
                      </svg>
                      <div>
                        <h3 className="font-semibold mb-1">{design.title}</h3>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>{new Date(design.created_at).toLocaleDateString()}</span>
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Heart className="h-3 w-3" />
                              {design.likes_count || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="liked" className="mt-6">
            {likedDesigns.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">No liked designs yet. Explore the gallery!</p>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {likedDesigns.map((design) => (
                  <Link key={design.id} href={`/design/${design.id}`}>
                    <Card className="p-4 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]">
                      <svg viewBox="0 0 300 300" className="w-full h-48 mb-4 bg-muted rounded-lg">
                        {design.components.background && (
                          <g
                            dangerouslySetInnerHTML={{
                              __html: mockComponents.find((c) => c.id === design.components.background)?.svg_data || "",
                            }}
                            style={{ color: design.components.bodyColor }}
                          />
                        )}
                        {design.components.body && (
                          <g
                            dangerouslySetInnerHTML={{
                              __html: mockComponents.find((c) => c.id === design.components.body)?.svg_data || "",
                            }}
                            style={{ color: design.components.bodyColor }}
                          />
                        )}
                        {design.components.ears && (
                          <g
                            dangerouslySetInnerHTML={{
                              __html: mockComponents.find((c) => c.id === design.components.ears)?.svg_data || "",
                            }}
                            style={{ color: design.components.bodyColor }}
                          />
                        )}
                        {design.components.eyes && (
                          <g
                            dangerouslySetInnerHTML={{
                              __html: mockComponents.find((c) => c.id === design.components.eyes)?.svg_data || "",
                            }}
                          />
                        )}
                        {design.components.nose && (
                          <g
                            dangerouslySetInnerHTML={{
                              __html: mockComponents.find((c) => c.id === design.components.nose)?.svg_data || "",
                            }}
                          />
                        )}
                        {design.components.mouth && (
                          <g
                            dangerouslySetInnerHTML={{
                              __html: mockComponents.find((c) => c.id === design.components.mouth)?.svg_data || "",
                            }}
                          />
                        )}
                        {design.components.accessories && (
                          <g
                            dangerouslySetInnerHTML={{
                              __html:
                                mockComponents.find((c) => c.id === design.components.accessories)?.svg_data || "",
                            }}
                          />
                        )}
                      </svg>
                      <div>
                        <h3 className="font-semibold mb-1">{design.title}</h3>
                        <p className="text-sm text-muted-foreground">{design.user_name || "Anonymous"}</p>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
