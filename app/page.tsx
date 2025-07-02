// app/page.tsx
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Check if we're in the browser environment
    if (typeof window !== "undefined") {
      // Check for existing session in localStorage
      const session = localStorage.getItem("session") // or whatever key you use for session
      // You might also check for token, user, authToken, etc.
      
      if (session) {
        // User has an existing session, redirect to dashboard
        router.push("/dashboard")
      } else {
        // No session found, redirect to login
        router.push("/login")
      }
    }
  }, [router])

  // Optional: Show a loading state while checking session
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading...</p>
      </div>
    </div>
  )
}