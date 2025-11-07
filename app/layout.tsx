import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { AuthApiProvider } from "@/lib/auth-api-context"
import { Navigation } from "@/components/navigation"
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: "PetCraft Studio - Create Your Unique Pet Illustration",
  description: "Design and create unique pet illustrations by combining different elements",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <AuthApiProvider>
          <Navigation />
          <main className="min-h-screen">{children}</main>
          <Toaster />
        </AuthApiProvider>
      </body>
    </html>
  )
}
