import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Sparkles, Palette, Share2, Heart } from "lucide-react"

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <section className="text-center py-20">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-balance">
            Create Your Unique
            <span className="text-primary"> Pet Illustration</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 text-pretty">
            Mix and match adorable pet parts to design your perfect companion. No drawing skills needed - just
            creativity!
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" asChild className="gap-2">
              <Link href="/editor">
                <Sparkles className="h-5 w-5" />
                Start Creating
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/gallery">View Gallery</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Palette className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Choose Components</h3>
            <p className="text-muted-foreground">Select from a variety of bodies, ears, eyes, noses, and accessories</p>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-6 w-6 text-secondary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Customize Colors</h3>
            <p className="text-muted-foreground">Pick your favorite colors to make your pet truly unique</p>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Share2 className="h-6 w-6 text-accent-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Save & Share</h3>
            <p className="text-muted-foreground">Save your creations and share them with the community</p>
          </Card>
        </div>
      </section>

      {/* CTA Sectio */}
      <section className="py-16 text-center">
        <Card className="max-w-2xl mx-auto p-12 bg-gradient-to-br from-primary/5 to-secondary/5">
          <Heart className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">Ready to Create?</h2>
          <p className="text-muted-foreground mb-6 text-lg">
            Join thousands of pet lovers creating unique illustrations
          </p>
          <Button size="lg" asChild>
            <Link href="/editor">Get Started Free</Link>
          </Button>
        </Card>
      </section>
    </div>
  )
}
