"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Calendar as CalendarIcon,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  AlertCircle,
  Clock,
  Thermometer,
  Snowflake,
  Flame,
  X,
  Filter,
  Loader2,
  IndianRupee,
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

interface PaymentLink {
  id: string
  user_id: string
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

export function DashboardTab() {
  const router = useRouter()
  const [date, setDate] = useState<DateRange | undefined>()
  const [statusFilter, setStatusFilter] = useState("all")
  const [sourceFilter, setSourceFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [allLeads, setAllLeads] = useState<Lead[]>([]) // Store all leads
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]) // Store filtered leads
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([])
  const [manualPayments, setManualPayments] = useState<ManualPayment[]>([])
  const [analyticsData, setAnalyticsData] = useState<Record<string, AnalyticsData>>({})
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
    recoveryRate: 0
  })
  const [recentActivity, setRecentActivity] = useState<any[]>([])

  // Fetch data from Supabase
useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true)

      //
      // 1) Get the current user
      //
      const {
        data: { user: currentUser },
        error: userError
      } = await supabase.auth.getUser()
      if (userError || !currentUser) throw userError || new Error('Not signed in')
      const currentUserId = currentUser.id

      //
      // 2) Load their role_id
      //
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('role_id')
        .eq('id', currentUserId)
        .single()
      if (profileError || !profile) throw profileError || new Error('No profile row')
      const roleId = profile.role_id

      console.log('🏷️  currentUserId:', currentUserId, 'roleId:', roleId)

      //
      // 3) Define full‑access roles
      //
      const FULL_ACCESS_ROLES = [
        'b00060fe-175a-459b-8f72-957055ee8c55', // Superadmin
        '46e786df-0272-4f22-aec2-56d2a517fa9d', // Admin
        '11b93954-9a56-4ea5-a02c-15b731ee9dfb'  // Sales manager
      ]

      //
      // 4) Build the leads query
      //
      let leadsQuery = supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })

      if (!FULL_ACCESS_ROLES.includes(roleId)) {
        // Executive → restrict to their assigned leads
        const { data: assignments = [], error: assignError } = await supabase
          .from('lead_assignments')
          .select('lead_id')
          .eq('assigned_to', currentUserId)
        if (assignError) throw assignError

        const assignedIds = assignments.map(a => a.lead_id)
        if (assignedIds.length > 0) {
          leadsQuery = leadsQuery.in('id', assignedIds)
        } else {
          // no assignments → force an empty result set
          leadsQuery = leadsQuery.in('id', ['00000000-0000-0000-0000-000000000000'])
        }
      }

      const { data: leadsData = [], error: leadsError } = await leadsQuery
      if (leadsError) throw leadsError
      setAllLeads(leadsData)
      setFilteredLeads(leadsData)

      //
      // 5) Now fetch payments (unchanged)
      //
      const [{ data: paymentLinksData = [], error: plError },
             { data: manualPaymentsData = [], error: mpError }] = await Promise.all([
        supabase.from('payment_links').select('*').order('created_at', { ascending: false }),
        supabase.from('manual_payment') .select('*').order('created_at', { ascending: false })
      ])
      if (plError) throw plError
      if (mpError) throw mpError

      setPaymentLinks(paymentLinksData)
      setManualPayments(manualPaymentsData)

      //
      // 6) Total clients & revenue (unchanged)
      //
      const completedLinks = paymentLinksData.filter(p => p.status === 'completed')
      const completedManual = manualPaymentsData.filter(p => p.status === 'completed')
    const leadIdsSet = new Set(leadsData.map(l => l.id))

// only count payments for those leads
const completedLinksForLeads = paymentLinksData
  .filter(p => p.status === 'completed' && leadIdsSet.has(p.user_id))
const completedManualForLeads = manualPaymentsData
  .filter(p => p.status === 'completed' && leadIdsSet.has(p.user_id))

setTotalClients(leadsData.length)         // total = all fetched leads
setTotalRevenue(
  [...completedLinksForLeads, ...completedManualForLeads]
    .reduce((sum, p) => sum + (p.amount||0), 0)
)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  fetchData()
}, [])


  // Apply local filters whenever filter parameters change
  useEffect(() => {
    let filtered = [...allLeads]

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(lead => 
        lead.status?.toLowerCase() === statusFilter.toLowerCase()
      )
    }

    // Apply source filter
    if (sourceFilter !== 'all') {
      filtered = filtered.filter(lead => 
        lead.source?.toLowerCase() === sourceFilter.toLowerCase()
      )
    }

    // Apply date range filter
    if (date?.from && date?.to) {
      filtered = filtered.filter(lead => {
        const leadDate = new Date(lead.created_at)
        return leadDate >= date.from! && leadDate <= date.to!
      })
    } else if (date?.from) {
      filtered = filtered.filter(lead => {
        const leadDate = new Date(lead.created_at)
        return leadDate >= date.from!
      })
    }

    setFilteredLeads(filtered)
  }, [allLeads, statusFilter, sourceFilter, date])

  // Process analytics data based on filtered leads
  useEffect(() => {
    if (filteredLeads.length >= 0) {
      const statusCounts = filteredLeads.reduce((acc, lead) => {
        const status = lead.status?.toLowerCase() || 'unknown'
        acc[status] = (acc[status] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      // Calculate changes (mock data for demonstration - you'd need historical data)
      const mockChanges = {
        new: 12,
        hot: 8,
        warm: -3,
        cold: 5,
        failed: -2,
        totalClients: 15,
        totalRevenue: 25000
      }

      const processedAnalytics = {
        new: {
          count: statusCounts.new || 0,
          change: mockChanges.new,
          color: "bg-emerald-500",
          textColor: "text-emerald-600"
        },
        hot: {
          count: statusCounts.hot || 0,
          change: mockChanges.hot,
          color: "bg-red-500",
          textColor: "text-red-600"
        },
        warm: {
          count: statusCounts.warm || 0,
          change: mockChanges.warm,
          color: "bg-orange-500",
          textColor: "text-orange-600"
        },
        cold: {
          count: statusCounts.cold || 0,
          change: mockChanges.cold,
          color: "bg-blue-500",
          textColor: "text-blue-600"
        },
        failed: {
          count: statusCounts.failed || 0,
          change: mockChanges.failed,
          color: "bg-gray-500",
          textColor: "text-gray-600"
        },
        totalClients: {
          count: totalClients,
          change: mockChanges.totalClients,
          color: "bg-gradient-to-r from-purple-500 to-pink-500",
          textColor: "text-purple-600",
          isSpecial: true
        },
        totalRevenue: {
          count: totalRevenue,
          change: mockChanges.totalRevenue,
          color: "bg-gradient-to-r from-green-500 to-teal-500",
          textColor: "text-green-600",
          isSpecial: true
        }
      }

      setAnalyticsData(processedAnalytics)
    }
  }, [filteredLeads, totalClients, totalRevenue])

  // Process collection analytics
  useEffect(() => {
    if (paymentLinks.length > 0 || manualPayments.length > 0) {
      const allPayments = [
        ...paymentLinks.filter(p => p.status === 'completed').map(p => ({ ...p, source: 'link' })),
        ...manualPayments.filter(p => p.status === 'completed').map(p => ({ ...p, source: 'manual' }))
      ]

      const totalCollected = allPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0)
      
      const now = new Date()
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

      const thisWeekPayments = allPayments.filter(p => 
        new Date(p.payment_date || p.created_at) >= oneWeekAgo
      )
      const lastWeekPayments = allPayments.filter(p => {
        const paymentDate = new Date(p.payment_date || p.created_at)
        return paymentDate >= twoWeeksAgo && paymentDate < oneWeekAgo
      })

      const thisWeek = thisWeekPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
      const lastWeek = lastWeekPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
      const growthRate = lastWeek > 0 ? ((thisWeek - lastWeek) / lastWeek) * 100 : 0

      // Outstanding balance calculation
      const pendingPayments = [
        ...paymentLinks.filter(p => p.status === 'pending'),
        ...manualPayments.filter(p => p.status === 'pending')
      ]
      const outstandingBalance = pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0)

      // Mock overdue and due soon calculations
      const overdue = outstandingBalance * 0.35 // 35% of outstanding
      const dueSoon = outstandingBalance * 0.65 // 65% of outstanding
      const recoveryRate = 78.2 // Mock recovery rate

      setCollectionAnalytics({
        totalCollected,
        thisWeek,
        lastWeek,
        growthRate,
        outstandingBalance,
        overdue,
        dueSoon,
        recoveryRate
      })
    }
  }, [paymentLinks, manualPayments])

  // Process recent activity based on filtered leads
  useEffect(() => {
    if (filteredLeads.length > 0) {
      const activities = filteredLeads
        .slice(0, 5)
        .map(lead => ({
          action: getActivityAction(lead),
          client: lead.name,
          time: getTimeAgo(lead.updated_at || lead.created_at),
          status: lead.status?.toLowerCase() || 'unknown',
          priority: lead.priority?.toLowerCase() || 'medium'
        }))

      setRecentActivity(activities)
    }
  }, [filteredLeads])

  const getActivityAction = (lead: Lead) => {
    const actions = [
      'New lead added',
      'Follow-up completed',
      'Meeting scheduled',
      'Lead updated',
      'Status changed'
    ]
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
    if (status === 'totalClients') {
      router.push('/clients')
    } else if (status === 'totalRevenue') {
      router.push('/reports')
    } else {
      const filterParam = status === 'notReplying' ? 'not_replying' : status
      router.push(`/leads?status=${filterParam}`)
    }
  }

  // Clear filters function
  const handleClearFilters = () => {
    setStatusFilter('all')
    setSourceFilter('all')
    setDate(undefined)
  }

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
      {/* Enhanced Date Range Picker with Filters */}
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-700">
            <Filter className="h-5 w-5" />
            Advanced Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Date Range</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal border-emerald-200 hover:border-emerald-300"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-emerald-600" />
                    {date?.from ? (
                      date.to ? (
                        <>
                          {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(date.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
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

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-emerald-200 hover:border-emerald-300">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="hot">Hot</SelectItem>
                  <SelectItem value="warm">Warm</SelectItem>
                  <SelectItem value="cold">Cold</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Source</label>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="border-emerald-200 hover:border-emerald-300">
                  <SelectValue placeholder="All Sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="social">Social Media</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="coldcall">Cold Call</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                onClick={handleClearFilters}
                variant="outline"
                className="w-full border-emerald-200 hover:border-emerald-300 text-emerald-600 hover:text-emerald-700"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter Summary */}
      {(statusFilter !== 'all' || sourceFilter !== 'all' || date?.from) && (
        <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-emerald-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Filter className="h-4 w-4" />
                <span>Showing {filteredLeads.length} of {allLeads.length} leads</span>
                {statusFilter !== 'all' && (
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs">
                    Status: {statusFilter}
                  </span>
                )}
                {sourceFilter !== 'all' && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                    Source: {sourceFilter}
                  </span>
                )}
                {date?.from && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
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
                ? 'bg-gradient-to-br from-gray-200 via-gray-50 to-gray-200 border-2 border-transparent' 
                : 'bg-white/90 backdrop-blur-sm'
            }`}
          >
            <div className={`absolute top-0 left-0 right-0 h-1 ${data.isSpecial ? data.color : data.color}`} />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium capitalize ${data.isSpecial ? 'text-slate-800 font-semibold' : 'text-slate-700'}`}>
                {key === "totalClients" ? "Assigned Leads" : key === "totalRevenue" ? "Total Revenue" : key}
              </CardTitle>
              <div className={`p-2 rounded-full text-white group-hover:scale-110 transition-transform ${
                data.isSpecial 
                  ? `${data.color} shadow-lg` 
                  : data.color
              }`}>
                {getIcon(key)}
              </div>
            </CardHeader>
            <CardContent>
             <div className={`text-5xl font-bold ${data.isSpecial ? 'text-slate-800' : data.textColor}`}>
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

      {/* Enhanced Collection and Balance Due */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card 
          onClick={() => router.push('/reports')}
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
                <span className="font-bold text-emerald-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {collectionAnalytics.growthRate.toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          onClick={() => router.push('/reports')}
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
                  {collectionAnalytics.recoveryRate}%
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