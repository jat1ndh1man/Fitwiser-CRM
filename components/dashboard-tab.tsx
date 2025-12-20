"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  CalendarIcon,
  TrendingUp,
  Users,
  AlertCircle,
  Clock,
  Thermometer,
  Snowflake,
  Flame,
  X,
  Filter,
  Loader2,
  IndianRupee,
  RefreshCw,
} from "lucide-react"
import { format } from "date-fns"
import type { DateRange } from "react-day-picker"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

interface Lead {
  id: string
  name: string
  email: string
  phone_number: string
  city: string
  profession: string
  status: string
  source: string
  counselor: string
  priority: string
  lead_score: number
  conversion_probability: number
  follow_up_date: string
  last_activity_date: string
  budget: string
  timeline: string
  notes: string
  created_at: string
  updated_at: string
}

interface User {
  id: string
  email: string
  phone: string
  first_name: string
  last_name: string
  role_id: string
  created_at: string
}

interface PaymentLink {
  id: string
  user_id: string
  lead_id: string
  payment_link: string
  payment_link_id: string
  amount: number
  currency: string
  description: string
  type: string
  expires_at: string
  status: string
  created_at: string
  updated_at: string
  payment_id: string
  is_manual: boolean
  payment_method: string
  transaction_id: string
  payment_date: string
  plan_expiry: string
}

interface ManualPayment {
  id: string
  user_id: string
  lead_id: string
  amount: number
  currency: string
  description: string
  payment_method: string
  status: string
  transaction_id: string
  payment_date: string
  created_at: string
  updated_at: string
  plan_expiry: string
  plan: string
}

interface AnalyticsData {
  count: number
  change: number
  color: string
  textColor: string
  isSpecial?: boolean
}

const getIcon = (type: string) => {
  switch (type) {
    case "new":
      return <Users className="h-4 w-4" />
    case "hot":
      return <Flame className="h-4 w-4" />
    case "warm":
      return <Thermometer className="h-4 w-4" />
    case "cold":
      return <Snowflake className="h-4 w-4" />
    case "failed":
      return <X className="h-4 w-4" />
    case "totalClients":
      return <Users className="h-4 w-4" />
    case "totalRevenue":
      return <IndianRupee className="h-4 w-4" />
    default:
      return <Users className="h-4 w-4" />
  }
}

// Utility function to check if date is within range
const isDateInRange = (dateStr: string, dateRange?: DateRange) => {
  if (!dateStr || !dateRange?.from) return true
  try {
    const date = new Date(dateStr)
    const from = dateRange.from
    const to = dateRange.to || dateRange.from
    return date >= from && date <= to
  } catch {
    return true
  }
}

export function DashboardTab() {
  const router = useRouter()
  
  // Filter states
  const [date, setDate] = useState<DateRange | undefined>()
  const [statusFilter, setStatusFilter] = useState("all")
  const [sourceFilter, setSourceFilter] = useState("all")
  const [cityFilter, setCityFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  
  // Data states
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [allLeads, setAllLeads] = useState<Lead[]>([])
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([])
  const [manualPayments, setManualPayment] = useState<ManualPayment[]>([])
  const [analyticsData, setAnalyticsData] = useState<Record<string, AnalyticsData>>({})
  
  // Calculated states
  const [totalClients, setTotalClients] = useState(0)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [collectionAnalytics, setCollectionAnalytics] = useState({
    totalCollected: 0,
    thisWeek: 0,
    lastWeek: 0,
    growthRate: 0,
    outstandingBalance: 0,
    overdue: 0,
    dueSoon: 0,
    recoveryRate: 0,
  })
  const [recentActivity, setRecentActivity] = useState<any[]>([])

  // Available filter options
  const [availableSources, setAvailableSources] = useState<string[]>([])
  const [availableCities, setAvailableCities] = useState<string[]>([])
  const [availableStatuses, setAvailableStatuses] = useState<string[]>([])
  const [availablePriorities, setAvailablePriorities] = useState<string[]>([])

  // User role and access control
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [assignedLeadIds, setAssignedLeadIds] = useState<string[]>([])
  const [hasFullAccess, setHasFullAccess] = useState(false)

  // Role constants
  const FULL_ACCESS_ROLES = [
    "b00060fe-175a-459b-8f72-957055ee8c55", // Superadmin
    "46e786df-0272-4f22-aec2-56d2a517fa9d", // Admin
    "11b93954-9a56-4ea5-a02c-15b731ee9dfb", // Sales manager
  ]

  // Fetch data from Supabase
  const fetchData = async (showRefreshLoader = false) => {
    try {
      if (showRefreshLoader) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      // 1) Get the current user
      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser()
      
      if (userError || !currentUser) {
        throw userError || new Error("Not signed in")
      }
      
      const currentUserId = currentUser.id
      setCurrentUserId(currentUserId)

      // 2) Load their role_id
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("role_id")
        .eq("id", currentUserId)
        .single()
        
      if (profileError || !profile) {
        throw profileError || new Error("No profile row")
      }
      
      const roleId = profile.role_id
      setUserRole(roleId)

      // 3) Check access level
      const isFullAccess = FULL_ACCESS_ROLES.includes(roleId)
      setHasFullAccess(isFullAccess)

      console.log("🏷️  User Access:", { currentUserId, roleId, isFullAccess })

      let assignedIds: string[] = []

      // 4) Build the leads query - ONLY filter leads for executives
      let leadsQuery = supabase.from("leads").select("*").order("created_at", { ascending: false })

      if (!isFullAccess) {
        // Executive → restrict to their assigned leads
        const { data: assignments = [], error: assignError } = await supabase
          .from("lead_assignments")
          .select("lead_id")
          .eq("assigned_to", currentUserId)
          
        if (assignError) throw assignError

        assignedIds = assignments.map((a) => a.lead_id)
        setAssignedLeadIds(assignedIds)

        if (assignedIds.length > 0) {
          leadsQuery = leadsQuery.in("id", assignedIds)
        } else {
          // no assignments → force an empty result set
          leadsQuery = leadsQuery.in("id", ["00000000-0000-0000-0000-000000000000"])
        }
      }

      const { data: leadsData = [], error: leadsError } = await leadsQuery
      if (leadsError) throw leadsError
      
      setAllLeads(leadsData)

      // Extract unique filter options from leads data
      const uniqueSources = [...new Set(leadsData.map(lead => lead.source).filter(Boolean))]
      const uniqueCities = [...new Set(leadsData.map(lead => lead.city).filter(Boolean))]
      const uniqueStatuses = [...new Set(leadsData.map(lead => lead.status).filter(Boolean))]
      const uniquePriorities = [...new Set(leadsData.map(lead => lead.priority).filter(Boolean))]

      setAvailableSources(uniqueSources)
      setAvailableCities(uniqueCities)
      setAvailableStatuses(uniqueStatuses)
      setAvailablePriorities(uniquePriorities)

      // 5) Fetch all users to match with leads by email
      const { data: usersData = [], error: usersError } = await supabase
        .from("users")
        .select("id, email, phone, first_name, last_name, role_id, created_at")
        
      if (usersError) throw usersError
      setAllUsers(usersData)

      // 6) Fetch payments with role-based filtering
      let paymentLinksQuery = supabase.from("payment_links").select("*").order("created_at", { ascending: false })
      let manualPaymentsQuery = supabase.from("manual_payment").select("*").order("created_at", { ascending: false })

      if (isFullAccess) {
        // SUPERADMIN/ADMIN: Get ALL payments - no filtering
        console.log("🔓 Full access user - fetching ALL payments")
      } else {
        // EXECUTIVE: Filter payments by leads assigned to them
        console.log("🔒 Executive user - filtering payments by assigned leads")

        // Create a mapping of lead emails to user IDs for assigned leads only
        const leadEmailToUserMap = new Map<string, string>()
        const leadPhoneToUserMap = new Map<string, string>()

        leadsData.forEach((lead) => {
          // Find matching user by email
          const matchingUser = usersData.find(
            (user) => user.email && lead.email && user.email.toLowerCase() === lead.email.toLowerCase(),
          )
          if (matchingUser) {
            leadEmailToUserMap.set(lead.id, matchingUser.id)
          }

          // Also try to match by phone as fallback
          if (!matchingUser && lead.phone_number) {
            const phoneMatchingUser = usersData.find(
              (user) => user.phone && lead.phone_number && user.phone === lead.phone_number,
            )
            if (phoneMatchingUser) {
              leadPhoneToUserMap.set(lead.id, phoneMatchingUser.id)
            }
          }
        })

        // Get user IDs that correspond to assigned leads
        const relevantUserIds = Array.from(
          new Set([...Array.from(leadEmailToUserMap.values()), ...Array.from(leadPhoneToUserMap.values())]),
        )

        console.log("📧 Executive Lead to User mapping:", {
          assignedLeads: leadsData.length,
          emailMatches: leadEmailToUserMap.size,
          phoneMatches: leadPhoneToUserMap.size,
          relevantUserIds: relevantUserIds.length,
        })

        // Filter payments by user_ids that match assigned leads
        if (relevantUserIds.length > 0) {
          paymentLinksQuery = paymentLinksQuery.in("user_id", relevantUserIds)
          manualPaymentsQuery = manualPaymentsQuery.in("user_id", relevantUserIds)
        } else {
          // No matching users found, return empty results
          paymentLinksQuery = paymentLinksQuery.in("user_id", ["00000000-0000-0000-0000-000000000000"])
          manualPaymentsQuery = manualPaymentsQuery.in("user_id", ["00000000-0000-0000-0000-000000000000"])
        }
      }

      const [{ data: paymentLinksData = [], error: plError }, { data: manualPaymentsData = [], error: mpError }] =
        await Promise.all([paymentLinksQuery, manualPaymentsQuery])

      if (plError) throw plError
      if (mpError) throw mpError

      setPaymentLinks(paymentLinksData)
      setManualPayment(manualPaymentsData)

      // 7) Calculate total clients & revenue based on filtered data
      const completedLinksForLeads = paymentLinksData.filter((p) => p.status === "completed")
      const completedManualForLeads = manualPaymentsData.filter((p) => p.status === "completed")

      const totalRevenueAmount = [...completedLinksForLeads, ...completedManualForLeads].reduce(
        (sum, p) => sum + (p.amount || 0),
        0,
      )

      setTotalClients(leadsData.length)
      setTotalRevenue(totalRevenueAmount)

      console.log("💰 Revenue calculation:", {
        userType: isFullAccess ? "FULL_ACCESS" : "EXECUTIVE",
        leads: leadsData.length,
        paymentLinks: paymentLinksData.length,
        manualPayments: manualPaymentsData.length,
        completedLinks: completedLinksForLeads.length,
        completedManual: completedManualForLeads.length,
        totalRevenue: totalRevenueAmount,
        assignedLeads: assignedIds.length,
      })
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    fetchData()
  }, [])

  // Enhanced filter application with multiple criteria
  useEffect(() => {
    let filtered = [...allLeads]

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((lead) => {
        const leadStatus = lead.status?.toLowerCase()
        const filterStatus = statusFilter.toLowerCase()
        return leadStatus === filterStatus
      })
    }

    // Apply source filter
    if (sourceFilter !== "all") {
      filtered = filtered.filter((lead) => {
        const leadSource = lead.source?.toLowerCase()
        const filterSource = sourceFilter.toLowerCase()
        return leadSource === filterSource
      })
    }

    // Apply city filter
    if (cityFilter !== "all") {
      filtered = filtered.filter((lead) => {
        const leadCity = lead.city?.toLowerCase()
        const filterCity = cityFilter.toLowerCase()
        return leadCity === filterCity
      })
    }

    // Apply priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter((lead) => {
        const leadPriority = lead.priority?.toLowerCase()
        const filterPriority = priorityFilter.toLowerCase()
        return leadPriority === filterPriority
      })
    }

    // Apply date range filter
    if (date?.from || date?.to) {
      filtered = filtered.filter((lead) => {
        return isDateInRange(lead.created_at, date)
      })
    }

    console.log("🔍 Filter applied:", {
      original: allLeads.length,
      filtered: filtered.length,
      filters: { statusFilter, sourceFilter, cityFilter, priorityFilter, dateRange: !!date?.from }
    })

    setFilteredLeads(filtered)
  }, [allLeads, statusFilter, sourceFilter, cityFilter, priorityFilter, date])

  // Process analytics data based on filtered leads
  useEffect(() => {
    if (filteredLeads.length >= 0) {
      const statusCounts = filteredLeads.reduce(
        (acc, lead) => {
          const status = lead.status?.toLowerCase() || "unknown"
          acc[status] = (acc[status] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )

      // Calculate changes compared to previous period (mock data for demonstration)
      const calculateChange = (current: number) => {
        // This should be calculated based on historical data
        // For now, using mock changes
        return Math.floor(Math.random() * 20) - 10
      }

      const processedAnalytics = {
        new: {
          count: statusCounts.new || 0,
          change: calculateChange(statusCounts.new || 0),
          color: "bg-emerald-500",
          textColor: "text-emerald-600",
        },
        hot: {
          count: statusCounts.hot || 0,
          change: calculateChange(statusCounts.hot || 0),
          color: "bg-red-500",
          textColor: "text-red-600",
        },
        warm: {
          count: statusCounts.warm || 0,
          change: calculateChange(statusCounts.warm || 0),
          color: "bg-orange-500",
          textColor: "text-orange-600",
        },
        cold: {
          count: statusCounts.cold || 0,
          change: calculateChange(statusCounts.cold || 0),
          color: "bg-blue-500",
          textColor: "text-blue-600",
        },
        failed: {
          count: statusCounts.failed || 0,
          change: calculateChange(statusCounts.failed || 0),
          color: "bg-gray-500",
          textColor: "text-gray-600",
        },
        totalClients: {
          count: filteredLeads.length, // Use filtered count
          change: calculateChange(filteredLeads.length),
          color: "bg-gradient-to-r from-purple-500 to-pink-500",
          textColor: "text-purple-600",
          isSpecial: true,
        },
        totalRevenue: {
          count: totalRevenue,
          change: calculateChange(totalRevenue),
          color: "bg-gradient-to-r from-green-500 to-teal-500",
          textColor: "text-green-600",
          isSpecial: true,
        },
      }
      setAnalyticsData(processedAnalytics)
    }
  }, [filteredLeads, totalRevenue])

// Process collection analytics - now filtered by selected date range
useEffect(() => {
  if (paymentLinks.length === 0 && manualPayments.length === 0) return;

  // 1️⃣ Filter payments to the selected date range:
  const linksInRange = paymentLinks.filter(p =>
    isDateInRange(p.payment_date || p.created_at, date)
  );
  const manualInRange = manualPayments.filter(p =>
    isDateInRange(p.payment_date || p.created_at, date)
  );

  // 2️⃣ Separate completed vs pending:
  const completed = [
    ...linksInRange.filter(p => p.status === "completed").map(p => ({ ...p, source: "link" })),
    ...manualInRange.filter(p => p.status === "completed").map(p => ({ ...p, source: "manual" })),
  ];
  const pending = [
    ...linksInRange.filter(p => p.status === "pending"),
    ...manualInRange.filter(p => p.status === "pending"),
  ];

  // 3️⃣ Totals:
  const totalCollected = completed.reduce((sum, p) => sum + (p.amount || 0), 0);
  const now = new Date().getTime();
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000;

  // week‑over‑week for collected
  const thisWeek = completed
    .filter(p => new Date(p.payment_date || p.created_at).getTime() >= oneWeekAgo)
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const lastWeek = completed
    .filter(p => {
      const t = new Date(p.payment_date || p.created_at).getTime();
      return t >= twoWeeksAgo && t < oneWeekAgo;
    })
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const growthRate = lastWeek > 0 ? ((thisWeek - lastWeek) / lastWeek) * 100 : 0;

  // 30‑day overdue & 7‑day due‑soon (all pending)
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  const sevenDaysAhead = now + 7 * 24 * 60 * 60 * 1000;
  const overdue = pending
    .filter(p => new Date(p.created_at).getTime() < thirtyDaysAgo)
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const dueSoon = pending
    .filter(p => {
      const exp = new Date(p.expires_at || p.plan_expiry || p.created_at).getTime();
      return exp > now && exp <= sevenDaysAhead;
    })
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const outstandingBalance = pending.reduce((sum, p) => sum + (p.amount || 0), 0);
  const recoveryRate =
    totalCollected + outstandingBalance > 0
      ? (totalCollected / (totalCollected + outstandingBalance)) * 100
      : 0;

  // 4️⃣ Update state:
  setCollectionAnalytics({
    totalCollected,
    thisWeek,
    lastWeek,
    growthRate,
    outstandingBalance,
    overdue,
    dueSoon,
    recoveryRate,
  });
}, [paymentLinks, manualPayments, date, userRole, hasFullAccess]);


  // Process recent activity based on filtered leads
  useEffect(() => {
    if (filteredLeads.length > 0) {
      const activities = filteredLeads.slice(0, 5).map((lead) => ({
        action: getActivityAction(lead),
        client: lead.name,
        time: getTimeAgo(lead.updated_at || lead.created_at),
        status: lead.status?.toLowerCase() || "unknown",
        priority: lead.priority?.toLowerCase() || "medium",
      }))
      setRecentActivity(activities)
    } else {
      setRecentActivity([])
    }
  }, [filteredLeads])

  const getActivityAction = (lead: Lead) => {
    const actions = ["New lead added", "Follow-up completed", "Meeting scheduled", "Lead updated", "Status changed"]
    return actions[Math.floor(Math.random() * actions.length)]
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`
    return `${Math.floor(diffInMinutes / 1440)} days ago`
  }

  const handleCardClick = (status: string) => {
    if (status === "totalClients") {
      router.push("/leads")
    } else if (status === "totalRevenue") {
      router.push("/reports")
    } else {
      const filterParam = status === "notReplying" ? "not_replying" : status
      router.push(`/leads?status=${filterParam}`)
    }
  }

  // Enhanced clear filters function
  const handleClearFilters = () => {
    setStatusFilter("all")
    setSourceFilter("all")
    setCityFilter("all")
    setPriorityFilter("all")
    setDate(undefined)
  }

  // Refresh data function
  const handleRefreshData = () => {
    fetchData(true)
  }

  // Check if any filters are active
  const hasActiveFilters = statusFilter !== "all" || sourceFilter !== "all" || cityFilter !== "all" || priorityFilter !== "all" || date?.from

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <span className="ml-2 text-emerald-600">Loading dashboard...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Filters Section */}
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-emerald-700">
              <Filter className="h-5 w-5" />
              Advanced Filters
            </CardTitle>
            <Button
              onClick={handleRefreshData}
              variant="outline"
              size="sm"
              disabled={refreshing}
              className="border-emerald-200 hover:border-emerald-300 text-emerald-600 hover:text-emerald-700"
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Date Range Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Date Range</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal border-emerald-200 hover:border-emerald-300 bg-transparent"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-emerald-600" />
                    {date?.from ? (
                      date.to ? (
                        <>
                          {format(date.from, "MMM dd")} - {format(date.to, "MMM dd")}
                        </>
                      ) : (
                        format(date.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-emerald-200 hover:border-emerald-300">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {availableStatuses.map(status => (
                    <SelectItem key={status} value={status.toLowerCase()}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Source Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Source</label>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="border-emerald-200 hover:border-emerald-300">
                  <SelectValue placeholder="All Sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  {availableSources.map(source => (
                    <SelectItem key={source} value={source.toLowerCase()}>
                      {source.charAt(0).toUpperCase() + source.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* City Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">City</label>
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="border-emerald-200 hover:border-emerald-300">
                  <SelectValue placeholder="All Cities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {availableCities.map(city => (
                    <SelectItem key={city} value={city.toLowerCase()}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Priority</label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="border-emerald-200 hover:border-emerald-300">
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  {availablePriorities.map(priority => (
                    <SelectItem key={priority} value={priority.toLowerCase()}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters Button */}
            <div className="flex items-end">
              <Button
                onClick={handleClearFilters}
                variant="outline"
                className="w-full border-emerald-200 hover:border-emerald-300 text-emerald-600 hover:text-emerald-700 bg-transparent"
                disabled={!hasActiveFilters}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter Summary */}
      {hasActiveFilters && (
        <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-emerald-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Filter className="h-4 w-4" />
                <span>
                  Showing {filteredLeads.length} of {allLeads.length} leads
                </span>
                {statusFilter !== "all" && (
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs">
                    Status: {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                  </span>
                )}
                {sourceFilter !== "all" && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                    Source: {sourceFilter.charAt(0).toUpperCase() + sourceFilter.slice(1)}
                  </span>
                )}
                {cityFilter !== "all" && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                    City: {cityFilter.charAt(0).toUpperCase() + cityFilter.slice(1)}
                  </span>
                )}
                {priorityFilter !== "all" && (
                  <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">
                    Priority: {priorityFilter.charAt(0).toUpperCase() + priorityFilter.slice(1)}
                  </span>
                )}
                {date?.from && (
                  <span className="px-2 py-1 bg-pink-100 text-pink-700 rounded-full text-xs">
                    Date Range Applied
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modern Analytics Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {Object.entries(analyticsData).map(([key, data]) => (
          <Card
            key={key}
            onClick={() => handleCardClick(key)}
            className={`relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group hover:scale-105 cursor-pointer ${
              data.isSpecial
                ? "bg-gradient-to-br from-gray-200 via-gray-50 to-gray-200 border-2 border-transparent"
                : "bg-white/90 backdrop-blur-sm"
            }`}
          >
            <div className={`absolute top-0 left-0 right-0 h-1 ${data.isSpecial ? data.color : data.color}`} />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle
                className={`text-sm font-medium capitalize ${data.isSpecial ? "text-slate-800 font-semibold" : "text-slate-700"}`}
              >
                {key === "totalClients"
                  ? hasFullAccess
                    ? "Total Leads"
                    : "Assigned Leads"
                  : key === "totalRevenue"
                    ? "Total Revenue"
                    : key}
              </CardTitle>
              <div
                className={`p-2 rounded-full text-white group-hover:scale-110 transition-transform ${
                  data.isSpecial ? `${data.color} shadow-lg` : data.color
                }`}
              >
                {getIcon(key)}
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-4xl font-bold ${data.isSpecial ? "text-slate-800" : data.textColor}`}>
                {key === "totalRevenue" ? (
                  <div className="flex text-xl items-center">
                    <IndianRupee className="h-5 w-5 mr-1" />
                    {data.count.toLocaleString()}
                  </div>
                ) : (
                  data.count
                )}
              </div>
           
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Enhanced Collection and Balance Due - NOW CORRECTLY ROLE-FILTERED */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card
          onClick={() => router.push("/reports")}
          className="border-0 shadow-xl bg-gradient-to-br from-blue-100 to-blue-50 hover:shadow-2xl transition-all duration-300 cursor-pointer"
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-bold text-black">
              <IndianRupee className="h-5 w-5" />
              Collection Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600 mb-2 flex items-center">
              <IndianRupee className="h-6 w-6 mr-1" />
              {collectionAnalytics.totalCollected.toLocaleString()}
            </div>
            <p className="text-sm text-slate-600 mb-4">Total collected this month</p>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-white/70 rounded-lg backdrop-blur-sm">
                <span className="text-sm font-medium">This Week</span>
                <span className="font-bold text-emerald-600 flex items-center">
                  <IndianRupee className="h-4 w-4 mr-1" />
                  {collectionAnalytics.thisWeek.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/70 rounded-lg backdrop-blur-sm">
                <span className="text-sm font-medium">Last Week</span>
                <span className="font-bold text-emerald-600 flex items-center">
                  <IndianRupee className="h-4 w-4 mr-1" />
                  {collectionAnalytics.lastWeek.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/70 rounded-lg backdrop-blur-sm">
                <span className="text-sm font-medium">Growth Rate</span>
                <span className={`font-bold flex items-center ${collectionAnalytics.growthRate >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {collectionAnalytics.growthRate.toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => router.push("/reports")}
          className="border-0 shadow-xl bg-gradient-to-br from-red-50 to-orange-50 hover:shadow-2xl transition-all duration-300 cursor-pointer"
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-black">
              <AlertCircle className="h-5 w-5" />
              Outstanding Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600 mb-2 flex items-center">
              <IndianRupee className="h-6 w-6 mr-1" />
              {collectionAnalytics.outstandingBalance.toLocaleString()}
            </div>
            <p className="text-sm text-slate-600 mb-4">Pending payments</p>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-white/70 rounded-lg backdrop-blur-sm">
                <span className="text-sm font-medium">Overdue (30+ days)</span>
                <span className="font-bold text-red-600 flex items-center">
                  <IndianRupee className="h-4 w-4 mr-1" />
                  {collectionAnalytics.overdue.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/70 rounded-lg backdrop-blur-sm">
                <span className="text-sm font-medium">Due Soon (7 days)</span>
                <span className="font-bold text-orange-600 flex items-center">
                  <IndianRupee className="h-4 w-4 mr-1" />
                  {collectionAnalytics.dueSoon.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/70 rounded-lg backdrop-blur-sm">
                <span className="text-sm font-medium">Recovery Rate</span>
                <span className="font-bold text-emerald-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {collectionAnalytics.recoveryRate.toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Recent Activity */}
      <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-emerald-700">Recent Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-emerald-50 rounded-lg hover:shadow-md transition-all duration-300 border border-emerald-100"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        activity.status === "new"
                          ? "bg-emerald-500"
                          : activity.status === "warm"
                            ? "bg-orange-500"
                            : activity.status === "hot"
                              ? "bg-red-500"
                              : "bg-blue-500"
                      } shadow-lg`}
                    />
                    <div>
                      <p className="font-medium text-slate-800">{activity.action}</p>
                      <p className="text-sm text-slate-600">{activity.client}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-slate-500">{activity.time}</span>
                    <div
                      className={`text-xs px-2 py-1 rounded-full mt-1 ${
                        activity.priority === "high"
                          ? "bg-red-100 text-red-700"
                          : activity.priority === "medium"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {activity.priority}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Clock className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p>No recent activity found</p>
                <p className="text-sm">Activity will appear here based on your current filters</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}