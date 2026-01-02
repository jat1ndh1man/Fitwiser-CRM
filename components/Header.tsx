// components/Header.tsx
"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState, useRef, useMemo } from "react"
import { supabase } from "../lib/supabase"
import {
  LayoutDashboard,
  BarChart3,
  FileText,
  Users,
  UserCheck,
  UserPlus,
  MessageSquare,
  Settings,
  User as UserIcon,
  Search,
  Phone,
  Mail,
  MapPin,
  Calendar,
  IndianRupee,
  Loader2,
  ChevronRight,
  UserCheck2Icon
} from "lucide-react"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import { Badge } from "./ui/badge"
import { Avatar, AvatarFallback } from "./ui/avatar"
import { format } from "date-fns"

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
  },
  "/useraccess": {
    title: "User Access Control",
    icon: <UserCheck2Icon size={24} />,
    description: "Configure user access preferences"
  }
}

// Types for search data
interface Lead {
  id: string
  name: string
  email: string
  phone_number: string
  city: string | null
  profession: string | null
  status: 'New' | 'Hot' | 'Warm' | 'Cold' | 'Failed'
  source: 'Website' | 'Social Media' | 'Referral' | 'Cold Call' | null
  counselor: string | null
  created_at: string
}

interface Client {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  created_at: string
  totalAmountPaid: number
  status: 'Active' | 'Inactive' | 'Expired'
}

interface SearchResult {
  id: string
  type: 'lead' | 'client'
  title: string
  subtitle: string
  description: string
  status: string
  route: string
  data: Lead | Client
}

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const currentPage =
    pageConfig[pathname as keyof typeof pageConfig] || pageConfig["/dashboard"]

  // User profile state
  const [fullName, setFullName] = useState("Loading…")
  const [roleName, setRoleName] = useState("")
  const [avatarUrl, setAvatarUrl] = useState<string>("")

  // Search state
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [leads, setLeads] = useState<Lead[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [userProfile, setUserProfile] = useState<any>(null)

  // Refs for search functionality
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  // Role constants
  const SUPERADMIN_ROLE = 'b00060fe-175a-459b-8f72-957055ee8c55'
  const ADMIN_ROLE = '46e786df-0272-4f22-aec2-56d2a517fa9d'
  const SALES_MANAGER_ROLE = '11b93954-9a56-4ea5-a02c-15b731ee9dfb'
  const EXECUTIVE_ROLE = '1fe1759c-dc14-4933-947a-c240c046bcde'
  const CLIENT_ROLE = '3b9aeecb-3f68-434e-bc63-4f30f7bde8f1'

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

      setUserProfile({ ...profile, id: user.id })

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

  // Load search data
  useEffect(() => {
    if (userProfile) {
      loadSearchData()
    }
  }, [userProfile])

  const loadSearchData = async () => {
    try {
      await Promise.all([loadLeads(), loadClients()])
    } catch (error) {
      console.error('Error loading search data:', error)
    }
  }

  const loadLeads = async () => {
    try {
      if (!userProfile) return

      let query = supabase.from('leads').select('*')

      // Filter for executives - only show their assigned leads
      if (userProfile.role_id === EXECUTIVE_ROLE) {
        const { data: assignments, error: assignError } = await supabase
          .from('lead_assignments')
          .select('lead_id')
          .eq('assigned_to', userProfile.id)

        if (assignError) throw assignError

        const leadIds = assignments.map(a => a.lead_id)
        if (leadIds.length === 0) {
          setLeads([])
          return
        }

        query = query.in('id', leadIds)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      setLeads(data || [])
    } catch (error) {
      console.error('Error loading leads:', error)
    }
  }

  const loadClients = async () => {
    try {
      if (!userProfile) return

      // Fetch users with client role
      let { data: userData, error: userErr } = await supabase
        .from('users')
        .select(`
          id,
          email,
          phone,
          first_name,
          last_name,
          created_at,
          is_active
        `)
        .eq('role_id', CLIENT_ROLE)
        .order('created_at', { ascending: false })

      if (userErr) throw userErr

      // Filter for executives - only show clients from their assigned leads
      if (userProfile.role_id === EXECUTIVE_ROLE) {
        const { data: leadAssignments, error: laErr } = await supabase
          .from('lead_assignments')
          .select('lead_id')
          .eq('assigned_to', userProfile.id)

        if (laErr) throw laErr

        const leadIds = leadAssignments.map((a) => a.lead_id)
        if (leadIds.length) {
          const { data: leadsData, error: lErr } = await supabase
            .from('leads')
            .select('email')
            .in('id', leadIds)

          if (lErr) throw lErr

          const assignedEmails = leadsData.map((l) => l.email)
          userData = userData.filter((u) => assignedEmails.includes(u.email))
        } else {
          userData = []
        }
      }

      if (!userData || userData.length === 0) {
        setClients([])
        return
      }

      const userIds = userData.map(u => u.id)

      // Fetch payment data
      const [manualPaymentsResult, paymentLinksResult] = await Promise.all([
        supabase
          .from('manual_payment')
          .select('user_id, amount, plan_expiry')
          .in('user_id', userIds)
          .eq('status', 'completed'),
        supabase
          .from('payment_links')
          .select('user_id, amount, plan_expiry')
          .in('user_id', userIds)
          .eq('status', 'completed')
      ])

      // Process payments
      const paymentTotalsMap = new Map<string, number>()
      const planExpiryMap = new Map<string, Date>()

      ;[...(manualPaymentsResult.data || []), ...(paymentLinksResult.data || [])].forEach(pmt => {
        const uid = pmt.user_id
        const amt = pmt.amount || 0
        paymentTotalsMap.set(uid, (paymentTotalsMap.get(uid) || 0) + amt)
        if (pmt.plan_expiry) {
          const d = new Date(pmt.plan_expiry)
          const cur = planExpiryMap.get(uid)
          if (!cur || d > cur) planExpiryMap.set(uid, d)
        }
      })

      // Process client data
      const processedClients = userData.map(user => {
        const totalPaid = paymentTotalsMap.get(user.id) || 0
        const expiry = planExpiryMap.get(user.id)
        let status: Client['status'] = 'Inactive'
        if (user.is_active) {
          status = expiry
            ? expiry > new Date() ? 'Active' : 'Expired'
            : 'Inactive'
        }

        return {
          id: user.id,
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          email: user.email || '',
          phone: user.phone || '',
          created_at: user.created_at,
          totalAmountPaid: totalPaid,
          status
        }
      })

      setClients(processedClients)
    } catch (error) {
      console.error('Error loading clients:', error)
    }
  }

  // Search functionality
  const searchData = useMemo(() => {
    if (!searchTerm.trim()) return []

    const results: SearchResult[] = []
    const term = searchTerm.toLowerCase()

    // Search leads
    leads.forEach(lead => {
      const matchesSearch =
        lead.name.toLowerCase().includes(term) ||
        lead.phone_number.includes(term) ||
        lead.email.toLowerCase().includes(term) ||
        (lead.counselor?.toLowerCase() || '').includes(term) ||
        (lead.city?.toLowerCase() || '').includes(term) ||
        (lead.profession?.toLowerCase() || '').includes(term)

      if (matchesSearch) {
        results.push({
          id: lead.id,
          type: 'lead',
          title: lead.name,
          subtitle: lead.email,
          description: `${lead.phone_number} • ${lead.city || 'N/A'} • ${lead.profession || 'N/A'}`,
          status: lead.status,
          route: `/lead-information?tab=lead-information&leadId=${lead.id}`,
          data: lead
        })
      }
    })

    // Search clients
    clients.forEach(client => {
      const fullName = `${client.first_name} ${client.last_name}`.trim()
      const matchesSearch =
        fullName.toLowerCase().includes(term) ||
        client.email.toLowerCase().includes(term) ||
        client.phone.includes(term)

      if (matchesSearch) {
        results.push({
          id: client.id,
          type: 'client',
          title: fullName,
          subtitle: client.email,
          description: `${client.phone} • ₹${client.totalAmountPaid.toLocaleString()} paid`,
          status: client.status,
          route: `/clients?clientId=${client.id}`,
          data: client
        })
      }
    })

    return results.slice(0, 10) // Limit to 10 results
  }, [searchTerm, leads, clients])

  // Handle search input changes
  const handleSearchChange = async (value: string) => {
    setSearchTerm(value)
    if (value.trim()) {
      setIsSearching(true)
      setShowResults(true)
      // Simulate search delay
      setTimeout(() => {
        setSearchResults(searchData)
        setIsSearching(false)
      }, 300)
    } else {
      setSearchResults([])
      setShowResults(false)
      setIsSearching(false)
    }
  }

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    router.push(result.route)
    setSearchTerm("")
    setShowResults(false)
    setSearchResults([])
  }

  // Handle click outside search
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowResults(false)
      searchInputRef.current?.blur()
    }
  }

  const getStatusColor = (status: string, type: 'lead' | 'client') => {
    if (type === 'lead') {
      switch (status.toLowerCase()) {
        case "hot":
          return "bg-red-100 text-red-700 border-red-200"
        case "warm":
          return "bg-orange-100 text-orange-700 border-orange-200"
        case "cold":
          return "bg-blue-100 text-blue-700 border-blue-200"
        case "new":
          return "bg-emerald-100 text-emerald-700 border-emerald-200"
        case "failed":
          return "bg-gray-100 text-gray-700 border-gray-200"
        default:
          return "bg-gray-100 text-gray-700 border-gray-200"
      }
    } else {
      switch (status.toLowerCase()) {
        case "active":
          return "bg-green-100 text-green-700 border-green-200"
        case "expired":
          return "bg-red-100 text-red-700 border-red-200"
        case "inactive":
          return "bg-gray-100 text-gray-700 border-gray-200"
        default:
          return "bg-gray-100 text-gray-700 border-gray-200"
      }
    }
  }

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

        {/* center: search bar */}
        <div className="flex-1 max-w-2xl mx-8 relative" ref={searchContainerRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              ref={searchInputRef}
              placeholder="Search leads, clients..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => searchTerm && setShowResults(true)}
              className="pl-10 pr-4 py-2 border-emerald-200 hover:border-emerald-300 focus:border-emerald-400 focus:ring-emerald-200"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
              </div>
            )}
          </div>

          {/* Search Results Dropdown */}
          {showResults && (
            <Card className="absolute top-full mt-2 w-full max-h-96 overflow-y-auto border-0 shadow-2xl bg-white/95 backdrop-blur-sm z-50">
              <CardContent className="p-0">
                {isSearching ? (
                  <div className="p-4 text-center">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-600 mx-auto mb-2" />
                    <p className="text-slate-600">Searching...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="py-2">
                    {searchResults.map((result) => (
                      <button
                        key={`${result.type}-${result.id}`}
                        onClick={() => handleResultClick(result)}
                        className="w-full px-4 py-3 text-left hover:bg-emerald-50 transition-colors border-b border-slate-100 last:border-b-0"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 flex-1">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className={`text-white text-sm ${
                                result.type === 'lead' 
                                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500' 
                                  : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                              }`}>
                                {result.type === 'lead' 
                                  ? (result.data as Lead).name.split(" ").map(n => n[0]).join("").slice(0, 2)
                                  : `${(result.data as Client).first_name[0] || ''}${(result.data as Client).last_name[0] || ''}`.toUpperCase()
                                }
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <h4 className="font-semibold text-slate-900 truncate">
                                  {result.title}
                                </h4>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${getStatusColor(result.status, result.type)}`}
                                >
                                  {result.status}
                                </Badge>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${
                                    result.type === 'lead' 
                                      ? 'bg-blue-50 text-blue-700 border-blue-200' 
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  }`}
                                >
                                  {result.type === 'lead' ? 'Lead' : 'Client'}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-600 truncate flex items-center mt-1">
                                <Mail className="h-3 w-3 mr-1" />
                                {result.subtitle}
                              </p>
                              <p className="text-xs text-slate-500 truncate mt-1">
                                {result.description}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        </div>
                      </button>
                    ))}
                  </div>
                ) : searchTerm ? (
                  <div className="p-4 text-center">
                    <Search className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-600">No results found for "{searchTerm}"</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Try searching by name, email, or phone number
                    </p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )}
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