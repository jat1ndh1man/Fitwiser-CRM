// components/Header.tsx
"use client"

import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import {
  LayoutDashboard,
  BarChart3,
  FileText,
  Users,
  UserCheck,
  UserPlus,
  MessageSquare,
  Settings,
  User as UserIcon
} from "lucide-react"

const pageConfig = {
  "/dashboard": {
    title: "Dashboard",
    icon: <LayoutDashboard size={24} />,
    description: "Overview of your business metrics"
  },
  "/analytics": {
    title: "Analytics",
    icon: <BarChart3 size={24} />,
    description: "Data insights and performance metrics"
  },
  "/reports": {
    title: "Reports",
    icon: <FileText size={24} />,
    description: "Generate and view detailed reports"
  },
  "/clients": {
    title: "Clients",
    icon: <Users size={24} />,
    description: "Manage your client relationships"
  },
  "/lead-information": {
    title: "Lead Information",
    icon: <UserCheck size={24} />,
    description: "Detailed lead profiles and data"
  },
  "/lead-assignment": {
    title: "Lead Assignment",
    icon: <UserPlus size={24} />,
    description: "Assign leads to executives and track progress"
  },

  "/ttyd": {
    title: "Talk to your data",
    icon: <MessageSquare size={24} />,
    description: "AI-powered data conversations"
  },
  "/settings": {
    title: "Settings",
    icon: <Settings size={24} />,
    description: "Configure your application preferences"
  }
}

export default function Header() {
  const pathname = usePathname()
  const currentPage =
    pageConfig[pathname as keyof typeof pageConfig] || pageConfig["/dashboard"]

  const [fullName, setFullName] = useState("Loading…")
  const [roleName, setRoleName] = useState("")
  const [avatarUrl, setAvatarUrl] = useState<string>("")

  useEffect(() => {
    async function loadUser() {
      // 1. get authenticated user
      const {
        data: { user },
        error: userErr
      } = await supabase.auth.getUser()
      if (userErr || !user) {
        setFullName("Guest")
        return
      }

      // 2. fetch profile (first_name, last_name, role_id, profile_image_url)
      const { data: profile, error: profileErr } = await supabase
        .from("users")
        .select("first_name, last_name, role_id, profile_image_url")
        .eq("id", user.id)
        .single()
      if (profileErr || !profile) {
        setFullName(user.email ?? "Unknown User")
        return
      }

      // build display name
      const name =
        profile.first_name +
        (profile.last_name ? ` ${profile.last_name}` : "")
      setFullName(name)

      // 3. lookup role name
      const { data: roleRow, error: roleErr } = await supabase
        .from("user_roles")
        .select("name")
        .eq("id", profile.role_id)
        .single()
      if (!roleErr && roleRow) setRoleName(roleRow.name)

      // 4. if we have an image path, turn it into a public URL
      if (profile.profile_image_url) {
        const { data } = supabase
          .storage
          .from("avatars")
          .getPublicUrl(profile.profile_image_url)
        setAvatarUrl(data.publicUrl)
      }
    }

    loadUser()
  }, [])

  return (
    <header className="sticky top-0 z-10 w-full bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        {/* left: icon + title */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg">
            <div className="text-white">{currentPage.icon}</div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {currentPage.title}
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              {currentPage.description}
            </p>
          </div>
        </div>

        {/* right: name, role, avatar */}
        <div className="flex items-center space-x-3 pl-4 border-l border-slate-200">
          <div className="text-right">
            <p className="text-sm font-medium text-slate-800">{fullName}</p>
            {roleName && (
              <p className="text-xs text-slate-500">{roleName}</p>
            )}
          </div>

          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center">
              <UserIcon size={16} className="text-white" />
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
