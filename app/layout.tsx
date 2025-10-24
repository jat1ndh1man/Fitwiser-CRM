
// app/layout.tsx
import { AuthProvider } from "@/components/auth/auth-provider"
import type { Metadata } from "next"
import "./globals.css"

// Add this line to force dynamic rendering
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "Fitwiser CRM",
  description: "CRM System for Fitwiser Fitness",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}