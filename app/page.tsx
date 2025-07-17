// app/page.tsx
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    if (typeof window === "undefined") return

    // Try to grab the raw JSON string for your user profile
    const storedProfile = localStorage.getItem("userProfile")
    // (Optional) also check whatever session key you might be storing
    const storedSession = localStorage.getItem("session")

    if (storedProfile) {
      // we have a profile object — user is "logged in"
      router.push("/dashboard")
    } else if (storedSession) {
      // fallback: maybe you just stored a session token
      router.push("/dashboard")
    } else {
      // no profile or session → force to login
      router.push("/login")
    }
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading...</p>
      </div>
    </div>
  )
}

