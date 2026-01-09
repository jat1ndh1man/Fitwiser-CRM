"use client"

import type React from "react"
import { useAuth } from "./auth-provider"
import { hasPermission } from "../../lib/supabase"
import { AlertTriangle, Lock } from "lucide-react"
import { Alert, AlertDescription } from "../ui/alert"

interface RBACWrapperProps {
  children: React.ReactNode
  requiredRoles?: string[]
  fallback?: React.ReactNode
  requireAllData?: boolean // If true, only users who can view all data can access
  requireManagerAccess?: boolean // If true, only managers and above can access
}

export function RBACWrapper({ 
  children, 
  requiredRoles = [], 
  fallback, 
  requireAllData = false, 
  requireManagerAccess = false 
}: RBACWrapperProps) {
  const { userSession, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (!userSession) {
    return (
      fallback || (
        <Alert className="border-red-200 bg-red-50">
          <Lock className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">Authentication required to access this content.</AlertDescription>
        </Alert>
      )
    )
  }

  // Check role-based permissions
  if (requiredRoles.length > 0 && !hasPermission(userSession, requiredRoles)) {
    return (
      fallback || (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            You don't have permission to access this content. Required roles: {requiredRoles.join(", ")}
          </AlertDescription>
        </Alert>
      )
    )
  }

  // Check if user needs to view all data
  if (requireAllData && !userSession.canViewAllData) {
    return (
      fallback || (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            This feature is only available to administrators and managers.
          </AlertDescription>
        </Alert>
      )
    )
  }

  // Check if user needs manager access
  if (requireManagerAccess && !userSession.canManageTeam) {
    return (
      fallback || (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            This feature is only available to managers.
          </AlertDescription>
        </Alert>
      )
    )
  }

  return <>{children}</>
}