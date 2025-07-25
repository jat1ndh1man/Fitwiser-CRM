
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

// Initialize Supabase client [^1]
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

// Role constants - matching the reference pattern
const EXECUTIVE_ROLE = "1fe1759c-dc14-4933-947a-c240c046bcde"
const SALES_MANAGER_ROLE = "11b93954-9a56-4ea5-a02c-15b731ee9dfb"
const ADMIN_ROLE = "46e786df-0272-4f22-aec2-56d2a517fa9d"
const SUPERADMIN_ROLE = "b00060fe-175a-459b-8f72-957055ee8c55"

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

interface ActivationReport {
  id: string
  clientName: string
  package: string
  joiningDate: string
  activationDate: string
  activationDelay: number
  status: string
  counselor: string
  activatedBy: string
  notes: string | null
}

interface SalesReport {
  id: string
  date: string
  clientName: string
  package: string
  amount: number
  counselor: string
  status: string
  source: string
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
  paymentCount: number
  totalPaid: number
  lastPayment: string | null
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

  // Role-based access control - matching reference pattern
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [assignedLeadIds, setAssignedLeadIds] = useState<string[]>([])
  const [userAccessInitialized, setUserAccessInitialized] = useState(false)

  // Dynamic data states
  const [balanceReports, setBalanceReports] = useState<BalanceReport[]>([])
  const [conversionReports, setConversionReports] = useState<ConversionReport[]>([])
  const [expiryReports, setExpiryReports] = useState<ExpiryReport[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [salesReports, setSalesReports] = useState<SalesReport[]>([])
  const [activationReports, setActivationReports] = useState<ActivationReport[]>([])

  // Initialize user role and assignments - matching reference pattern
  useEffect(() => {
    const initializeUserAccess = async () => {
      try {
        // Get user profile from localStorage
        const userProfile = localStorage.getItem("userProfile")
        if (!userProfile) {
          setUserAccessInitialized(true)
          return
        }

        const { id: userId, role_id: roleId } = JSON.parse(userProfile)
        setCurrentUserId(userId)
        setCurrentUserRole(roleId)

        // If user is executive, fetch their assigned lead IDs
        if (roleId === EXECUTIVE_ROLE) {
          const { data: assignments, error } = await supabase
            .from("lead_assignments")
            .select("lead_id")
            .eq("assigned_to", userId)

          if (error) {
            console.error("Error fetching lead assignments:", error)
            setError("Failed to fetch lead assignments")
          } else {
            const leadIds = assignments?.map((a) => a.lead_id) || []
            setAssignedLeadIds(leadIds)
            console.log("Executive assigned lead IDs:", leadIds)
          }
        }

        setUserAccessInitialized(true)
      } catch (error) {
        console.error("Error initializing user access:", error)
        setError("Failed to initialize user access")
        setUserAccessInitialized(true)
      }
    }

    initializeUserAccess()
  }, [])

  // Helper function to check if user has full access
  const hasFullAccess = () => {
    return [SUPERADMIN_ROLE, ADMIN_ROLE, SALES_MANAGER_ROLE].includes(currentUserRole || "")
  }

  // Helper function to get filtered lead IDs for current user
  const getFilteredLeadIds = () => {
    if (hasFullAccess()) {
      return null // null means no filtering - get all data
    }
    return assignedLeadIds // return assigned leads for executives
  }

  // Fetch balance reports with role-based filtering - FIXED TO SHOW ALL ASSIGNED LEADS
  const fetchBalanceReports = async () => {
    try {
      setLoading(true)
      setError(null)

      const filteredLeadIds = getFilteredLeadIds()

      // First, get all leads that should be included
      let leadsQuery = supabase.from("leads").select("*")
      if (filteredLeadIds !== null) {
        if (filteredLeadIds.length === 0) {
          setBalanceReports([])
          return
        }
        leadsQuery = leadsQuery.in("id", filteredLeadIds)
      }

      const { data: leads, error: leadsError } = await leadsQuery
      if (leadsError) throw leadsError

      // Get all users for name mapping
      const { data: users, error: usersError } = await supabase.from("users").select("id, email, first_name, last_name")
      if (usersError) throw usersError

      // Get payment data for these leads
      let paymentLinksQuery = supabase.from("payment_links").select("*")
      let manualPaymentsQuery = supabase.from("manual_payment").select("*")

      if (filteredLeadIds !== null && filteredLeadIds.length > 0) {
        paymentLinksQuery = paymentLinksQuery.in("lead_id", filteredLeadIds)
        manualPaymentsQuery = manualPaymentsQuery.in("lead_id", filteredLeadIds)
      }

      const { data: paymentLinks, error: paymentLinksError } = await paymentLinksQuery
      const { data: manualPayments, error: manualPaymentsError } = await manualPaymentsQuery

      if (paymentLinksError) throw paymentLinksError
      if (manualPaymentsError) throw manualPaymentsError

      // Create a map of payments by lead_id
      const paymentsByLead = new Map()

      // Process payment links
      ;(paymentLinks || []).forEach((payment: any) => {
        if (!payment.lead_id) return
        if (!paymentsByLead.has(payment.lead_id)) {
          paymentsByLead.set(payment.lead_id, [])
        }
        paymentsByLead.get(payment.lead_id).push({
          ...payment,
          type: "payment_link",
        })
      })

      // Process manual payments
      ;(manualPayments || []).forEach((payment: any) => {
        if (!payment.lead_id) return
        if (!paymentsByLead.has(payment.lead_id)) {
          paymentsByLead.set(payment.lead_id, [])
        }
        paymentsByLead.get(payment.lead_id).push({
          ...payment,
          type: "manual_payment",
        })
      })

      // Create balance reports for ALL leads (including those with no payments)
      const balanceReports: BalanceReport[] = (leads || []).map((lead: any) => {
        const leadPayments = paymentsByLead.get(lead.id) || []

        // Find user by email or phone
        const user = users?.find((u) => u.email === lead.email || u.phone === lead.phone_number)
        const firstName = user?.first_name || ""
        const lastName = user?.last_name || ""
        const clientName = `${firstName} ${lastName}`.trim() || lead.name || "Unknown User"

        if (leadPayments.length === 0) {
          // Lead with no payments - show as pending
          return {
            id: `lead_${lead.id}`,
            clientName,
            email: lead.email || "",
            package: "No Package",
            totalAmount: 0,
            amountPaid: 0,
            balance: 0,
            dueDate: lead.created_at,
            status: "No Payment",
            lastPayment: "Never",
            paymentMethod: "N/A",
          }
        }

        // Lead with payments - calculate totals
        const totalAmount = leadPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
        const amountPaid = leadPayments
          .filter((p: any) => p.status === "completed")
          .reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
        const balance = totalAmount - amountPaid

        const latestPayment = leadPayments.sort(
          (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )[0]

        return {
          id: `lead_${lead.id}`,
          clientName,
          email: lead.email || "",
          package: latestPayment?.plan || latestPayment?.description || "Standard",
          totalAmount,
          amountPaid,
          balance,
          dueDate: latestPayment?.expires_at || latestPayment?.plan_expiry || latestPayment?.created_at,
          status: balance > 0 ? "Pending" : amountPaid > 0 ? "Paid" : "No Payment",
          lastPayment: latestPayment?.payment_date || latestPayment?.updated_at || "Never",
          paymentMethod: latestPayment?.payment_method || "N/A",
        }
      })

      console.log("Balance reports generated:", balanceReports.length)
      setBalanceReports(balanceReports)
    } catch (err) {
      console.error("Error fetching balance reports:", err)
      setError("Failed to fetch balance reports")
    } finally {
      setLoading(false)
    }
  }

  const fetchConversionReports = async () => {
    try {
      setLoading(true)
      setError(null)

      const filteredLeadIds = getFilteredLeadIds()

      let leadsQuery = supabase.from("leads").select("*")
      if (filteredLeadIds !== null) {
        if (filteredLeadIds.length === 0) {
          setConversionReports([])
          return
        }
        leadsQuery = leadsQuery.in("id", filteredLeadIds)
      }

      const { data: leads, error: leadsErr } = await leadsQuery
      if (leadsErr) throw leadsErr

      const { data: users, error: usersErr } = await supabase
        .from("users")
        .select("id,email,phone,first_name,last_name,created_at")
      if (usersErr) throw usersErr

      // Load payments
      let linkPaymentsQuery = supabase.from("payment_links").select("lead_id, user_id, amount,payment_date")
      let manualPaymentsQuery = supabase.from("manual_payment").select("lead_id, user_id, amount, payment_date")

      if (filteredLeadIds !== null && filteredLeadIds.length > 0) {
        linkPaymentsQuery = linkPaymentsQuery.in("lead_id", filteredLeadIds)
        manualPaymentsQuery = manualPaymentsQuery.in("lead_id", filteredLeadIds)
      }

      const { data: linkPayments, error: lpErr } = await linkPaymentsQuery
      const { data: manualPayments, error: mpErr } = await manualPaymentsQuery

      if (lpErr) throw lpErr
      if (mpErr) throw mpErr

      // Group payments by lead_id
      const paymentsByLead = [...(linkPayments || []), ...(manualPayments || [])].reduce<
        Record<string, { amount: number; payment_date: string }[]>
      >((acc, p) => {
        if (!p.lead_id) return acc
        acc[p.lead_id] = acc[p.lead_id] || []
        acc[p.lead_id].push({ amount: p.amount, payment_date: p.payment_date })
        return acc
      }, {})

      const paymentsByUser = [...(linkPayments || []), ...(manualPayments || [])].reduce<
        Record<string, { amount: number; payment_date: string }[]>
      >((acc, p) => {
        if (!p.user_id) return acc
        acc[p.user_id] = acc[p.user_id] || []
        acc[p.user_id].push({ amount: p.amount, payment_date: p.payment_date })
        return acc
      }, {})

      // Map leads to ConversionReport
      const conversionData: ConversionReport[] = (leads || []).map((lead: any) => {
        const matched = users.find((u) => u.email === lead.email || u.phone === lead.phone_number)
        const isConverted = !!matched

        // Payment history - combine payments from both lead_id and user_id
        const leadPayments = paymentsByLead[lead.id] || []
        const userPayments = matched ? paymentsByUser[matched.id] || [] : []

        // Combine and deduplicate payments
        const allPayments = [...leadPayments, ...userPayments]
        const uniquePayments = allPayments.filter(
          (payment, index, self) =>
            index === self.findIndex((p) => p.payment_date === payment.payment_date && p.amount === payment.amount),
        )

        const paymentCount = uniquePayments.length
        const totalPaid = uniquePayments.reduce((sum, p) => sum + p.amount, 0)
        const lastPaymentIso =
          uniquePayments.map((p) => p.payment_date).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ||
          null

        return {
          id: lead.id,
          leadName: lead.name || "–",
          leadDate: lead.created_at,
          conversionDate: matched?.created_at || null,
          daysTaken: matched
            ? Math.ceil(
                (new Date(matched.created_at).getTime() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24),
              )
            : null,
          source: lead.source || "Unknown",
          counselor: lead.counselor || "Unassigned",
          package: matched ? "Standard" : null,
          amount: null,
          status: isConverted ? "Converted" : "Lost",
          touchpoints: 1,
          email: lead.email,
          phone: lead.phone_number,
          paymentCount,
          totalPaid,
          lastPayment: lastPaymentIso,
        }
      })

      console.log("Conversion reports generated:", conversionData.length)
      setConversionReports(conversionData)
    } catch (err) {
      console.error(err)
      setError("Failed to fetch conversion reports")
    } finally {
      setLoading(false)
    }
  }

  // Fetch membership expiry data with role-based filtering - FIXED TO SHOW ALL ASSIGNED LEADS
  const fetchExpiryReports = async () => {
    try {
      setLoading(true)
      setError(null)

      const filteredLeadIds = getFilteredLeadIds()

      // First get all leads
      let leadsQuery = supabase.from("leads").select("*")
      if (filteredLeadIds !== null) {
        if (filteredLeadIds.length === 0) {
          setExpiryReports([])
          return
        }
        leadsQuery = leadsQuery.in("id", filteredLeadIds)
      }

      const { data: leads, error: leadsError } = await leadsQuery
      if (leadsError) throw leadsError

      // Get all users for name mapping
      const { data: users, error: usersError } = await supabase.from("users").select("id, email, first_name, last_name")
      if (usersError) throw usersError

      // Get payment data
      let paymentLinksQuery = supabase.from("payment_links").select("*").eq("status", "completed")

      let manualPaymentsQuery = supabase.from("manual_payment").select("*").eq("status", "completed")

      if (filteredLeadIds !== null && filteredLeadIds.length > 0) {
        paymentLinksQuery = paymentLinksQuery.in("lead_id", filteredLeadIds)
        manualPaymentsQuery = manualPaymentsQuery.in("lead_id", filteredLeadIds)
      }

      const { data: paymentLinks, error: paymentLinksError } = await paymentLinksQuery
      const { data: manualPayments, error: manualPaymentsError } = await manualPaymentsQuery

      if (paymentLinksError) throw paymentLinksError
      if (manualPaymentsError) throw manualPaymentsError

      const currentDate = new Date()

      // Create a map of payments by lead_id
      const paymentsByLead = new Map()

      // Process payment links
      ;(paymentLinks || []).forEach((payment: any) => {
        if (!payment.lead_id || !payment.expires_at) return
        if (!paymentsByLead.has(payment.lead_id)) {
          paymentsByLead.set(payment.lead_id, [])
        }
        paymentsByLead.get(payment.lead_id).push({
          ...payment,
          type: "payment_link",
          expiry_date: payment.expires_at,
        })
      })

      // Process manual payments
      ;(manualPayments || []).forEach((payment: any) => {
        if (!payment.lead_id || !payment.plan_expiry) return
        if (!paymentsByLead.has(payment.lead_id)) {
          paymentsByLead.set(payment.lead_id, [])
        }
        paymentsByLead.get(payment.lead_id).push({
          ...payment,
          type: "manual_payment",
          expiry_date: payment.plan_expiry,
        })
      })

      // Create expiry reports for ALL leads with active payments
      const expiryReports: ExpiryReport[] = []
      ;(leads || []).forEach((lead: any) => {
        const leadPayments = paymentsByLead.get(lead.id) || []

        if (leadPayments.length === 0) {
          // Skip leads with no active payments for expiry report
          return
        }

        // Find user by email or phone
        const user = users?.find((u) => u.email === lead.email || u.phone === lead.phone_number)
        const firstName = user?.first_name || ""
        const lastName = user?.last_name || ""
        const clientName = `${firstName} ${lastName}`.trim() || lead.name || "Unknown User"

        // Create expiry report for each payment with expiry date
        leadPayments.forEach((payment: any, index: number) => {
          const expiryDate = new Date(payment.expiry_date)
          const daysRemaining = Math.ceil((expiryDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))

          expiryReports.push({
            id: `${payment.type}_${payment.id}_${index}`,
            clientName,
            package: payment.plan || payment.description || "Standard",
            activationDate: payment.payment_date || payment.created_at,
            expiryDate: payment.expiry_date,
            daysRemaining,
            status: daysRemaining > 0 ? "Active" : "Expired",
            renewalStatus: daysRemaining <= 30 ? "Follow-up Required" : "Not Contacted",
            lastRenewalContact: null,
            autoRenewal: false,
            email: lead.email || "",
          })
        })
      })

      console.log("Expiry reports generated:", expiryReports.length)
      setExpiryReports(expiryReports)
    } catch (err) {
      console.error("Error fetching expiry reports:", err)
      setError("Failed to fetch expiry reports")
    } finally {
      setLoading(false)
    }
  }

  const fetchActivationReports = async () => {
    try {
      setLoading(true)
      setError(null)

      const filteredLeadIds = getFilteredLeadIds()

      // Get all leads first
      let leadsQuery = supabase.from("leads").select("*")
      if (filteredLeadIds !== null) {
        if (filteredLeadIds.length === 0) {
          setActivationReports([])
          return
        }
        leadsQuery = leadsQuery.in("id", filteredLeadIds)
      }

      const { data: leads, error: leadsError } = await leadsQuery
      if (leadsError) throw leadsError

      // Get all users for name mapping
      const { data: users, error: usersError } = await supabase.from("users").select("id, email, first_name, last_name")
      if (usersError) throw usersError

      // Get completed payments
      let linkPaymentsQuery = supabase.from("payment_links").select("*").eq("status", "completed")

      let manualPaymentsQuery = supabase.from("manual_payment").select("*").eq("status", "completed")

      if (filteredLeadIds !== null && filteredLeadIds.length > 0) {
        linkPaymentsQuery = linkPaymentsQuery.in("lead_id", filteredLeadIds)
        manualPaymentsQuery = manualPaymentsQuery.in("lead_id", filteredLeadIds)
      }

      const { data: linkPayments, error: linkErr } = await linkPaymentsQuery
      const { data: manualPayments, error: manErr } = await manualPaymentsQuery

      if (linkErr) throw linkErr
      if (manErr) throw manErr

      // Get assignments
      let assignmentsQuery = supabase.from("lead_assignments").select("*")
      if (filteredLeadIds !== null && filteredLeadIds.length > 0) {
        assignmentsQuery = assignmentsQuery.in("lead_id", filteredLeadIds)
      }

      const { data: assignments, error: asnErr } = await assignmentsQuery
      if (asnErr) throw asnErr

      // Create activation reports for ALL leads (including those without payments)
      const activationReports: ActivationReport[] = []
      ;(leads || []).forEach((lead: any) => {
        // Find user by email or phone
        const user = users?.find((u) => u.email === lead.email || u.phone === lead.phone_number)
        const firstName = user?.first_name || ""
        const lastName = user?.last_name || ""
        const clientName = `${firstName} ${lastName}`.trim() || lead.name || "Unknown User"

        // Find assignment
        const assignment = assignments?.find((a) => a.lead_id === lead.id)
        const counselor = assignment ? users?.find((u) => u.id === assignment.assigned_to) : null
        const activatedBy = assignment ? users?.find((u) => u.id === assignment.assigned_by) : null

        // Find payments for this lead
        const leadPayments = [
          ...(linkPayments || []).filter((p) => p.lead_id === lead.id),
          ...(manualPayments || []).filter((p) => p.lead_id === lead.id),
        ]

        if (leadPayments.length === 0) {
          // Lead with no payments - show as pending activation
          activationReports.push({
            id: `lead_${lead.id}`,
            clientName,
            package: "No Package",
            joiningDate: lead.created_at,
            activationDate: "Pending",
            activationDelay: Math.ceil(
              (new Date().getTime() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24),
            ),
            status: "Pending",
            counselor: counselor ? `${counselor.first_name} ${counselor.last_name}` : "Unassigned",
            activatedBy: activatedBy ? `${activatedBy.first_name} ${activatedBy.last_name}` : "Unknown",
            notes: null,
          })
        } else {
          // Lead with payments - create report for each payment
          leadPayments.forEach((payment: any, index: number) => {
            const activationDate = payment.payment_date || payment.created_at
            const activationDelay = Math.ceil(
              (new Date(activationDate).getTime() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24),
            )

            activationReports.push({
              id: `payment_${payment.id}_${index}`,
              clientName,
              package: payment.plan || payment.description || "Standard",
              joiningDate: lead.created_at,
              activationDate,
              activationDelay,
              status: "Active",
              counselor: counselor ? `${counselor.first_name} ${counselor.last_name}` : "Unassigned",
              activatedBy: activatedBy ? `${activatedBy.first_name} ${activatedBy.last_name}` : "Unknown",
              notes: payment.notes || null,
            })
          })
        }
      })

      console.log("Activation reports generated:", activationReports.length)
      setActivationReports(activationReports)
    } catch (err) {
      console.error("Error fetching activation reports:", err)
      setError("Failed to fetch activation reports")
    } finally {
      setLoading(false)
    }
  }

  const fetchSalesReports = async () => {
    try {
      setLoading(true)
      setError(null)

      const filteredLeadIds = getFilteredLeadIds()

      // Get completed payments
      let linkPaymentsQuery = supabase.from("payment_links").select("*").eq("status", "completed")

      let manualPaymentsQuery = supabase.from("manual_payment").select("*").eq("status", "completed")

      if (filteredLeadIds !== null) {
        if (filteredLeadIds.length === 0) {
          setSalesReports([])
          return
        }
        linkPaymentsQuery = linkPaymentsQuery.in("lead_id", filteredLeadIds)
        manualPaymentsQuery = manualPaymentsQuery.in("lead_id", filteredLeadIds)
      }

      const { data: linkPayments, error: linkErr } = await linkPaymentsQuery
      const { data: manualPayments, error: manErr } = await manualPaymentsQuery

      if (linkErr) throw linkErr
      if (manErr) throw manErr

      const allPayments = [...(linkPayments || []), ...(manualPayments || [])]

      // Get lead information and assignments
      const leadIds = allPayments.map((p) => p.lead_id).filter(Boolean)

      let leadsQuery = supabase.from("leads").select("id, source, name, email")
      if (leadIds.length > 0) {
        leadsQuery = leadsQuery.in("id", leadIds)
      }

      const { data: leads, error: leadsErr } = await leadsQuery
      if (leadsErr) throw leadsErr

      let assignmentsQuery = supabase.from("lead_assignments").select("lead_id,assigned_to")
      if (leadIds.length > 0) {
        assignmentsQuery = assignmentsQuery.in("lead_id", leadIds)
      }

      const { data: assignments, error: asnErr } = await assignmentsQuery
      if (asnErr) throw asnErr

      // Load executives' profiles
      const execIds = Array.from(new Set(assignments?.map((a) => a.assigned_to) || []))

      let execProfilesQuery = supabase.from("users").select(`id, first_name, last_name, email`)
      if (execIds.length > 0) {
        execProfilesQuery = execProfilesQuery.in("id", execIds)
      }

      const { data: execProfiles, error: execErr } = await execProfilesQuery
      if (execErr) throw execErr

      // Get all users for name mapping
      const { data: users, error: usersError } = await supabase.from("users").select("id, email, first_name, last_name")
      if (usersError) throw usersError

      // Map payments to SalesReport
      const reports: SalesReport[] = allPayments.map((p) => {
        const lead = leads?.find((l) => l.id === p.lead_id)
        const asn = assignments?.find((a) => a.lead_id === p.lead_id)
        const exec = asn ? execProfiles?.find((u) => u.id === asn.assigned_to) : null

        // Find user by lead email or payment user_id
        const user = users?.find((u) => u.id === p.user_id || u.email === lead?.email)
        const clientName = user ? `${user.first_name} ${user.last_name}`.trim() : lead?.name || "Unknown"

        return {
          id: `${p.id}`,
          date: p.created_at,
          clientName,
          package: p.plan || p.description || "Standard",
          amount: p.amount,
          counselor: exec ? `${exec.first_name} ${exec.last_name}` : "Unassigned",
          status: p.status === "completed" ? "Completed" : p.status,
          source: lead?.source || "Unknown",
        }
      })

      console.log("Sales reports generated:", reports.length)
      setSalesReports(reports)
    } catch (err) {
      console.error("Error fetching sales reports:", err)
      setError("Failed to fetch sales reports")
    } finally {
      setLoading(false)
    }
  }

  // Fetch data when report type changes or user access is initialized
  useEffect(() => {
    // Only fetch data if user access is initialized
    if (!userAccessInitialized) return

    console.log(
      "Fetching data for report:",
      activeReport,
      "User role:",
      currentUserRole,
      "Assigned leads:",
      assignedLeadIds.length,
    )

    switch (activeReport) {
      case "balance":
        fetchBalanceReports()
        break
      case "sales":
        fetchSalesReports()
        break
      case "activation":
        fetchActivationReports()
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
  }, [activeReport, userAccessInitialized, currentUserRole, assignedLeadIds])

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
        return getFilteredAndSortedData(salesReports, ["clientName", "package", "counselor", "status", "source"])
      case "followup":
        return getFilteredAndSortedData(followUpReports, ["leadName", "counselor", "status"])
      case "conversion":
        return getFilteredAndSortedData(conversionReports, ["leadName", "source", "counselor"])
      case "activation":
        return getFilteredAndSortedData(activationReports, ["clientName", "package", "counselor"])
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
          pending: balanceReports.filter((r) => r.status === "Pending").length,
          totalBalance: balanceReports.reduce((sum, r) => sum + r.balance, 0),
        }
      case "sales":
        return {
          total: salesReports.length,
          completed: salesReports.filter((r) => r.status === "Completed").length,
          totalRevenue: salesReports.reduce((sum, r) => sum + r.amount, 0),
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
          total: activationReports.length,
          active: activationReports.filter((r) => r.status === "Active").length,
          pending: activationReports.filter((r) => r.status === "Pending").length,
          avgDelay:
            activationReports.length > 0
              ? (activationReports.reduce((sum, r) => sum + r.activationDelay, 0) / activationReports.length).toFixed(1)
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

  // Show loading if user access is not initialized yet
  if (!userAccessInitialized) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <span className="ml-2 text-emerald-600">Loading user profile...</span>
      </div>
    )
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

      {/* User Access Level Indicator */}
      <Card className="border-0 shadow-sm bg-blue-50/50">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 text-blue-700">
            <User className="h-4 w-4" />
            <span className="text-sm">
              Access Level: {hasFullAccess() ? "Full Access (All Data)" : "Executive Access (Assigned Leads Only)"}
              {currentUserRole === EXECUTIVE_ROLE && (
                <span className="ml-2 text-blue-600">({assignedLeadIds.length} assigned leads)</span>
              )}
            </span>
          </div>
        </CardContent>
      </Card>

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
                      <SelectItem value="no payment">No Payment</SelectItem>
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
                  <SelectItem value="no package">No Package</SelectItem>
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
                  <SelectItem value="Unassigned">Unassigned</SelectItem>
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
                  ? `₹${value.toLocaleString()}`
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
          ) : reportData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-500">
              <FileText className="h-12 w-12 mb-4 text-slate-300" />
              <h3 className="text-lg font-medium mb-2">No Data Available</h3>
              <p className="text-sm text-center">
                {currentUserRole === EXECUTIVE_ROLE && assignedLeadIds.length === 0
                  ? "You don't have any assigned leads yet."
                  : "No data found for the selected report type and filters."}
              </p>
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
                      <TableHead>Payments</TableHead>
                      <TableHead>Total Paid</TableHead>
                      <TableHead>Last Payment</TableHead>
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
                            <DollarSign className="h-3 w-3" />₹{item.totalAmount.toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-emerald-600">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />₹{item.amountPaid.toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.balance > 0 ? (
                            <div className="flex items-center gap-1 text-red-600 font-medium">
                              <AlertTriangle className="h-3 w-3" />₹{item.balance.toLocaleString()}
                            </div>
                          ) : item.status === "No Payment" ? (
                            <span className="text-gray-500 font-medium">No Payment</span>
                          ) : (
                            <span className="text-emerald-600 font-medium">Paid</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3 text-slate-500" />
                            <span className={new Date(item.dueDate) < new Date() ? "text-red-600 font-medium" : ""}>
                              {item.dueDate !== "Never" ? new Date(item.dueDate).toLocaleDateString() : "N/A"}
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
                                  : item.status === "No Payment"
                                    ? "bg-gray-100 text-gray-700 border-gray-200"
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
                            {format(new Date(item.date), "LLL dd, yyyy")}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{item.clientName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                            {item.package}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-emerald-600">
                          <div className="flex items-center gap-1">₹{item.amount.toLocaleString()}</div>
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
                        <TableCell>{item.paymentCount}</TableCell>
                        <TableCell className="font-medium text-emerald-600">
                          ₹{item.totalPaid.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {item.lastPayment ? (
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="h-3 w-3 text-slate-500" />
                              {format(new Date(item.lastPayment), "LLL dd, yyyy")}
                            </div>
                          ) : (
                            "N/A"
                          )}
                        </TableCell>
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
                            {format(new Date(item.joiningDate), "LLL dd, yyyy")}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3 text-emerald-600" />
                            {item.activationDate === "Pending"
                              ? "Pending"
                              : format(new Date(item.activationDate), "LLL dd, yyyy")}
                          </div>
                        </TableCell>
                        <TableCell>
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
                        <TableCell>{item.activatedBy}</TableCell>
                      </>
                    )}
                    {activeReport === "expiry" && (
                      <>
                        <TableCell className="font-medium">{item.clientName}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="border-emerald-200 text-emerald-700 whitespace-normal max-w-xs text-center px-2 py-1 break-words text-xs"
                          >
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
