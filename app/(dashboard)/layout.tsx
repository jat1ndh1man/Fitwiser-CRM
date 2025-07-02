// app/dashboard/layout.tsx
"use client"

import { useState, ReactNode } from "react"
import Sidebar from "@/components/Sidebar"
import Header from "@/components/Header"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  // rem units: collapsed = 4, expanded = 16
  const sidebarWidthRem = collapsed ? 4 : 16

  return (
    <div className="flex overflow-x-hidden">
      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
      />

      {/* Main content wrapper */}
      <div
        className="flex flex-col min-h-screen min-w-0 transition-all duration-300"
        style={{
          marginLeft: `${sidebarWidthRem}rem`,
          width: `calc(100% - ${sidebarWidthRem}rem)`,
        }}
      >
        {/* Sticky Header */}
        <Header />

        {/* Scrollable content area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50">
          {/* This inner div lets children shrink via `min-w-0` */}
          <div className="p-6 w-full min-w-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
