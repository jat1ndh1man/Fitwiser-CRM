"use client"

import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Download,
  FileText,
  TrendingUp,
  Filter,
  Search,
  CalendarIcon,
  DollarSign,
  Target,
  AlertTriangle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Phone,
  User,
  Clock,
  CheckCircle,
  XCircle,
  Activity,
  Loader2,
} from "lucide-react"
import { format } from "date-fns"
import type { DateRange } from "react-day-picker"

// Initialize Supabase client
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

// Types for our data structures
interface BalanceReport {
  id: string
  clientName: string
  email: string
  package: string
  totalAmount: number
  amountPaid: number
  balance: number
  dueDate: string
  status: string
  lastPayment: string
  paymentMethod: string
}

interface ConversionReport {
  id: string
  leadName: string
  leadDate: string
  conversionDate: string | null
  daysTaken: number | null
  source: string
  counselor: string
  package: string | null
  amount: number | null
  status: string
  touchpoints: number
  email: string
  phone: string
}

interface ExpiryReport {
  id: string
  clientName: string
  package: string
  activationDate: string
  expiryDate: string
  daysRemaining: number
  status: string
  renewalStatus: string
  lastRenewalContact: string | null
  autoRenewal: boolean
  email: string
}

// Static data for reports not yet implemented
const salesReports = [
  {
    id: 1,
    date: "2024-01-15",
    clientName: "John Doe",
    package: "Premium",
    amount: 2500,
    counselor: "Sarah Johnson",
    paymentMethod: "Credit Card",
    status: "Completed",
    commission: 250,
    source: "Website",
  },
  // Add more static data as needed
]

const followUpReports = [
  {
    id: 1,
    leadName: "Alex Brown",
    counselor: "Sarah Johnson",
    lastContact: "2024-01-10",
    nextFollowUp: "2024-01-17",
    priority: "High",
    status: "Scheduled",
    contactMethod: "Phone Call",
    notes: "Interested in premium package",
    attempts: 3,
  },
  // Add more static data as needed
]

const membershipActivation = [
  {
    id: 1,
    clientName: "John Doe",
    package: "Premium",
    joiningDate: "2024-01-15",
    activationDate: "2024-01-16",
    activationDelay: 1,
    status: "Active",
    counselor: "Sarah Johnson",
    activatedBy: "Admin",
    notes: "Quick activation",
  },
  // Add more static data as needed
]

type SortField = string
type SortDirection = "asc" | "desc" | null

export function ReportsTab() {
  const [activeReport, setActiveReport] = useState("balance")
  const [timeFilter, setTimeFilter] = useState("1month")
  const [statusFilter, setStatusFilter] = useState("all")
  const [counselorFilter, setCounselorFilter] = useState("all")
  const [packageFilter, setPackageFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)

  // Dynamic data states
  const [balanceReports, setBalanceReports] = useState<BalanceReport[]>([])
  const [conversionReports, setConversionReports] = useState<ConversionReport[]>([])
  const [expiryReports, setExpiryReports] = useState<ExpiryReport[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch balance reports from payment_links and manual_payment tables
  const fetchBalanceReports = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch payment links with user data
      const { data: paymentLinks, error: paymentLinksError } = await supabase.from("payment_links").select(`
          *,
          users (
            id,
            email,
            first_name,
            last_name
          )
        `)

      if (paymentLinksError) throw paymentLinksError

      // Fetch manual payments with user data
      const { data: manualPayments, error: manualPaymentsError } = await supabase.from("manual_payment").select(`
          *,
          users (
            id,
            email,
            first_name,
            last_name
          )
        `)

      if (manualPaymentsError) throw manualPaymentsError

      // Process payment links
      const paymentLinkReports: BalanceReport[] = (paymentLinks || []).map((payment: any) => {
        const firstName = payment.users?.first_name || ""
        const lastName = payment.users?.last_name || ""
        const clientName = `${firstName} ${lastName}`.trim() || "Unknown User"

        const totalAmount = payment.amount || 0
        const amountPaid = payment.status === "completed" ? totalAmount : 0
        const balance = totalAmount - amountPaid

        return {
          id: `pl_${payment.id}`,
          clientName,
          email: payment.users?.email || "",
          package: payment.description || "Standard",
          totalAmount,
          amountPaid,
          balance,
          dueDate: payment.expires_at || payment.created_at,
          status: payment.status === "completed" ? "Paid" : payment.status === "pending" ? "Pending" : "Overdue",
          lastPayment: payment.payment_date || payment.updated_at,
          paymentMethod: payment.payment_method || "Online",
        }
      })

      // Process manual payments
      const manualPaymentReports: BalanceReport[] = (manualPayments || []).map((payment: any) => {
        const firstName = payment.users?.first_name || ""
        const lastName = payment.users?.last_name || ""
        const clientName = `${firstName} ${lastName}`.trim() || "Unknown User"

        const totalAmount = payment.amount || 0
        const amountPaid = payment.status === "completed" ? totalAmount : 0
        const balance = totalAmount - amountPaid

        return {
          id: `mp_${payment.id}`,
          clientName,
          email: payment.users?.email || "",
          package: payment.description || "Standard",
          totalAmount,
          amountPaid,
          balance,
          dueDate: payment.plan_expiry || payment.created_at,
          status: payment.status === "completed" ? "Paid" : payment.status === "pending" ? "Pending" : "Overdue",
          lastPayment: payment.payment_date || payment.updated_at,
          paymentMethod: payment.payment_method || "Manual",
        }
      })

      setBalanceReports([...paymentLinkReports, ...manualPaymentReports])
    } catch (err) {
      console.error("Error fetching balance reports:", err)
      setError("Failed to fetch balance reports")
    } finally {
      setLoading(false)
    }
  }

  // Fetch conversion reports by comparing leads with users
  const fetchConversionReports = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch all leads
      const { data: leads, error: leadsError } = await supabase.from("leads").select("*")

      if (leadsError) throw leadsError

      // Fetch all users
      const { data: users, error: usersError } = await supabase.from("users").select(`
  id,
  email,
  phone,
  first_name,
  last_name,
  created_at
`)

      if (usersError) throw usersError

      // Process conversion data
      const conversionData: ConversionReport[] = (leads || []).map((lead: any) => {
        // Find matching user by email or phone
        const matchedUser = (users || []).find(
          (user: any) => user.email === lead.email || user.phone === lead.phone_number,
        )

        const isConverted = !!matchedUser
        const leadDate = lead.created_at
        const conversionDate = matchedUser?.created_at || null

        // Use lead name for lead name, and user's full name if converted
        const leadName = lead.name || "Unknown Lead"

        let daysTaken = null
        if (isConverted && leadDate && conversionDate) {
          const leadDateTime = new Date(leadDate).getTime()
          const conversionDateTime = new Date(conversionDate).getTime()
          daysTaken = Math.ceil((conversionDateTime - leadDateTime) / (1000 * 60 * 60 * 24))
        }

        return {
          id: lead.id,
          leadName: leadName,
          leadDate: leadDate,
          conversionDate: conversionDate,
          daysTaken,
          source: lead.source || "Unknown",
          counselor: lead.counselor || "Unassigned",
          package: matchedUser ? "Standard" : null, // You might want to determine this from payment data
          amount: null, // You might want to fetch this from payment data
          status: isConverted ? "Converted" : "Lost",
          touchpoints: 1, // You might want to calculate this based on follow-up data
          email: lead.email || "",
          phone: lead.phone_number || "",
        }
      })

      setConversionReports(conversionData)
    } catch (err) {
      console.error("Error fetching conversion reports:", err)
      setError("Failed to fetch conversion reports")
    } finally {
      setLoading(false)
    }
  }

  // Fetch membership expiry data from payment tables
  const fetchExpiryReports = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch payment links with expiry data
      const { data: paymentLinks, error: paymentLinksError } = await supabase
        .from("payment_links")
        .select(`
    *,
    users (
      id,
      email,
      first_name,
      last_name
    )
  `)
        .eq("status", "completed")

      if (paymentLinksError) throw paymentLinksError

      // Fetch manual payments with expiry data
      const { data: manualPayments, error: manualPaymentsError } = await supabase
        .from("manual_payment")
        .select(`
    *,
    users (
      id,
      email,
      first_name,
      last_name
    )
  `)
        .eq("status", "completed")

      if (manualPaymentsError) throw manualPaymentsError

      const currentDate = new Date()

      // Process payment links expiry
      const paymentLinkExpiry: ExpiryReport[] = (paymentLinks || [])
        .filter((payment: any) => payment.expires_at)
        .map((payment: any) => {
          const firstName = payment.users?.first_name || ""
          const lastName = payment.users?.last_name || ""
          const clientName = `${firstName} ${lastName}`.trim() || "Unknown User"

          const expiryDate = new Date(payment.expires_at)
          const daysRemaining = Math.ceil((expiryDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))

          return {
            id: `pl_${payment.id}`,
            clientName,
            package: payment.description || "Standard",
            activationDate: payment.payment_date || payment.created_at,
            expiryDate: payment.expires_at,
            daysRemaining,
            status: daysRemaining > 0 ? "Active" : "Expired",
            renewalStatus: daysRemaining <= 30 ? "Follow-up Required" : "Not Contacted",
            lastRenewalContact: null,
            autoRenewal: false,
            email: payment.users?.email || "",
          }
        })

      // Process manual payments expiry
      const manualPaymentExpiry: ExpiryReport[] = (manualPayments || [])
        .filter((payment: any) => payment.plan_expiry)
        .map((payment: any) => {
          const firstName = payment.users?.first_name || ""
          const lastName = payment.users?.last_name || ""
          const clientName = `${firstName} ${lastName}`.trim() || "Unknown User"

          const expiryDate = new Date(payment.plan_expiry)
          const daysRemaining = Math.ceil((expiryDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))

          return {
            id: `mp_${payment.id}`,
            clientName,
            package: payment.description || "Standard",
            activationDate: payment.payment_date || payment.created_at,
            expiryDate: payment.plan_expiry,
            daysRemaining,
            status: daysRemaining > 0 ? "Active" : "Expired",
            renewalStatus: daysRemaining <= 30 ? "Follow-up Required" : "Not Contacted",
            lastRenewalContact: null,
            autoRenewal: false,
            email: payment.users?.email || "",
          }
        })

      setExpiryReports([...paymentLinkExpiry, ...manualPaymentExpiry])
    } catch (err) {
      console.error("Error fetching expiry reports:", err)
      setError("Failed to fetch expiry reports")
    } finally {
      setLoading(false)
    }
  }

  // Fetch data when report type changes
  useEffect(() => {
    switch (activeReport) {
      case "balance":
        fetchBalanceReports()
        break
      case "conversion":
        fetchConversionReports()
        break
      case "expiry":
        fetchExpiryReports()
        break
      default:
        break
    }
  }, [activeReport])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc")
      } else if (sortDirection === "desc") {
        setSortField(null)
        setSortDirection(null)
      } else {
        setSortDirection("asc")
      }
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 text-slate-400" />
    }
    if (sortDirection === "asc") {
      return <ArrowUp className="h-3 w-3 text-emerald-600" />
    }
    if (sortDirection === "desc") {
      return <ArrowDown className="h-3 w-3 text-emerald-600" />
    }
    return <ArrowUpDown className="h-3 w-3 text-slate-400" />
  }

  const getFilteredAndSortedData = (data: any[], searchFields: string[]) => {
    const filtered = data.filter((item) => {
      const matchesSearch = searchFields.some((field) =>
        item[field]?.toString().toLowerCase().includes(searchTerm.toLowerCase()),
      )

      const matchesStatus = statusFilter === "all" || item.status?.toLowerCase() === statusFilter
      const matchesCounselor = counselorFilter === "all" || item.counselor === counselorFilter
      const matchesPackage = packageFilter === "all" || item.package?.toLowerCase() === packageFilter

      // Date range filter (if applicable)
      let matchesDateRange = true
      if (dateRange?.from || dateRange?.to) {
        const itemDate = new Date(item.date || item.joiningDate || item.leadDate || item.activationDate)
        if (dateRange.from && dateRange.to) {
          matchesDateRange = itemDate >= dateRange.from && itemDate <= dateRange.to
        } else if (dateRange.from) {
          matchesDateRange = itemDate >= dateRange.from
        } else if (dateRange.to) {
          matchesDateRange = itemDate <= dateRange.to
        }
      }

      return matchesSearch && matchesStatus && matchesCounselor && matchesPackage && matchesDateRange
    })

    // Apply sorting
    if (sortField && sortDirection) {
      filtered.sort((a, b) => {
        let aValue = a[sortField]
        let bValue = b[sortField]

        // Handle dates
        if (sortField.includes("Date") || sortField.includes("date")) {
          aValue = new Date(aValue)
          bValue = new Date(bValue)
        }

        // Handle numbers
        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortDirection === "asc" ? aValue - bValue : bValue - aValue
        }

        // Handle strings
        if (typeof aValue === "string" && typeof bValue === "string") {
          aValue = aValue.toLowerCase()
          bValue = bValue.toLowerCase()
        }

        if (aValue < bValue) {
          return sortDirection === "asc" ? -1 : 1
        }
        if (aValue > bValue) {
          return sortDirection === "asc" ? 1 : -1
        }
        return 0
      })
    }

    return filtered
  }

  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setCounselorFilter("all")
    setPackageFilter("all")
    setDateRange(undefined)
    setSortField(null)
    setSortDirection(null)
  }

  const getReportData = () => {
    switch (activeReport) {
      case "balance":
        return getFilteredAndSortedData(balanceReports, ["clientName", "package", "status"])
      case "sales":
        return getFilteredAndSortedData(salesReports, ["clientName", "package", "counselor"])
      case "followup":
        return getFilteredAndSortedData(followUpReports, ["leadName", "counselor", "status"])
      case "conversion":
        return getFilteredAndSortedData(conversionReports, ["leadName", "source", "counselor"])
      case "activation":
        return getFilteredAndSortedData(membershipActivation, ["clientName", "package", "counselor"])
      case "expiry":
        return getFilteredAndSortedData(expiryReports, ["clientName", "package", "status"])
      default:
        return []
    }
  }

  const getReportStats = () => {
    switch (activeReport) {
      case "balance":
        return {
          total: balanceReports.length,
          paid: balanceReports.filter((r) => r.status === "Paid").length,
          overdue: balanceReports.filter((r) => r.status === "Overdue").length,
          totalBalance: balanceReports.reduce((sum, r) => sum + r.balance, 0),
        }
      case "sales":
        return {
          total: salesReports.length,
          completed: salesReports.filter((r) => r.status === "Completed").length,
          totalRevenue: salesReports.reduce((sum, r) => sum + r.amount, 0),
          totalCommission: salesReports.reduce((sum, r) => sum + r.commission, 0),
        }
      case "followup":
        return {
          total: followUpReports.length,
          pending: followUpReports.filter((r) => r.status === "Pending").length,
          overdue: followUpReports.filter((r) => r.status === "Overdue").length,
          completed: followUpReports.filter((r) => r.status === "Completed").length,
        }
      case "conversion":
        return {
          total: conversionReports.length,
          converted: conversionReports.filter((r) => r.status === "Converted").length,
          lost: conversionReports.filter((r) => r.status === "Lost").length,
          conversionRate:
            conversionReports.length > 0
              ? (
                  (conversionReports.filter((r) => r.status === "Converted").length / conversionReports.length) *
                  100
                ).toFixed(1)
              : "0",
        }
      case "activation":
        return {
          total: membershipActivation.length,
          active: membershipActivation.filter((r) => r.status === "Active").length,
          pending: membershipActivation.filter((r) => r.status === "Pending").length,
          avgDelay:
            membershipActivation.filter((r) => r.activationDelay).length > 0
              ? (
                  membershipActivation.filter((r) => r.activationDelay).reduce((sum, r) => sum + r.activationDelay, 0) /
                  membershipActivation.filter((r) => r.activationDelay).length
                ).toFixed(1)
              : "0",
        }
      case "expiry":
        return {
          total: expiryReports.length,
          active: expiryReports.filter((r) => r.status === "Active").length,
          expired: expiryReports.filter((r) => r.status === "Expired").length,
          expiringThisMonth: expiryReports.filter((r) => r.daysRemaining <= 30 && r.daysRemaining > 0).length,
        }
      default:
        return {}
    }
  }

  const reportData = getReportData()
  const stats = getReportStats()

  // Export to CSV function
  const exportToCSV = () => {
    if (reportData.length === 0) return

    const headers = Object.keys(reportData[0]).join(",")
    const csvContent = [
      headers,
      ...reportData.map((row) =>
        Object.values(row)
          .map((value) => (typeof value === "string" && value.includes(",") ? `"${value}"` : value))
          .join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${activeReport}_report_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Type Selector */}
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-700">
            <FileText className="h-5 w-5" />
            Report Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
            {[
              { key: "balance", label: "Balance Reports", icon: DollarSign },
              { key: "sales", label: "Sales Reports", icon: TrendingUp },
              { key: "followup", label: "Follow Up Reports", icon: Phone },
              { key: "conversion", label: "Conversion Reports", icon: Target },
              { key: "activation", label: "Membership Activation", icon: CheckCircle },
              { key: "expiry", label: "Membership Expiry", icon: AlertTriangle },
            ].map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                variant={activeReport === key ? "default" : "outline"}
                onClick={() => setActiveReport(key)}
                disabled={loading}
                className={`h-auto p-4 flex flex-col items-center gap-2 ${
                  activeReport === key
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
                    : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                }`}
              >
                <Icon className="h-5 w-5" />
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
            Advanced Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search reports..."
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
                    className="w-full justify-start text-left font-normal border-emerald-200 hover:border-emerald-300 bg-transparent"
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
              <label className="text-sm font-medium text-slate-700">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-emerald-200 hover:border-emerald-300">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {activeReport === "balance" && (
                    <>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </>
                  )}
                  {activeReport === "sales" && (
                    <>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </>
                  )}
                  {activeReport === "followup" && (
                    <>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </>
                  )}
                  {activeReport === "conversion" && (
                    <>
                      <SelectItem value="converted">Converted</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                    </>
                  )}
                  {activeReport === "activation" && (
                    <>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </>
                  )}
                  {activeReport === "expiry" && (
                    <>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Package</label>
              <Select value={packageFilter} onValueChange={setPackageFilter}>
                <SelectTrigger className="border-emerald-200 hover:border-emerald-300">
                  <SelectValue placeholder="All Packages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Packages</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Counselor</label>
              <Select value={counselorFilter} onValueChange={setCounselorFilter}>
                <SelectTrigger className="border-emerald-200 hover:border-emerald-300">
                  <SelectValue placeholder="All Counselors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Counselors</SelectItem>
                  <SelectItem value="Sarah Johnson">Sarah Johnson</SelectItem>
                  <SelectItem value="Mike Wilson">Mike Wilson</SelectItem>
                  <SelectItem value="Lisa Brown">Lisa Brown</SelectItem>
                  <SelectItem value="John Davis">John Davis</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Time Period</label>
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="border-emerald-200 hover:border-emerald-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1week">Last Week</SelectItem>
                  <SelectItem value="1month">Last Month</SelectItem>
                  <SelectItem value="3months">Last 3 Months</SelectItem>
                  <SelectItem value="6months">Last 6 Months</SelectItem>
                  <SelectItem value="1year">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg"
                disabled={loading}
              >
                Apply Filters
              </Button>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={clearFilters}
                className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-transparent"
                disabled={loading}
              >
                Clear All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dynamic Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(stats).map(([key, value]) => (
          <Card
            key={key}
            className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-green-50 hover:shadow-xl transition-all"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-emerald-700 capitalize">
                {key.replace(/([A-Z])/g, " $1").trim()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {typeof value === "number" && key.includes("total") && key !== "total"
                  ? `$${value.toLocaleString()}`
                  : value}
              </div>
              <p className="text-xs text-slate-600">
                {key === "conversionRate"
                  ? "Success rate"
                  : key === "avgDelay"
                    ? "Days average"
                    : key.includes("total") && key !== "total"
                      ? "Total amount"
                      : "Count"}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dynamic Report Table */}
      <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-emerald-700">
            <FileText className="h-5 w-5" />
            {activeReport.charAt(0).toUpperCase() + activeReport.slice(1)} Report ({reportData.length} records)
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-transparent"
            onClick={exportToCSV}
            disabled={loading || reportData.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              <span className="ml-2 text-emerald-600">Loading data...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {/* Dynamic headers based on report type */}
                  {activeReport === "balance" && (
                    <>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("clientName")}
                          className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                        >
                          Client Name
                          {getSortIcon("clientName")}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("package")}
                          className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                        >
                          Package
                          {getSortIcon("package")}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("totalAmount")}
                          className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                        >
                          Total Amount
                          {getSortIcon("totalAmount")}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("amountPaid")}
                          className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                        >
                          Amount Paid
                          {getSortIcon("amountPaid")}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("balance")}
                          className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                        >
                          Balance
                          {getSortIcon("balance")}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("dueDate")}
                          className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                        >
                          Due Date
                          {getSortIcon("dueDate")}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("status")}
                          className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                        >
                          Status
                          {getSortIcon("status")}
                        </Button>
                      </TableHead>
                      <TableHead>Payment Method</TableHead>
                    </>
                  )}

                  {activeReport === "sales" && (
                    <>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("date")}
                          className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                        >
                          Date
                          {getSortIcon("date")}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("clientName")}
                          className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                        >
                          Client
                          {getSortIcon("clientName")}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("package")}
                          className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                        >
                          Package
                          {getSortIcon("package")}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("amount")}
                          className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                        >
                          Amount
                          {getSortIcon("amount")}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("counselor")}
                          className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                        >
                          Counselor
                          {getSortIcon("counselor")}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("commission")}
                          className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                        >
                          Commission
                          {getSortIcon("commission")}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("status")}
                          className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                        >
                          Status
                          {getSortIcon("status")}
                        </Button>
                      </TableHead>
                      <TableHead>Source</TableHead>
                    </>
                  )}

                  {activeReport === "followup" && (
                    <>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("leadName")}
                          className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                        >
                          Lead Name
                          {getSortIcon("leadName")}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("counselor")}
                          className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                        >
                          Counselor
                          {getSortIcon("counselor")}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("lastContact")}
                          className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                        >
                          Last Contact
                          {getSortIcon("lastContact")}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("nextFollowUp")}
                          className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                        >
                          Next Follow-up
                          {getSortIcon("nextFollowUp")}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("priority")}
                          className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                        >
                          Priority
                          {getSortIcon("priority")}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("status")}
                          className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                        >
                          Status
                          {getSortIcon("status")}
                        </Button>
                      </TableHead>
                      <TableHead>Contact Method</TableHead>
                      <TableHead>Attempts</TableHead>
                    </>
                  )}

                  {activeReport === "conversion" && (
                    <>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("leadName")}
                          className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                        >
                          Lead Name
                          {getSortIcon("leadName")}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("leadDate")}
                          className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                        >
                          Lead Date
                          {getSortIcon("leadDate")}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("conversionDate")}
                          className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                        >
                          Conversion Date
                          {getSortIcon("conversionDate")}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("daysTaken")}
                          className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                        >
                          Days Taken
                          {getSortIcon("daysTaken")}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("source")}
                          className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                        >
                          Source
                          {getSortIcon("source")}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("counselor")}
                          className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                        >
                          Counselor
                          {getSortIcon("counselor")}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("status")}
                          className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                        >
                          Status
                          {getSortIcon("status")}
                        </Button>
                      </TableHead>
                      <TableHead>Email</TableHead>
                    </>
                  )}

                  {activeReport === "activation" && (
                    <>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("clientName")}
                          className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                        >
                          Client Name
                          {getSortIcon("clientName")}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("package")}
                          className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                        >
                          Package
                          {getSortIcon("package")}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("joiningDate")}
                          className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                        >
                          Joining Date
                          {getSortIcon("joiningDate")}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("activationDate")}
                          className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                        >
                          Activation Date
                          {getSortIcon("activationDate")}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("activationDelay")}
                          className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                        >
                          Delay (Days)
                          {getSortIcon("activationDelay")}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("status")}
                          className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                        >
                          Status
                          {getSortIcon("status")}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("counselor")}
                          className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                        >
                          Counselor
                          {getSortIcon("counselor")}
                        </Button>
                      </TableHead>
                      <TableHead>Activated By</TableHead>
                    </>
                  )}

                  {activeReport === "expiry" && (
                    <>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("clientName")}
                          className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                        >
                          Client Name
                          {getSortIcon("clientName")}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("package")}
                          className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                        >
                          Package
                          {getSortIcon("package")}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("activationDate")}
                          className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                        >
                          Activation Date
                          {getSortIcon("activationDate")}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("expiryDate")}
                          className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                        >
                          Expiry Date
                          {getSortIcon("expiryDate")}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("daysRemaining")}
                          className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                        >
                          Days Remaining
                          {getSortIcon("daysRemaining")}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("status")}
                          className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                        >
                          Status
                          {getSortIcon("status")}
                        </Button>
                      </TableHead>
                      <TableHead>Renewal Status</TableHead>
                      <TableHead>Email</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.map((item, index) => (
                  <TableRow key={index} className="hover:bg-emerald-50/50">
                    {/* Dynamic table rows based on report type */}
                    {activeReport === "balance" && (
                      <>
                        <TableCell className="font-medium">{item.clientName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                            {item.package}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-emerald-600">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />${item.totalAmount.toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-blue-600">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />${item.amountPaid.toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.balance > 0 ? (
                            <div className="flex items-center gap-1 text-red-600 font-medium">
                              <AlertTriangle className="h-3 w-3" />${item.balance}
                            </div>
                          ) : (
                            <span className="text-emerald-600 font-medium">Paid</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3 text-slate-500" />
                            <span className={new Date(item.dueDate) < new Date() ? "text-red-600 font-medium" : ""}>
                              {new Date(item.dueDate).toLocaleDateString()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              item.status === "Paid"
                                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                : item.status === "Pending"
                                  ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                                  : "bg-red-100 text-red-700 border-red-200"
                            }
                          >
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.paymentMethod}</TableCell>
                      </>
                    )}

                    {activeReport === "sales" && (
                      <>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3 text-emerald-600" />
                            {item.date}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{item.clientName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                            {item.package}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-emerald-600">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />${item.amount.toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3 text-emerald-600" />
                            {item.counselor}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-blue-600">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />${item.commission}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              item.status === "Completed"
                                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                : "bg-yellow-100 text-yellow-700 border-yellow-200"
                            }
                          >
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-blue-200 text-blue-700">
                            {item.source}
                          </Badge>
                        </TableCell>
                      </>
                    )}

                    {activeReport === "followup" && (
                      <>
                        <TableCell className="font-medium">{item.leadName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3 text-emerald-600" />
                            {item.counselor}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3 text-slate-500" />
                            {item.lastContact}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-emerald-600" />
                            {item.nextFollowUp}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              item.priority === "High"
                                ? "bg-red-100 text-red-700 border-red-200"
                                : item.priority === "Medium"
                                  ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                                  : "bg-gray-100 text-gray-700 border-gray-200"
                            }
                          >
                            {item.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              item.status === "Completed"
                                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                : item.status === "Scheduled"
                                  ? "bg-blue-100 text-blue-700 border-blue-200"
                                  : item.status === "Overdue"
                                    ? "bg-red-100 text-red-700 border-red-200"
                                    : "bg-yellow-100 text-yellow-700 border-yellow-200"
                            }
                          >
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                            {item.contactMethod}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-blue-200 text-blue-700">
                            {item.attempts}
                          </Badge>
                        </TableCell>
                      </>
                    )}

                    {activeReport === "conversion" && (
                      <>
                        <TableCell className="font-medium">{item.leadName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3 text-slate-500" />
                            {new Date(item.leadDate).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3 text-emerald-600" />
                            {item.conversionDate ? new Date(item.conversionDate).toLocaleDateString() : "N/A"}
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.daysTaken ? (
                            <Badge variant="outline" className="border-blue-200 text-blue-700">
                              {item.daysTaken} days
                            </Badge>
                          ) : (
                            "N/A"
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                            {item.source}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3 text-emerald-600" />
                            {item.counselor}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              item.status === "Converted"
                                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                : "bg-red-100 text-red-700 border-red-200"
                            }
                          >
                            {item.status === "Converted" ? (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            ) : (
                              <XCircle className="h-3 w-3 mr-1" />
                            )}
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">{item.email}</TableCell>
                      </>
                    )}

                    {activeReport === "activation" && (
                      <>
                        <TableCell className="font-medium">{item.clientName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                            {item.package}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3 text-slate-500" />
                            {item.joiningDate}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3 text-emerald-600" />
                            {item.activationDate || "Pending"}
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.activationDelay ? (
                            <Badge
                              className={
                                item.activationDelay <= 1
                                  ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                  : item.activationDelay <= 3
                                    ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                                    : "bg-red-100 text-red-700 border-red-200"
                              }
                            >
                              {item.activationDelay} days
                            </Badge>
                          ) : (
                            "N/A"
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              item.status === "Active"
                                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                : "bg-yellow-100 text-yellow-700 border-yellow-200"
                            }
                          >
                            {item.status === "Active" ? (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            ) : (
                              <Clock className="h-3 w-3 mr-1" />
                            )}
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3 text-emerald-600" />
                            {item.counselor}
                          </div>
                        </TableCell>
                        <TableCell>{item.activatedBy || "Pending"}</TableCell>
                      </>
                    )}

                    {activeReport === "expiry" && (
                      <>
                        <TableCell className="font-medium">{item.clientName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                            {item.package}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3 text-emerald-600" />
                            {new Date(item.activationDate).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3 text-slate-500" />
                            <span className={item.daysRemaining <= 0 ? "text-red-600 font-medium" : ""}>
                              {new Date(item.expiryDate).toLocaleDateString()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              item.daysRemaining <= 0
                                ? "bg-red-100 text-red-700 border-red-200"
                                : item.daysRemaining <= 30
                                  ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                                  : "bg-emerald-100 text-emerald-700 border-emerald-200"
                            }
                          >
                            {item.daysRemaining <= 0
                              ? `${Math.abs(item.daysRemaining)} days overdue`
                              : `${item.daysRemaining} days`}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              item.status === "Active"
                                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                : "bg-red-100 text-red-700 border-red-200"
                            }
                          >
                            {item.status === "Active" ? (
                              <Activity className="h-3 w-3 mr-1" />
                            ) : (
                              <XCircle className="h-3 w-3 mr-1" />
                            )}
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              item.renewalStatus === "Contacted"
                                ? "bg-blue-100 text-blue-700 border-blue-200"
                                : item.renewalStatus === "Follow-up Required"
                                  ? "bg-red-100 text-red-700 border-red-200"
                                  : "bg-gray-100 text-gray-700 border-gray-200"
                            }
                          >
                            {item.renewalStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">{item.email}</TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
