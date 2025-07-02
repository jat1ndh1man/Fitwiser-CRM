"use client"

import type React from "react"

import { useAuth } from "./auth-provider"
import { LoginForm } from "./login-form"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl shadow-lg">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Loading CRM Dashboard</h2>
            <p className="text-slate-600">Please wait while we verify your session...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  return <>{children}</>
}
