"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "./auth-provider"
import { LogOut, User, Settings, Shield, Mail } from "lucide-react"

export function UserMenu() {
  const { user, signOut } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut()
    } catch (error) {
      console.error("Error signing out:", error)
    } finally {
      setIsSigningOut(false)
    }
  }

  if (!user) return null

  const userInitials =
    user.email
      ?.split("@")[0]
      .split(".")
      .map((name) => name[0])
      .join("")
      .toUpperCase() || "U"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full border-2 border-emerald-200 hover:border-emerald-300"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.user_metadata?.avatar_url || "/placeholder.svg"} alt={user.email || ""} />
            <AvatarFallback className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 p-4" align="end" forceMount>
        <DropdownMenuLabel className="font-normal p-0">
          <div className="flex flex-col space-y-3">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user.user_metadata?.avatar_url || "/placeholder.svg"} alt={user.email || ""} />
                <AvatarFallback className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-lg font-semibold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user.user_metadata?.full_name || user.email?.split("@")[0]}
                </p>
                <div className="flex items-center space-x-1">
                  <Mail className="h-3 w-3 text-slate-500" />
                  <p className="text-xs leading-none text-slate-600">{user.email}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                <Shield className="h-3 w-3 mr-1" />
                Admin
              </Badge>
              <Badge variant="outline" className="border-blue-200 text-blue-700">
                Online
              </Badge>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="my-3" />

        <DropdownMenuItem className="cursor-pointer hover:bg-emerald-50">
          <User className="mr-2 h-4 w-4 text-emerald-600" />
          <span>Profile Settings</span>
        </DropdownMenuItem>

        <DropdownMenuItem className="cursor-pointer hover:bg-emerald-50">
          <Settings className="mr-2 h-4 w-4 text-emerald-600" />
          <span>Account Settings</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="cursor-pointer hover:bg-red-50 text-red-600 focus:text-red-600"
          onClick={handleSignOut}
          disabled={isSigningOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isSigningOut ? "Signing out..." : "Sign out"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
