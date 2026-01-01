"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
} from "recharts"
import {
  TrendingUp,
  Users,
  Target,
  DollarSign,
  Filter,
  BarChart3,
  PieChartIcon,
  Activity,
  MapPin,
  CalendarIcon,
  UserCheck,
  AlertTriangle,
  Clock,
  Search,
} from "lucide-react"
import { format } from "date-fns"
import type { DateRange } from "react-day-picker"
import { createClient } from '@supabase/supabase-js'

// Supabase client setup
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',     
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''  
)

// Static data for follow-up and renewal trends


export function AnalyticsTab() {
  // Filter states
  const [activeAnalytic, setActiveAnalytic] = useState("conversion")
  const [timeFilter, setTimeFilter] = useState("6months")
  const [sourceFilter, setSourceFilter] = useState("all")
  const [cityFilter, setCityFilter] = useState("all")
  const [packageFilter, setPackageFilter] = useState("all")
  const [genderFilter, setGenderFilter] = useState("all")
  const [coachFilter, setCoachFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  
  // Role-based access control
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [assignedLeadIds, setAssignedLeadIds] = useState<string[]>([])
  
  // Available filter options
  const [availableSources, setAvailableSources] = useState<string[]>([])
  const [availableCities, setAvailableCities] = useState<string[]>([])
  const [availablePackages, setAvailablePackages] = useState<string[]>([])
  const [availableCoaches, setAvailableCoaches] = useState<string[]>([])
  
  // Role constants
  const EXECUTIVE_ROLE = '1fe1759c-dc14-4933-947a-c240c046bcde'
  
  // Data states
  const [genderAnalysisData, setGenderAnalysisData] = useState<{ gender: string; count: number; percentage: number }[]>([])
  const [packageAnalysisData, setPackageAnalysisData] = useState<{ plan: string; count: number; revenue: number; avgValue: number }[]>([])
  const [cityAnalysisData, setCityAnalysisData] = useState<{ city: string; clients: number; revenue: number; growth: number }[]>([])
  const [salesData, setSalesData] = useState<{ month: string; [plan: string]: number }[]>([])
  const [salesOverview, setSalesOverview] = useState({
    totalSales: 0,
    growthRate: 0,
    bestMonth: "",
    bestMonthRevenue: 0,
    avgDealSize: 0,
  })
  const [liveMembers, setLiveMembers] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    locationWise: [] as Array<{ location: string; active: number; inactive: number; total: number }>,
    packageDistribution: [] as Array<{ package: string; total: number }>,
    ageCategoryWise: [] as Array<{ category: string; active: number; inactive: number; total: number }>,
    professionWise: [] as Array<{ profession: string; active: number; inactive: number; total: number }>,
  })
  const [conversionData, setConversionData] = useState({
    sourceWise: [] as Array<{ source: string; leads: number; conversions: number; rate: number; revenue: number }>,
    rmWise: [] as Array<{ rm: string; leads: number; conversions: number; rate: number; revenue: number }>,
    monthWise: [] as Array<{ month: string; leads: number; conversions: number; rate: number; revenue: number }>,
  })
  const [renewalAnalytics, setRenewalAnalytics] = useState({
    sourceWise: [] as Array<{ source: string; total: number; renewed: number; rate: number }>,
    coachWise: [] as Array<{ coach: string; total: number; renewed: number; rate: number }>,
    monthWise: [] as Array<{ month: string; total: number; renewed: number; rate: number }>,
  })
  // Add this state after your existing renewalAnalytics state
const [renewalTrendsData, setRenewalTrendsData] = useState({
  totalRenewals: 0,
  totalRevenue: 0,
  avgRenewalRate: 0,
  growthRate: 0,
  monthlyTrends: [] as Array<{ month: string; renewals: number; revenue: number; rate: number }>,
})

// Add this state for missed follow-ups (if you want to make it dynamic too)
const [missedFollowUpData, setMissedFollowUpData] = useState<Array<{
  counselor: string;
  total: number;
  missed: number;
  rate: number;
  impact: string;
}>>([])
  const [sourceAnalysisData, setSourceAnalysisData] = useState<{ source: string; count: number; revenue: number; conversion: number }[]>([])

  // Utility functions
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

  const isDateInTimeFilter = (dateStr: string, timeFilter: string) => {
    if (!dateStr) return true
    try {
      const date = new Date(dateStr)
      const now = new Date()
      
      switch (timeFilter) {
        case "1month":
          const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
          return date >= oneMonthAgo
        case "3months":
          const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
          return date >= threeMonthsAgo
        case "6months":
          const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
          return date >= sixMonthsAgo
        case "1year":
          const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
          return date >= oneYearAgo
        case "2years":
          const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate())
          return date >= twoYearsAgo
        default:
          return true
      }
    } catch {
      return true
    }
  }

  const applyLeadFilters = (leads: any[]) => {
    if (!Array.isArray(leads)) return []
    
    return leads.filter(lead => {
      if (searchTerm && searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase()
        const searchableFields = [
          lead.email, lead.source, lead.city, lead.first_name, 
          lead.last_name, lead.phone, lead.profession
        ]
        const matchesSearch = searchableFields.some(field => 
          field && String(field).toLowerCase().includes(searchLower)
        )
        if (!matchesSearch) return false
      }
      
      if (sourceFilter !== "all" && lead.source !== sourceFilter) return false
      if (cityFilter !== "all" && lead.city !== cityFilter) return false

      if (lead.created_at) {
        if (!isDateInRange(lead.created_at, dateRange)) return false
        if (!isDateInTimeFilter(lead.created_at, timeFilter)) return false
      }
      
      return true
    })
  }

  const applyPaymentFilters = (payments: any[]) => {
    if (!Array.isArray(payments)) return []
    
    return payments.filter(payment => {
      if (payment.payment_date && !isDateInRange(payment.payment_date, dateRange)) return false
      if (payment.payment_date && !isDateInTimeFilter(payment.payment_date, timeFilter)) return false
      if (packageFilter !== "all" && payment.plan !== packageFilter) return false
      return true
    })
  }

  const applyUserFilters = (users: any[]) => {
    if (!Array.isArray(users)) return []
    
    return users.filter(user => {
      if (searchTerm && searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase()
        const searchableFields = [
          user.email, user.first_name, user.last_name, user.gender, user.profession
        ]
        const matchesSearch = searchableFields.some(field => 
          field && String(field).toLowerCase().includes(searchLower)
        )
        if (!matchesSearch) return false
      }

      if (genderFilter !== "all" && user.gender !== genderFilter) return false
      return true
    })
  }

  // Initialize user access
  useEffect(() => {
    const initializeUserAccess = async () => {
      try {
        const userProfile = localStorage.getItem('userProfile')
        if (!userProfile) return
        
        const { id: userId, role_id: roleId } = JSON.parse(userProfile)
        setCurrentUserId(userId)
        setCurrentUserRole(roleId)
        
        if (roleId === EXECUTIVE_ROLE) {
          const { data: assignments, error } = await supabase
            .from('lead_assignments')
            .select('lead_id')
            .eq('assigned_to', userId)
          
          if (!error && assignments) {
            const leadIds = assignments.map(a => a.lead_id)
            setAssignedLeadIds(leadIds)
          }
        }
      } catch (error) {
        console.error('Error initializing user access:', error)
      }
    }
    
    initializeUserAccess()
  }, [])

  // Load filter options
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        let leadsQuery = supabase.from('leads').select('source, city')
        if (currentUserRole === EXECUTIVE_ROLE && assignedLeadIds.length > 0) {
          leadsQuery = leadsQuery.in('id', assignedLeadIds)
        }
        
        const { data: leads } = await leadsQuery
        if (leads) {
          setAvailableSources([...new Set(leads.map(l => l.source).filter(Boolean))])
          setAvailableCities([...new Set(leads.map(l => l.city).filter(Boolean))])
        }

        let manualQuery = supabase.from('manual_payment').select('plan, lead_id')
        let linksQuery = supabase.from('payment_links').select('plan, lead_id')
        
        if (currentUserRole === EXECUTIVE_ROLE && assignedLeadIds.length > 0) {
          manualQuery = manualQuery.in('lead_id', assignedLeadIds)
          linksQuery = linksQuery.in('lead_id', assignedLeadIds)
        }

        const [{ data: manual }, { data: links }] = await Promise.all([manualQuery, linksQuery])
        const allPayments = [...(manual || []), ...(links || [])]
        setAvailablePackages([...new Set(allPayments.map(p => p.plan).filter(Boolean))])

        const { data: assignments } = await supabase.from('lead_assignments').select('assigned_to')
        if (assignments) {
          const rmIds = [...new Set(assignments.map(a => a.assigned_to).filter(Boolean))]
          const { data: coaches } = await supabase
            .from('users')
            .select('id, first_name, last_name')
            .in('id', rmIds)
          
          if (coaches) {
            const coachNames = coaches
              .map(c => `${c.first_name || ''} ${c.last_name || ''}`.trim())
              .filter(Boolean)
            setAvailableCoaches(coachNames)
          }
        }
      } catch (error) {
        console.error('Error loading filter options:', error)
      }
    }

    if (currentUserRole !== null) {
      loadFilterOptions()
    }
  }, [currentUserRole, assignedLeadIds])

  // Gender Analysis
  useEffect(() => {
    if (activeAnalytic !== 'gender') return
    
    const fetchGenderData = async () => {
      try {
        let query = supabase.from('users').select('gender, email, first_name, last_name')
        
        if (currentUserRole === EXECUTIVE_ROLE && assignedLeadIds.length > 0) {
          const { data: leads } = await supabase
            .from('leads')
            .select('email')
            .in('id', assignedLeadIds)
          
          const assignedEmails = leads?.map(l => l.email) || []
          if (assignedEmails.length === 0) {
            setGenderAnalysisData([])
            return
          }
          query = query.in('email', assignedEmails)
        }
        
        const { data, error } = await query
        if (error) {
          console.error('Gender analysis error:', error)
          return
        }

        const filteredData = applyUserFilters(data || [])
        const total = filteredData.length

        if (total === 0) {
          setGenderAnalysisData([])
          return
        }

        const counts = filteredData.reduce((acc, { gender }) => {
          const g = gender || 'Unknown'
          acc[g] = (acc[g] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        const result = Object.entries(counts).map(([gender, count]) => ({
          gender,
          count,
          percentage: parseFloat(((count / total) * 100).toFixed(1)),
        }))

        setGenderAnalysisData(result)
      } catch (error) {
        console.error('Error in gender analysis:', error)
        setGenderAnalysisData([])
      }
    }

    fetchGenderData()
  }, [activeAnalytic, currentUserRole, assignedLeadIds, genderFilter, searchTerm, dateRange, timeFilter])

  // Package Analysis
  useEffect(() => {
    if (activeAnalytic !== "package") return

    const fetchPackageData = async () => {
      try {
        let manualQuery = supabase.from("manual_payment").select("plan, amount, lead_id, payment_date")
        let linksQuery = supabase.from("payment_links").select("plan, amount, lead_id, payment_date")
        
        if (currentUserRole === EXECUTIVE_ROLE && assignedLeadIds.length > 0) {
          manualQuery = manualQuery.in('lead_id', assignedLeadIds)
          linksQuery = linksQuery.in('lead_id', assignedLeadIds)
        }
        
        const [{ data: manual }, { data: links }] = await Promise.all([manualQuery, linksQuery])
        const all = [...(manual || []), ...(links || [])]
        const filteredPayments = applyPaymentFilters(all)
        
        if (filteredPayments.length === 0) {
          setPackageAnalysisData([])
          return
        }

        const agg: Record<string, { count: number; revenue: number }> = {}
        filteredPayments.forEach(({ plan, amount }) => {
          const p = plan || "Unknown"
          if (!agg[p]) agg[p] = { count: 0, revenue: 0 }
          agg[p].count += 1
          agg[p].revenue += amount || 0
        })

        const result = Object.entries(agg).map(([plan, { count, revenue }]) => ({
          plan,
          count,
          revenue,
          avgValue: count > 0 ? Math.round(revenue / count) : 0,
        }))

        setPackageAnalysisData(result)
      } catch (error) {
        console.error('Error in package analysis:', error)
        setPackageAnalysisData([])
      }
    }

    fetchPackageData()
  }, [activeAnalytic, currentUserRole, assignedLeadIds, packageFilter, dateRange, timeFilter, searchTerm])

  // City Analysis
  useEffect(() => {
    if (activeAnalytic !== "city") return

    const fetchCityData = async () => {
      try {
        let leadsQuery = supabase.from("leads").select("id, email, city, created_at")
        if (currentUserRole === EXECUTIVE_ROLE && assignedLeadIds.length > 0) {
          leadsQuery = leadsQuery.in('id', assignedLeadIds)
        }
        
        const { data: leads } = await leadsQuery
        const filteredLeads = applyLeadFilters(leads || [])

        const [{ data: manualPayments }, { data: paymentLinks }] = await Promise.all([
          supabase.from("manual_payment").select("amount, payment_date, lead_id"),
          supabase.from("payment_links").select("amount, payment_date, lead_id")
        ])

        const allPayments = [...(manualPayments || []), ...(paymentLinks || [])]
        const filteredPayments = applyPaymentFilters(allPayments)

        const leadCityMap: Record<string, string> = {}
        filteredLeads.forEach(lead => {
          leadCityMap[lead.id] = lead.city || "Unknown"
        })

        type Payment = { amount: number; date: string }
        const cityMap: Record<string, { revenue: number; clients: Set<string>; payments: Payment[] }> = {}

        filteredPayments.forEach(payment => {
          const city = leadCityMap[payment.lead_id] || "Unknown"
          if (!cityMap[city]) {
            cityMap[city] = { revenue: 0, clients: new Set(), payments: [] }
          }
          cityMap[city].revenue += payment.amount || 0
          cityMap[city].clients.add(payment.lead_id)
          if (payment.payment_date) {
            cityMap[city].payments.push({
              amount: payment.amount || 0,
              date: payment.payment_date,
            })
          }
        })

        const now = new Date()
        const thisMonth = now.getMonth()
        const thisYear = now.getFullYear()
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).getMonth()
        const lastYear = new Date(now.getFullYear(), now.getMonth() - 1, 1).getFullYear()

        const cityData = Object.entries(cityMap).map(([city, { revenue, clients, payments }]) => {
          const currentMonthRevenue = payments.filter(p => {
            const d = new Date(p.date)
            return d.getFullYear() === thisYear && d.getMonth() === thisMonth
          }).reduce((sum, p) => sum + p.amount, 0)

          const lastMonthRevenue = payments.filter(p => {
            const d = new Date(p.date)
            return d.getFullYear() === lastYear && d.getMonth() === lastMonth
          }).reduce((sum, p) => sum + p.amount, 0)

          const growth = lastMonthRevenue > 0
            ? parseFloat(((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1))
            : currentMonthRevenue > 0 ? 100 : 0

          return {
            city,
            clients: clients.size,
            revenue,
            growth,
          }
        })

        setCityAnalysisData(cityData)
      } catch (error) {
        console.error('Error in city analysis:', error)
        setCityAnalysisData([])
      }
    }

    fetchCityData()
  }, [activeAnalytic, currentUserRole, assignedLeadIds, cityFilter, dateRange, timeFilter, searchTerm])

  // Sales Analysis
  useEffect(() => {
    if (activeAnalytic !== "sales") return

    const fetchSalesData = async () => {
      try {
        let manualQuery = supabase.from("manual_payment").select("plan, amount, payment_date, lead_id")
        let linksQuery = supabase.from("payment_links").select("plan, amount, payment_date, lead_id")
        
        if (currentUserRole === EXECUTIVE_ROLE && assignedLeadIds.length > 0) {
          manualQuery = manualQuery.in('lead_id', assignedLeadIds)
          linksQuery = linksQuery.in('lead_id', assignedLeadIds)
        }
        
        const [manualRes, linkRes] = await Promise.all([manualQuery, linksQuery])
        const all = [...(manualRes.data || []), ...(linkRes.data || [])]
        const filteredPayments = applyPaymentFilters(all)

        if (filteredPayments.length === 0) {
          setSalesData([])
          setSalesOverview({
            totalSales: 0,
            growthRate: 0,
            bestMonth: "",
            bestMonthRevenue: 0,
            avgDealSize: 0,
          })
          return
        }

        const monthOrder = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
        const grouped: Record<string, Record<string, number>> = {}
        
        filteredPayments.forEach(({ plan = "Unknown", amount, payment_date }) => {
          if (!payment_date) return
          const m = new Date(payment_date).toLocaleString("default", { month: "short" })
          grouped[m] = grouped[m] || {}
          grouped[m][plan] = (grouped[m][plan] || 0) + (amount || 0)
        })

        const sorted = Object.keys(grouped).sort((a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b))
        const formatted = sorted.map((m) => ({ month: m, ...grouped[m] }))
        setSalesData(formatted)

        const totalSales = filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
        const monthRevenues = sorted.map((m) => Object.values(grouped[m]).reduce((s, v) => s + v, 0))
        
        const lastIdx = monthRevenues.length - 1
        const prevIdx = Math.max(0, lastIdx - 1)
        const growthRate = prevIdx >= 0 && monthRevenues[prevIdx] > 0
          ? parseFloat(((monthRevenues[lastIdx] - monthRevenues[prevIdx]) / monthRevenues[prevIdx] * 100).toFixed(1))
          : 0

        const bestIdx = monthRevenues.length > 0 ? monthRevenues.indexOf(Math.max(...monthRevenues)) : -1
        const bestMonth = bestIdx >= 0 ? sorted[bestIdx] : ""
        const bestMonthRevenue = bestIdx >= 0 ? monthRevenues[bestIdx] : 0
        const avgDealSize = filteredPayments.length > 0 ? Math.round(totalSales / filteredPayments.length) : 0

        setSalesOverview({
          totalSales,
          growthRate,
          bestMonth,
          bestMonthRevenue,
          avgDealSize,
        })
      } catch (error) {
        console.error('Error in sales analysis:', error)
        setSalesData([])
        setSalesOverview({
          totalSales: 0,
          growthRate: 0,
          bestMonth: "",
          bestMonthRevenue: 0,
          avgDealSize: 0,
        })
      }
    }

    fetchSalesData()
  }, [activeAnalytic, currentUserRole, assignedLeadIds, packageFilter, dateRange, timeFilter, searchTerm])

  // Live Members Analysis
useEffect(() => {
  if (activeAnalytic !== "livemembers") return

  const fetchLiveMembersData = async () => {
    try {
      // Initialize with safe defaults first
      setLiveMembers({
        total: 0,
        active: 0,
        inactive: 0,
        locationWise: [],
        packageDistribution: [],
        ageCategoryWise: [],
        professionWise: [],
      })

      let usersQuery = supabase.from("users").select("email, is_active, date_of_birth, first_name, last_name")
      let leadsQuery = supabase.from("leads").select("email, city, profession")
      
      if (currentUserRole === EXECUTIVE_ROLE && assignedLeadIds.length > 0) {
        const { data: assignedLeads } = await supabase
          .from('leads')
          .select('email')
          .in('id', assignedLeadIds)
        
        const assignedEmails = assignedLeads?.map(l => l.email) || []
        if (assignedEmails.length === 0) {
          return
        }
        
        usersQuery = usersQuery.in('email', assignedEmails)
        leadsQuery = leadsQuery.in('email', assignedEmails)
      }
      
      const [{ data: users }, { data: leads }] = await Promise.all([usersQuery, leadsQuery])
      const filteredUsers = applyUserFilters(users || [])
      const filteredLeads = applyLeadFilters(leads || [])

      const [mRes, pRes] = await Promise.all([
        supabase.from("manual_payment").select("plan, payment_date"),
        supabase.from("payment_links").select("plan, payment_date"),
      ])
      
      const allPlanPayments = [...(mRes.data || []), ...(pRes.data || [])]
      const filteredPlanPayments = applyPaymentFilters(allPlanPayments)

      const leadMap = Object.fromEntries(
        filteredLeads.map((r) => [r.email, { city: r.city || "Unknown", profession: r.profession || "Unknown" }])
      )

      const allPlans = filteredPlanPayments.map((r) => r.plan || "Unknown")
      const pkgCounts = allPlans.reduce<Record<string, number>>((acc, pkg) => {
        const packageName = pkg || "Unknown"
        acc[packageName] = (acc[packageName] || 0) + 1
        return acc
      }, {})
      const packageDistribution = Object.entries(pkgCounts).map(([pkg, total]) => ({ 
        package: pkg, 
        total: total || 0 
      }))

      const members = filteredUsers.map((u) => {
        let age = 0
        if (u.date_of_birth) {
          try {
            const dob = new Date(u.date_of_birth)
            if (!isNaN(dob.getTime())) {
              age = Math.floor((Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25))
            }
          } catch (error) {
            age = 0
          }
        }
        
        const info = leadMap[u.email] || { city: "Unknown", profession: "Unknown" }
        return { 
          email: u.email || "", 
          is_active: u.is_active || false, 
          age: Math.max(0, age), 
          city: info.city || "Unknown", 
          profession: info.profession || "Unknown"
        }
      })

      const total = members.length
      const active = members.filter((m) => m.is_active).length
      const inactive = total - active

      const locAgg = members.reduce<Record<string, { active: number; inactive: number; total: number }>>((acc, m) => {
        const city = m.city || "Unknown"
        acc[city] = acc[city] || { active: 0, inactive: 0, total: 0 }
        acc[city].total = (acc[city].total || 0) + 1
        if (m.is_active) {
          acc[city].active = (acc[city].active || 0) + 1
        } else {
          acc[city].inactive = (acc[city].inactive || 0) + 1
        }
        return acc
      }, {})
      const locationWise = Object.entries(locAgg).map(([location, stats]) => ({ 
        location, 
        active: stats.active || 0,
        inactive: stats.inactive || 0,
        total: stats.total || 0
      }))

      const bins: Record<string, [number, number]> = {
        "18-25": [18, 25],
        "26-35": [26, 35],
        "36-45": [36, 45],
        "46-55": [46, 55],
        "55+": [56, 200],
      }
      const ageAgg: Record<string, { active: number; inactive: number; total: number }> = {}
      members.forEach((m) => {
        const age = typeof m.age === 'number' && !isNaN(m.age) ? m.age : 0
        const cat = Object.entries(bins).find(([_, [min, max]]) => age >= min && age <= max)?.[0] || "Unknown"
        ageAgg[cat] = ageAgg[cat] || { active: 0, inactive: 0, total: 0 }
        ageAgg[cat].total = (ageAgg[cat].total || 0) + 1
        if (m.is_active) {
          ageAgg[cat].active = (ageAgg[cat].active || 0) + 1
        } else {
          ageAgg[cat].inactive = (ageAgg[cat].inactive || 0) + 1
        }
      })
      const ageCategoryWise = Object.entries(ageAgg).map(([category, stats]) => ({ 
        category, 
        active: stats.active || 0,
        inactive: stats.inactive || 0,
        total: stats.total || 0
      }))

      const profAgg: Record<string, { active: number; inactive: number; total: number }> = {}
      members.forEach((m) => {
        const profession = m.profession || "Unknown"
        profAgg[profession] = profAgg[profession] || { active: 0, inactive: 0, total: 0 }
        profAgg[profession].total = (profAgg[profession].total || 0) + 1
        if (m.is_active) {
          profAgg[profession].active = (profAgg[profession].active || 0) + 1
        } else {
          profAgg[profession].inactive = (profAgg[profession].inactive || 0) + 1
        }
      })
      const professionWise = Object.entries(profAgg).map(([profession, stats]) => ({ 
        profession, 
        active: stats.active || 0,
        inactive: stats.inactive || 0,
        total: stats.total || 0
      }))

      setLiveMembers({
        total: total || 0,
        active: active || 0,
        inactive: inactive || 0,
        locationWise,
        packageDistribution,
        ageCategoryWise,
        professionWise,
      })
    } catch (error) {
      console.error('Error in live members analysis:', error)
      setLiveMembers({
        total: 0,
        active: 0,
        inactive: 0,
        locationWise: [],
        packageDistribution: [],
        ageCategoryWise: [],
        professionWise: [],
      })
    }
  }

  fetchLiveMembersData()
}, [activeAnalytic, currentUserRole, assignedLeadIds, genderFilter, cityFilter, packageFilter, dateRange, timeFilter, searchTerm])

// Conversion Analysis with Gross, Net, Real
useEffect(() => {
  if (activeAnalytic !== "conversion") return

  const fetchConversionData = async () => {
    try {
      // Fetch leads
      let leadsQuery = supabase.from("leads").select("id, email, source, created_at, status")
      if (currentUserRole === EXECUTIVE_ROLE && assignedLeadIds.length > 0) {
        leadsQuery = leadsQuery.in('id', assignedLeadIds)
      }
      
      const { data: leads } = await leadsQuery
      const filteredLeads = applyLeadFilters(leads || [])

      // Fetch users (converted leads)
      const { data: users } = await supabase.from("users").select("email, id, first_name, last_name")

      // Fetch appointments (assuming you have an appointments table)
      const { data: appointments } = await supabase.from("appointments").select("lead_id, status, date")
      
      // Fetch payments
      const [{ data: manualPayments }, { data: paymentLinks }] = await Promise.all([
        supabase.from("manual_payment").select("amount, lead_id, payment_date"),
        supabase.from("payment_links").select("amount, lead_id, payment_date")
      ])

      const allPayments = [...(manualPayments || []), ...(paymentLinks || [])]
      const filteredPayments = applyPaymentFilters(allPayments)

      // Create mappings
      const leadToUserMap: Record<string, boolean> = {}
      users?.forEach(user => {
        const lead = filteredLeads.find(l => l.email === user.email)
        if (lead) {
          leadToUserMap[lead.id] = true
        }
      })

      const leadToAppointmentMap: Record<string, boolean> = {}
      appointments?.forEach(appointment => {
        leadToAppointmentMap[appointment.lead_id] = true
      })

      const leadToPaymentMap: Record<string, boolean> = {}
      filteredPayments.forEach(payment => {
        leadToPaymentMap[payment.lead_id] = true
      })

      // Calculate Gross, Net, Real conversions
      let grossConversions = 0
      let netConversions = 0
      let realConversions = 0
      
      filteredLeads.forEach(lead => {
        const hasUser = leadToUserMap[lead.id] || false
        const hasAppointment = leadToAppointmentMap[lead.id] || false
        const hasPayment = leadToPaymentMap[lead.id] || false

        if (hasUser) grossConversions++
        if (hasUser && hasAppointment) netConversions++
        if (hasUser && hasAppointment && hasPayment) realConversions++
      })

      const totalLeads = filteredLeads.length
      
      // Prepare data for pie chart
      const conversionBreakdownData = [
        {
          name: 'Gross Conversions',
          value: grossConversions,
          percentage: totalLeads > 0 ? (grossConversions / totalLeads * 100).toFixed(1) : 0,
          color: '#10b981'
        },
        {
          name: 'Net Conversions',
          value: netConversions,
          percentage: totalLeads > 0 ? (netConversions / totalLeads * 100).toFixed(1) : 0,
          color: '#3b82f6'
        },
        {
          name: 'Real Conversions',
          value: realConversions,
          percentage: totalLeads > 0 ? (realConversions / totalLeads * 100).toFixed(1) : 0,
          color: '#f59e0b'
        },
        {
          name: 'Not Converted',
          value: totalLeads - grossConversions,
          percentage: totalLeads > 0 ? ((totalLeads - grossConversions) / totalLeads * 100).toFixed(1) : 0,
          color: '#ef4444'
        }
      ]

      // Source-wise conversion data (existing logic)
      const sourceWise = [] // Keep your existing source-wise logic here
      const rmWise = [] // Keep your existing RM-wise logic here
      const monthWise = [] // Keep your existing month-wise logic here

      // Update conversion data state
      setConversionData({ 
        sourceWise, 
        rmWise, 
        monthWise,
        conversionBreakdownData,
        totals: {
          totalLeads,
          grossConversions,
          netConversions,
          realConversions,
          grossRate: totalLeads > 0 ? (grossConversions / totalLeads * 100).toFixed(1) : "0",
          netRate: totalLeads > 0 ? (netConversions / totalLeads * 100).toFixed(1) : "0",
          realRate: totalLeads > 0 ? (realConversions / totalLeads * 100).toFixed(1) : "0"
        }
      })

    } catch (error) {
      console.error('Error in conversion analysis:', error)
      setConversionData({ 
        sourceWise: [], 
        rmWise: [], 
        monthWise: [],
        conversionBreakdownData: [],
        totals: {
          totalLeads: 0,
          grossConversions: 0,
          netConversions: 0,
          realConversions: 0,
          grossRate: "0",
          netRate: "0",
          realRate: "0"
        }
      })
    }
  }

  fetchConversionData()
}, [activeAnalytic, currentUserRole, assignedLeadIds, sourceFilter, coachFilter, dateRange, timeFilter, searchTerm])
  // Source Analysis
  useEffect(() => {
    if (activeAnalytic !== "source") return

    const fetchSourceData = async () => {
      try {
        let leadsQuery = supabase.from("leads").select("id, email, source, created_at")
        if (currentUserRole === EXECUTIVE_ROLE && assignedLeadIds.length > 0) {
          leadsQuery = leadsQuery.in('id', assignedLeadIds)
        }
        
        const { data: leads } = await leadsQuery
        const filteredLeads = applyLeadFilters(leads || [])

        const [{ data: users }, manualRes, linksRes] = await Promise.all([
          supabase.from("users").select("email"),
          supabase.from("manual_payment").select("amount, lead_id, payment_date"),
          supabase.from("payment_links").select("amount, lead_id, payment_date")
        ])

        const converted = new Set(users?.map((u) => u.email) || [])
        const payments = [...(manualRes.data || []), ...(linksRes.data || [])]
        const filteredPayments = applyPaymentFilters(payments)

        const revByLead: Record<string, number> = {}
        filteredPayments.forEach((p) => {
          revByLead[p.lead_id] = (revByLead[p.lead_id] || 0) + (p.amount || 0)
        })

        const agg: Record<string, { count: number; revenue: number; conversions: number }> = {}
        filteredLeads.forEach((lead) => {
          const src = lead.source || "Unknown"
          if (!agg[src]) agg[src] = { count: 0, revenue: 0, conversions: 0 }
          agg[src].count++
          if (converted.has(lead.email)) {
            agg[src].conversions++
            agg[src].revenue += revByLead[lead.id] || 0
          }
        })

        const result = Object.entries(agg).map(([source, { count, revenue, conversions }]) => ({
          source,
          count,
          revenue,
          conversion: count > 0 ? parseFloat(((conversions / count) * 100).toFixed(1)) : 0,
        }))

        setSourceAnalysisData(result)
      } catch (error) {
        console.error('Error in source analysis:', error)
        setSourceAnalysisData([])
      }
    }

    fetchSourceData()
  }, [activeAnalytic, currentUserRole, assignedLeadIds, sourceFilter, dateRange, timeFilter, searchTerm])

// Renewal Analysis - Updated to use plan_expiry and calculate trends
useEffect(() => {
  if (activeAnalytic !== "renewals" && activeAnalytic !== "renewaltrends") return

  const fetchRenewalData = async () => {
    try {
      // Fetch payments with plan_expiry dates
      let manualQuery = supabase.from("manual_payment").select("amount, payment_date, lead_id, plan_expiry, plan")
      let linksQuery = supabase.from("payment_links").select("amount, payment_date, lead_id, plan_expiry, plan")
      
      if (currentUserRole === EXECUTIVE_ROLE && assignedLeadIds.length > 0) {
        manualQuery = manualQuery.in('lead_id', assignedLeadIds)
        linksQuery = linksQuery.in('lead_id', assignedLeadIds)
      }
      
      const [{ data: manualPayments }, { data: paymentLinks }] = await Promise.all([manualQuery, linksQuery])
      const allPayments = [...(manualPayments || []), ...(paymentLinks || [])]
      const filteredPayments = applyPaymentFilters(allPayments).filter(p => p.payment_date && p.plan_expiry)

      // Get leads data for source mapping
      let leadsQuery = supabase.from("leads").select("id, email, source, created_at")
      if (currentUserRole === EXECUTIVE_ROLE && assignedLeadIds.length > 0) {
        leadsQuery = leadsQuery.in('id', assignedLeadIds)
      }
      
      const { data: leads } = await leadsQuery
      const filteredLeads = applyLeadFilters(leads || [])

      // Create mappings
      const leadSourceMap: Record<string, string> = {}
      const leadEmailMap: Record<string, string> = {}
      filteredLeads.forEach((lead) => {
        leadSourceMap[lead.id] = lead.source || "Unknown"
        leadEmailMap[lead.id] = lead.email || ""
      })

      // Get coach assignments
      const { data: assignments } = await supabase.from("lead_assignments").select("lead_id, assigned_to")
      const { data: users } = await supabase.from("users").select("id, first_name, last_name")
      
      const leadCoachMap: Record<string, string> = {}
      const userMap: Record<string, string> = {}
      
      users?.forEach(user => {
        userMap[user.id] = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown'
      })
      
      assignments?.forEach(assignment => {
        leadCoachMap[assignment.lead_id] = userMap[assignment.assigned_to] || 'Unknown'
      })

      // Group payments by user and sort by payment date
      const userPaymentsMap: Record<string, any[]> = {}
      filteredPayments.forEach(payment => {
        if (!userPaymentsMap[payment.lead_id]) {
          userPaymentsMap[payment.lead_id] = []
        }
        userPaymentsMap[payment.lead_id].push({
          ...payment,
          payment_date: new Date(payment.payment_date),
          plan_expiry: new Date(payment.plan_expiry)
        })
      })

      // Sort payments by date for each user
      Object.keys(userPaymentsMap).forEach(leadId => {
        userPaymentsMap[leadId].sort((a, b) => a.payment_date.getTime() - b.payment_date.getTime())
      })

      // Identify renewals and collect data
      const renewalData: Array<{
        leadId: string,
        source: string,
        coach: string,
        renewalDate: Date,
        isRenewal: boolean,
        amount: number
      }> = []

      Object.entries(userPaymentsMap).forEach(([leadId, payments]) => {
        if (payments.length < 2) {
          // Only one payment, not a renewal candidate
          renewalData.push({
            leadId,
            source: leadSourceMap[leadId] || "Unknown",
            coach: leadCoachMap[leadId] || "Unknown",
            renewalDate: payments[0].payment_date,
            isRenewal: false,
            amount: payments[0].amount || 0
          })
          return
        }

        // Check each payment after the first one
        for (let i = 1; i < payments.length; i++) {
          const currentPayment = payments[i]
          const previousPayment = payments[i - 1]
          
          // Check if current payment was made after previous plan expired
          const isRenewal = currentPayment.payment_date > previousPayment.plan_expiry
          
          renewalData.push({
            leadId,
            source: leadSourceMap[leadId] || "Unknown",
            coach: leadCoachMap[leadId] || "Unknown",
            renewalDate: currentPayment.payment_date,
            isRenewal,
            amount: currentPayment.amount || 0
          })
        }
      })

      // Aggregate data by source
      const sourceAgg: Record<string, { total: number; renewed: number }> = {}
      renewalData.forEach(data => {
        if (!sourceAgg[data.source]) {
          sourceAgg[data.source] = { total: 0, renewed: 0 }
        }
        sourceAgg[data.source].total += 1
        if (data.isRenewal) {
          sourceAgg[data.source].renewed += 1
        }
      })

      // Aggregate data by coach
      const coachAgg: Record<string, { total: number; renewed: number }> = {}
      renewalData.forEach(data => {
        if (!coachAgg[data.coach]) {
          coachAgg[data.coach] = { total: 0, renewed: 0 }
        }
        coachAgg[data.coach].total += 1
        if (data.isRenewal) {
          coachAgg[data.coach].renewed += 1
        }
      })

      // Aggregate data by month for trends
      const monthAgg: Record<string, { total: number; renewed: number; revenue: number }> = {}
      renewalData.forEach(data => {
        const month = data.renewalDate.toLocaleString("default", { month: "short" })
        if (!monthAgg[month]) {
          monthAgg[month] = { total: 0, renewed: 0, revenue: 0 }
        }
        monthAgg[month].total += 1
        if (data.isRenewal) {
          monthAgg[month].renewed += 1
          monthAgg[month].revenue += data.amount
        }
      })

      // Calculate rates and format results
      const calculateRate = (renewed: number, total: number) => 
        total > 0 ? parseFloat(((renewed / total) * 100).toFixed(1)) : 0

      const sourceWise = Object.entries(sourceAgg).map(([source, { total, renewed }]) => ({
        source,
        total,
        renewed,
        rate: calculateRate(renewed, total),
      }))

      const coachWise = Object.entries(coachAgg).map(([coach, { total, renewed }]) => ({
        coach,
        total,
        renewed,
        rate: calculateRate(renewed, total),
      }))

      const monthOrder = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
      const monthWise = Object.entries(monthAgg)
        .sort(([a], [b]) => monthOrder.indexOf(a) - monthOrder.indexOf(b))
        .map(([month, { total, renewed }]) => ({
          month,
          total,
          renewed,
          rate: calculateRate(renewed, total),
        }))

      setRenewalAnalytics({ sourceWise, coachWise, monthWise })

      // Calculate renewal trends data
      const totalRenewals = renewalData.filter(d => d.isRenewal).length
      const totalRevenue = renewalData.filter(d => d.isRenewal).reduce((sum, d) => sum + d.amount, 0)
      const totalCandidates = renewalData.length
      const avgRenewalRate = calculateRate(totalRenewals, totalCandidates)

      // Calculate growth rate (last month vs previous month)
      const monthlyTrends = Object.entries(monthAgg)
        .sort(([a], [b]) => monthOrder.indexOf(a) - monthOrder.indexOf(b))
        .map(([month, { total, renewed, revenue }]) => ({
          month,
          renewals: renewed,
          revenue,
          rate: calculateRate(renewed, total),
        }))

      const lastMonthIdx = monthlyTrends.length - 1
      const prevMonthIdx = Math.max(0, lastMonthIdx - 1)
      const growthRate = lastMonthIdx > 0 && monthlyTrends[prevMonthIdx].renewals > 0
        ? parseFloat(((monthlyTrends[lastMonthIdx].renewals - monthlyTrends[prevMonthIdx].renewals) / monthlyTrends[prevMonthIdx].renewals * 100).toFixed(1))
        : 0

      setRenewalTrendsData({
        totalRenewals,
        totalRevenue,
        avgRenewalRate,
        growthRate,
        monthlyTrends,
      })

    } catch (error) {
      console.error('Error in renewals analysis:', error)
      setRenewalAnalytics({ sourceWise: [], coachWise: [], monthWise: [] })
      setRenewalTrendsData({
        totalRenewals: 0,
        totalRevenue: 0,
        avgRenewalRate: 0,
        growthRate: 0,
        monthlyTrends: [],
      })
    }
  }

  fetchRenewalData()
}, [activeAnalytic, currentUserRole, assignedLeadIds, sourceFilter, packageFilter, dateRange, timeFilter, searchTerm])

// Missed Follow-up Analysis (add this useEffect if you want dynamic follow-up data)
useEffect(() => {
  if (activeAnalytic !== "followup") return

  const fetchFollowUpData = async () => {
    try {
      // This assumes you have a follow_ups table with columns: lead_id, assigned_to, due_date, completed_date, status
      let followUpsQuery = supabase.from("follow_ups").select("lead_id, assigned_to, due_date, completed_date, status")
      
      if (currentUserRole === EXECUTIVE_ROLE && assignedLeadIds.length > 0) {
        followUpsQuery = followUpsQuery.in('lead_id', assignedLeadIds)
      }
      
      const { data: followUps } = await followUpsQuery
      
      if (!followUps) {
        setMissedFollowUpData([])
        return
      }

      // Get user names
      const { data: users } = await supabase.from("users").select("id, first_name, last_name")
      const userMap: Record<string, string> = {}
      users?.forEach(user => {
        userMap[user.id] = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown'
      })

      // Filter follow-ups based on time filters
      const filteredFollowUps = followUps.filter(followUp => {
        if (followUp.due_date && !isDateInTimeFilter(followUp.due_date, timeFilter)) return false
        if (followUp.due_date && !isDateInRange(followUp.due_date, dateRange)) return false
        return true
      })

      // Aggregate by counselor
      const counselorAgg: Record<string, { total: number; missed: number }> = {}
      
      filteredFollowUps.forEach(followUp => {
        const counselorName = userMap[followUp.assigned_to] || 'Unassigned'
        
        if (!counselorAgg[counselorName]) {
          counselorAgg[counselorName] = { total: 0, missed: 0 }
        }
        
        counselorAgg[counselorName].total += 1
        
        // Consider missed if due date has passed and not completed
        const dueDate = new Date(followUp.due_date)
        const now = new Date()
        const isMissed = dueDate < now && (!followUp.completed_date && followUp.status !== 'completed')
        
        if (isMissed) {
          counselorAgg[counselorName].missed += 1
        }
      })

      // Format results
      const result = Object.entries(counselorAgg).map(([counselor, { total, missed }]) => {
        const rate = total > 0 ? parseFloat(((missed / total) * 100).toFixed(1)) : 0
        const impact = rate > 30 ? "High" : rate > 15 ? "Medium" : "Low"
        
        return {
          counselor,
          total,
          missed,
          rate,
          impact,
        }
      })

      setMissedFollowUpData(result)
    } catch (error) {
      console.error('Error in follow-up analysis:', error)
      setMissedFollowUpData([])
    }
  }

  fetchFollowUpData()
}, [activeAnalytic, currentUserRole, assignedLeadIds, dateRange, timeFilter, searchTerm])

  const clearFilters = () => {
    setSearchTerm("")
    setSourceFilter("all")
    setCityFilter("all")
    setPackageFilter("all")
    setGenderFilter("all")
    setCoachFilter("all")
    setDateRange(undefined)
  }

  const totalCount = packageAnalysisData.reduce((sum, pkg) => sum + pkg.count, 0)
  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#84cc16", "#f97316"]

  return (
    <div className="space-y-6">
      {/* Analytics Type Selector */}
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-700">
            <BarChart3 className="h-5 w-5" />
            Advanced Analytics Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {[
              { key: "conversion", label: "Conversion Analytics", icon: Target },
              { key: "renewals", label: "Renewal Analytics", icon: TrendingUp },
              { key: "sales", label: "Sales Graphs", icon: DollarSign },
              { key: "package", label: "Package Analysis", icon: PieChartIcon },
              { key: "city", label: "City Analysis", icon: MapPin },
              { key: "gender", label: "Gender Analysis", icon: Users },
              { key: "source", label: "Source Analysis", icon: Activity },
              { key: "followup", label: "Missed Follow-ups", icon: AlertTriangle },
              { key: "livemembers", label: "Live Members", icon: UserCheck },
              { key: "renewaltrends", label: "Renewal Trends", icon: Clock },
            ].map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                variant={activeAnalytic === key ? "default" : "outline"}
                onClick={() => setActiveAnalytic(key)}
                className={`h-auto p-3 flex flex-col items-center gap-2 ${
                  activeAnalytic === key
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
                    : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-xs text-center">{label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Filters */}
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-700">
            <Filter className="h-5 w-5" />
            Advanced Analytics Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search analytics..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-emerald-200 hover:border-emerald-300"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Date Range</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal border-emerald-200 hover:border-emerald-300"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-emerald-600" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
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
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Time Period</label>
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="border-emerald-200 hover:border-emerald-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1month">Last Month</SelectItem>
                  <SelectItem value="3months">Last 3 Months</SelectItem>
                  <SelectItem value="6months">Last 6 Months</SelectItem>
                  <SelectItem value="1year">Last Year</SelectItem>
                  <SelectItem value="2years">Last 2 Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Source</label>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="border-emerald-200 hover:border-emerald-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  {availableSources.map(source => (
                    <SelectItem key={source} value={source}>{source}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">City</label>
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="border-emerald-200 hover:border-emerald-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {availableCities.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Package</label>
              <Select value={packageFilter} onValueChange={setPackageFilter}>
                <SelectTrigger className="border-emerald-200 hover:border-emerald-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Packages</SelectItem>
                  {availablePackages.map(pkg => (
                    <SelectItem key={pkg} value={pkg}>{pkg}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Gender</label>
              <Select value={genderFilter} onValueChange={setGenderFilter}>
                <SelectTrigger className="border-emerald-200 hover:border-emerald-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genders</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Coach</label>
              <Select value={coachFilter} onValueChange={setCoachFilter}>
                <SelectTrigger className="border-emerald-200 hover:border-emerald-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Coaches</SelectItem>
                  {availableCoaches.map(coach => (
                    <SelectItem key={coach} value={coach}>{coach}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={clearFilters}
                className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              >
                Clear All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

     {activeAnalytic === "conversion" && (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-green-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-emerald-700">Gross Conversions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-600">
            {conversionData.totals?.grossConversions || 0}
          </div>
          <p className="text-xs text-slate-600">{conversionData.totals?.grossRate || 0}% rate</p>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-blue-700">Net Conversions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {conversionData.totals?.netConversions || 0}
          </div>
          <p className="text-xs text-slate-600">{conversionData.totals?.netRate || 0}% rate</p>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-yellow-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-orange-700">Real Conversions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {conversionData.totals?.realConversions || 0}
          </div>
          <p className="text-xs text-slate-600">{conversionData.totals?.realRate || 0}% rate</p>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-pink-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-red-700">Total Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {conversionData.totals?.totalLeads || 0}
          </div>
          <p className="text-xs text-slate-600">All sources</p>
        </CardContent>
      </Card>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-emerald-700">Conversion Breakdown: Gross, Net & Real</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={conversionData.conversionBreakdownData || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value} (${entry.percentage}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {(conversionData.conversionBreakdownData || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name, props) => [
                  `${value} (${props.payload.percentage}%)`,
                  props.payload.name
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-emerald-700">Source-wise Conversion Rates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(conversionData.sourceWise || []).map((source, index) => (
              <div key={index} className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-semibold text-slate-800">{source.source}</h4>
                  <Badge className="bg-emerald-100 text-emerald-700">{source.rate}%</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-slate-600">Leads:</span>
                    <div className="font-semibold">{source.leads}</div>
                  </div>
                  <div>
                    <span className="text-slate-600">Conv:</span>
                    <div className="font-semibold">{source.conversions}</div>
                  </div>
                  <div>
                    <span className="text-slate-600">Revenue:</span>
                    <div className="font-semibold">₹{source.revenue}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
)}

      {activeAnalytic === "renewals" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-green-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-emerald-700">Total Due</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">
                  {renewalAnalytics.sourceWise.reduce((sum, x) => sum + x.total, 0)}
                </div>
                <p className="text-xs text-slate-600">Memberships due for renewal</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-700">Renewed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {renewalAnalytics.sourceWise.reduce((sum, x) => sum + x.renewed, 0)}
                </div>
                <p className="text-xs text-slate-600">Successfully renewed</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-purple-700">Renewal Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {(() => {
                    const total = renewalAnalytics.sourceWise.reduce((s, i) => s + i.total, 0)
                    const renewed = renewalAnalytics.sourceWise.reduce((s, i) => s + i.renewed, 0)
                    return total ? `${((renewed / total) * 100).toFixed(1)}%` : "0%"
                  })()}
                </div>
                <p className="text-xs text-slate-600">Overall renewal rate</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-red-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-orange-700">Renewal Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  ₹{(renewalAnalytics.sourceWise.reduce((sum, x) => sum + x.total, 0)).toLocaleString()}
                </div>
                <p className="text-xs text-slate-600">From renewals</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-emerald-700">Source-wise Renewals</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={renewalAnalytics.sourceWise}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ source, rate }) => `${source}: ${rate}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="renewed"
                    >
                      {renewalAnalytics.sourceWise.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-emerald-700">Coach-wise Renewal Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={renewalAnalytics.coachWise}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="coach" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="renewed" fill="#10b981" name="Renewed" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-emerald-700">Monthly Renewal Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={renewalAnalytics.monthWise}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="renewed"
                    stroke="#10b981"
                    strokeWidth={3}
                    name="Renewals"
                    dot={{ fill: "#10b981", strokeWidth: 2, r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    name="Renewal Rate %"
                    dot={{ fill: "#f59e0b", strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {activeAnalytic === "sales" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-green-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-emerald-700">Total Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">
                  ₹{salesOverview.totalSales.toLocaleString()}
                </div>
                <p className="text-xs text-slate-600">All time</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-700">Growth Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {salesOverview.growthRate > 0 ? "+" : ""}{salesOverview.growthRate}%
                </div>
                <p className="text-xs text-slate-600">Month over month</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-purple-700">Best Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{salesOverview.bestMonth}</div>
                <p className="text-xs text-slate-600">
                  ₹{salesOverview.bestMonthRevenue.toLocaleString()} revenue
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-red-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-orange-700">Avg Deal Size</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  ₹{salesOverview.avgDealSize.toLocaleString()}
                </div>
                <p className="text-xs text-slate-600">Per transaction</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-emerald-700">Monthly Sales by Package</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                 
<Tooltip
  formatter={(value, name) => {
    const planName = name === "month" ? "Month" : name
    return [`₹${Number(value).toLocaleString()}`, planName]
  }}
  labelFormatter={(label) => `Month: ${label}`}
/>
                  {salesData.length > 0 && (
                    Object.keys(salesData[0] || {})
                      .filter((k) => k !== "month")
                      .map((plan, idx) => (
                        <Bar
                          key={plan}
                          dataKey={plan}
                          stackId="a"
                          fill={COLORS[idx % COLORS.length]}
                          name={plan}
                        />
                      ))
                  )}
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {activeAnalytic === "package" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-emerald-700">Package Distribution</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={packageAnalysisData}
                      nameKey="plan"
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ plan, count }) => `${plan}: ${count}`}
                      outerRadius={80}
                      dataKey="count"
                    >
                      {packageAnalysisData.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [
                        `${totalCount > 0 ? ((Number(value) / totalCount) * 100).toFixed(2) : 0}%`,
                        name
                      ]}
                    />            
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-emerald-700">Package Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {packageAnalysisData.map((pkg, i) => (
                    <div key={i} className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-slate-800">{pkg.plan}</h4>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-slate-600">Clients:</span>
                          <div className="font-semibold">{pkg.count}</div>
                        </div>
                        <div>
                          <span className="text-slate-600">Revenue:</span>
                          <div className="font-semibold">₹{pkg.revenue.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-slate-600">Avg Value:</span>
                          <div className="font-semibold">₹{pkg.avgValue}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeAnalytic === "city" && (
        <div className="space-y-6">
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-emerald-700">City-wise Performance Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={cityAnalysisData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="city" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar yAxisId="left" dataKey="clients" fill="#10b981" name="Clients" />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="growth"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    name="Growth %"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {cityAnalysisData.slice(0, 3).map(({ city, clients, revenue, growth }) => (
              <Card key={city} className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-green-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-emerald-700 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {city}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Clients:</span>
                      <span className="font-semibold">{clients}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Revenue:</span>
                      <span className="font-semibold">₹{revenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Growth:</span>
                      <Badge className="bg-emerald-100 text-emerald-700">
                        {growth > 0 ? '+' : ''}{growth}%
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeAnalytic === 'gender' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-emerald-700">Gender Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={genderAnalysisData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ gender, percentage }) => `${gender}: ${percentage}%`}
                      outerRadius={80}
                      dataKey="count"
                    >
                      {genderAnalysisData.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-emerald-700">Gender-wise Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {genderAnalysisData.map((g, i) => (
                    <div key={i} className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-slate-800">{g.gender}</h4>
                        <Badge className="bg-emerald-100 text-emerald-700">{g.percentage}%</Badge>
                      </div>
                      <div className="text-sm">
                        <span className="text-slate-600">Count: </span>
                        <span className="font-semibold">{g.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeAnalytic === "source" && (
        <div className="space-y-6">
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-emerald-700">Source-wise Performance Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={sourceAnalysisData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="source" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar yAxisId="left" dataKey="count" fill="#10b981" name="Count" />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="conversion"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    name="Conversion %"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sourceAnalysisData.map((src, i) => (
              <Card key={i} className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-green-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-emerald-700 flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    {src.source}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Count:</span>
                      <span className="font-semibold">{src.count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Revenue:</span>
                      <span className="font-semibold">₹{src.revenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Conversion:</span>
                      <Badge className="bg-emerald-100 text-emerald-700">{src.conversion}%</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

{activeAnalytic === "followup" && (
  <div className="space-y-6">
    <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-emerald-700">Missed Follow-up Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={missedFollowUpData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="counselor" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="total" fill="#10b981" name="Total Follow-ups" />
            <Bar dataKey="missed" fill="#ef4444" name="Missed Follow-ups" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {missedFollowUpData.map((counselor, index) => (
        <Card key={index} className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {counselor.counselor}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-600">Total:</span>
                <span className="font-semibold">{counselor.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Missed:</span>
                <span className="font-semibold text-red-600">{counselor.missed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Miss Rate:</span>
                <Badge
                  className={
                    counselor.impact === "High"
                      ? "bg-red-100 text-red-700"
                      : counselor.impact === "Medium"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-green-100 text-green-700"
                  }
                >
                  {counselor.rate}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
)}

      {activeAnalytic === "livemembers" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-green-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-emerald-700">Total Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">{liveMembers.total}</div>
                <p className="text-xs text-slate-600">All registered members</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-700">Active Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{liveMembers.active}</div>
                <p className="text-xs text-slate-600">
                  {liveMembers.total > 0 ? ((liveMembers.active / liveMembers.total) * 100).toFixed(1) : 0}% active rate
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-red-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-orange-700">Inactive Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{liveMembers.inactive}</div>
                <p className="text-xs text-slate-600">Need attention</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-purple-700">Activity Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {liveMembers.total > 0 ? ((liveMembers.active / liveMembers.total) * 100).toFixed(1) : 0}%
                </div>
                <p className="text-xs text-slate-600">Overall engagement</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-emerald-700">Location-wise Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={liveMembers.locationWise}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="location" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="active" stackId="a" fill="#10b981" name="Active" />
                    <Bar dataKey="inactive" stackId="a" fill="#ef4444" name="Inactive" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-emerald-700">Package-wise Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={liveMembers.packageDistribution}
                      cx="50%"
                      cy="50%"
                      nameKey="package"
                      dataKey="total"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      outerRadius={80}
                    >
                      {liveMembers.packageDistribution.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-emerald-700">Age Category Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={liveMembers.ageCategoryWise} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="category" type="category" tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="active" fill="#10b981" name="Active" />
                  <Bar dataKey="inactive" fill="#ef4444" name="Inactive" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-emerald-700">Profession-wise Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={liveMembers.professionWise} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="profession" type="category" tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="active" fill="#10b981" name="Active" />
                  <Bar dataKey="inactive" fill="#ef4444" name="Inactive" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

  {activeAnalytic === "renewaltrends" && (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-green-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-emerald-700">Total Renewals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-600">{renewalTrendsData.totalRenewals}</div>
          <p className="text-xs text-slate-600">Filtered period</p>
        </CardContent>
      </Card>
      <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-blue-700">Renewal Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            ₹{renewalTrendsData.totalRevenue.toLocaleString()}
          </div>
          <p className="text-xs text-slate-600">From renewals</p>
        </CardContent>
      </Card>
      <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-purple-700">Avg Renewal Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">{renewalTrendsData.avgRenewalRate}%</div>
          <p className="text-xs text-slate-600">Overall average</p>
        </CardContent>
      </Card>
      <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-red-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-orange-700">Growth Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {renewalTrendsData.growthRate > 0 ? "+" : ""}{renewalTrendsData.growthRate}%
          </div>
          <p className="text-xs text-slate-600">Month over month</p>
        </CardContent>
      </Card>
    </div>

    <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-emerald-700">Monthly Renewal Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={renewalTrendsData.monthlyTrends}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value, name) => [
                name === "revenue" ? `₹${Number(value).toLocaleString()}` : value,
                name === "renewals" ? "Renewals" : name === "revenue" ? "Revenue" : "Rate %",
              ]}
            />
            <Bar yAxisId="left" dataKey="renewals" fill="#10b981" name="renewals" />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="rate"
              stroke="#f59e0b"
              strokeWidth={3}
              name="rate"
              dot={{ fill: "#f59e0b", strokeWidth: 2, r: 6 }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="revenue"
              stroke="#3b82f6"
              strokeWidth={3}
              name="revenue"
              dot={{ fill: "#3b82f6", strokeWidth: 2, r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  </div>
)}
    </div>
  )
}