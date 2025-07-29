// components/Sidebar.tsx
"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from '@supabase/supabase-js'
import {
  LayoutDashboard,
  BarChart3,
  FileText,
  Users,
  UserCheck,
  UserPlus,
  MessageSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Users2,
  UserRoundSearch,
  UserCheck2,
} from "lucide-react"

// Initialize Supabase client (you may need to adjust this based on your setup)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface NavItem {
  label: string
  icon: JSX.Element
  href: string
  routePath: string // This should match the route_path in your permissions table
}

interface Permission {
  id: string
  role_id: string
  route_path: string
  route_name: string
  can_access: boolean
}

export default function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean
  onToggle: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [allowedNavItems, setAllowedNavItems] = useState<NavItem[]>([])
  const [loading, setLoading] = useState(true)
  
  // All possible navigation items with their corresponding route paths
  const allNavItems: NavItem[] = [
    { label: "Dashboard", icon: <LayoutDashboard size={20} />, href: "/dashboard", routePath: "/dashboard" },
    { label: "Analytics", icon: <BarChart3 size={20} />, href: "/analytics", routePath: "/analytics" },
    { label: "Reports", icon: <FileText size={20} />, href: "/reports", routePath: "/reports" },
    { label: "Clients", icon: <Users size={20} />, href: "/clients", routePath: "/clients" },
    { label: "Leads", icon: <Users2 size={20} />, href: "/leads", routePath: "/leads" },
    { label: "Leads Information", icon: <UserCheck size={20} />, href: "/lead-information", routePath: "/lead-information" },
    { label: "Lead Assignment", icon: <UserPlus size={20} />, href: "/lead-assignment", routePath: "/lead-assignment" },
    { label: "Executive Information", icon: <UserRoundSearch size={20} />, href: "/executives", routePath: "/executives" },
    { label: "Talk to your data", icon: <MessageSquare size={20} />, href: "/ttyd", routePath: "/ttyd" },
    { label: "User Access", icon: <UserCheck2 size={20} />, href: "/useraccess", routePath: "/useraccess" },
    { label: "Settings", icon: <Settings size={20} />, href: "/settings", routePath: "/settings" },
  ]

  // Fetch user permissions 
  useEffect(() => {
    const fetchUserPermissions = async () => {
      try {
        setLoading(true)
        
        // Get user profile from localStorage
        const userProfileStr = localStorage.getItem('userProfile')
        if (!userProfileStr) {
          console.error('User profile not found in localStorage')
          setLoading(false)
          return
        }

        const userProfile = JSON.parse(userProfileStr)
        const roleId = userProfile.role_id

        if (!roleId) {
          console.error('Role ID not found in user profile')
          setLoading(false)
          return
        }

        // Fetch permissions from Supabase
        const { data: permissions, error } = await supabase
          .from('permissions_crm')
          .select('*')
          .eq('role_id', roleId)
          .eq('can_access', true)

        if (error) {
          console.error('Error fetching permissions:', error)
          setLoading(false)
          return
        }

        // Filter navigation items based on permissions
        const allowedItems = allNavItems.filter(navItem => {
          return permissions?.some((permission: Permission) => 
            permission.route_path === navItem.routePath && permission.can_access
          )
        })

        setAllowedNavItems(allowedItems)
        setLoading(false)

      } catch (error) {
        console.error('Error in fetchUserPermissions:', error)
        setLoading(false)
      }
    }

    fetchUserPermissions()
  }, [])

  const handleLogout = async () => {
    try {
      // 1. Clear all possible session storage
      
      // Clear cookies (adjust cookie names based on your auth implementation)
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
      document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
      document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
      document.cookie = 'auth=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
      
      // Clear localStorage
      localStorage.clear()
      
      // Clear sessionStorage
      sessionStorage.clear()
      
      // 2. Optional: Call logout API endpoint if you have one
      // await fetch('/api/auth/logout', { method: 'POST' })
      
      // 3. Redirect to login page
      router.push('/login')
      
      // Optional: Force page reload to ensure clean state
      // window.location.href = '/login'
      
    } catch (error) {
      console.error('Logout error:', error)
      // Fallback: force redirect even if there's an error
      window.location.href = '/login'
    }
  }

  // Loading state
  if (loading) {
    return (
      <div
        className={`
          h-screen fixed top-0 left-0 bg-gradient-to-b from-slate-50 to-white
          border-r border-slate-200 shadow-lg transition-all duration-300 ease-in-out
          ${collapsed ? "w-16" : "w-64"}
          flex flex-col
        `}
      >
        {/* Header with toggle button */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <img
                src="FitwiserLogo.png"
                alt="FitWiser Logo"
                className="h-28 w-28 object-contain ml-12"
              />   
            </div>
          )}
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors duration-200 text-slate-500 hover:text-slate-700"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Loading skeleton */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {[1, 2, 3, 4, 5].map((item) => (
            <div
              key={item}
              className={`
                animate-pulse bg-slate-200 rounded-xl
                ${collapsed ? "h-12 w-12 mx-auto" : "h-12 w-full"}
              `}
            />
          ))}
        </nav>

        {/* Logout Button */}
        <div className="p-3 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className={`
              group w-full flex items-center rounded-xl transition-all duration-200
              hover:bg-red-50 hover:shadow-sm text-slate-600 hover:text-red-600
              ${collapsed ? "justify-center p-3" : "px-4 py-3"}
              relative overflow-hidden
            `}
          >
            {/* Hover effect background */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 opacity-0 group-hover:opacity-5 transition-opacity duration-200 rounded-xl" />
            
            {/* Icon */}
            <div className="relative">
              <LogOut size={20} />
            </div>
            
            {/* Label */}
            {!collapsed && (
              <span className="ml-3 text-sm font-medium transition-colors duration-200">
                Logout
              </span>
            )}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`
        h-screen fixed top-0 left-0 bg-gradient-to-b from-slate-50 to-white
        border-r border-slate-200 shadow-lg transition-all duration-300 ease-in-out
        ${collapsed ? "w-16" : "w-64"}
        flex flex-col
      `}
    >
      {/* Header with toggle button */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <img
              src="FitwiserLogo.png"
              alt="FitWiser Logo"
              className="h-28 w-28 object-contain ml-12"
            />   
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors duration-200 text-slate-500 hover:text-slate-700"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {allowedNavItems.length === 0 ? (
          <div className="text-center text-slate-500 text-sm py-8">
            {!collapsed && "No accessible routes"}
          </div>
        ) : (
          allowedNavItems.map(({ label, icon, href }) => {
            const isActive = pathname === href
            
            return (
              <Link
                key={href}
                href={href}
                className={`
                  group flex items-center rounded-xl transition-all duration-200
                  ${collapsed ? "justify-center p-3" : "px-4 py-3"}
                  ${isActive 
                    ? "bg-gradient-to-r from-emerald-600 to-teal-500 shadow-lg shadow-emerald-500/25" 
                    : "hover:bg-emerald-50 hover:shadow-sm"
                  }
                  relative overflow-hidden
                `}
              >
                {/* Hover effect background for non-active items */}
                {!isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-emerald-600 opacity-0 group-hover:opacity-5 transition-opacity duration-200 rounded-xl" />
                )}
                
                {/* Icon */}
                <div className={`
                  relative transition-colors duration-200
                  ${isActive 
                    ? "text-white" 
                    : "text-slate-600 group-hover:text-emerald-600"
                  }
                `}>
                  {icon}
                </div>
                
                {/* Label */}
                {!collapsed && (
                  <span className={`
                    ml-3 text-sm font-medium transition-colors duration-200
                    ${isActive 
                      ? "text-white" 
                      : "text-slate-700 group-hover:text-emerald-700"
                    }
                  `}>
                    {label}
                  </span>
                )}
                
                {/* Active indicator */}
                <div className={`
                  absolute left-0 top-1/2 transform -translate-y-1/2 w-1 rounded-r transition-all duration-200
                  ${isActive 
                    ? "h-8 bg-white/30" 
                    : "h-0 bg-emerald-500 group-hover:h-6"
                  }
                `} />
              </Link>
            )
          })
        )}
      </nav>

      {/* Logout Button */}
      <div className="p-3 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className={`
            group w-full flex items-center rounded-xl transition-all duration-200
            hover:bg-red-50 hover:shadow-sm text-slate-600 hover:text-red-600
            ${collapsed ? "justify-center p-3" : "px-4 py-3"}
            relative overflow-hidden
          `}
        >
          {/* Hover effect background */}
          <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 opacity-0 group-hover:opacity-5 transition-opacity duration-200 rounded-xl" />
          
          {/* Icon */}
          <div className="relative">
            <LogOut size={20} />
          </div>
          
          {/* Label */}
          {!collapsed && (
            <span className="ml-3 text-sm font-medium transition-colors duration-200">
              Logout
            </span>
          )}
        </button>
      </div>
    </div>
  )
}