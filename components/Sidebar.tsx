// components/Sidebar.tsx
"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"  // ADD useRouter import
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
} from "lucide-react"

export default function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean
  onToggle: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()  // ADD this line
  
  const navItems = [
    { label: "Dashboard", icon: <LayoutDashboard size={20} />, href: "/dashboard" },
    { label: "Analytics", icon: <BarChart3 size={20} />, href: "/analytics" },
    { label: "Reports", icon: <FileText size={20} />, href: "/reports" },
    { label: "Clients", icon: <Users size={20} />, href: "/clients" },
    { label: "Leads", icon: <UserPlus size={20} />, href: "/leads" },
    { label: "Leads Information", icon: <UserCheck size={20} />, href: "/lead-information" },
    { label: "Talk to your data", icon: <MessageSquare size={20} />, href: "/ttyd" },
    { label: "Settings", icon: <Settings size={20} />, href: "/settings" },
  ]

  // REPLACE the handleLogout function with this:
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
      <nav className="flex-1 px-3 py-6 space-y-1">
        {navItems.map(({ label, icon, href }) => {
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
        })}
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