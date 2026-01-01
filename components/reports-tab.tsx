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
  Info,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Users,
  RefreshCw,
  Snowflake,
  Heart,
  Star,
  FileQuestion,
  Coffee,
} from "lucide-react"
import { format } from "date-fns"
import type { DateRange } from "react-day-picker"

// Initialize Supabase client
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

// Role constants
const EXECUTIVE_ROLE = "1fe1759c-dc14-4933-947a-c240c046bcde"
const SALES_MANAGER_ROLE = "11b93954-9a56-4ea5-a02c-15b731ee9dfb"
const ADMIN_ROLE = "46e786df-0272-4f22-aec2-56d2a517fa9d"
const SUPERADMIN_ROLE = "b00060fe-175a-459b-8f72-957055ee8c55"

// Types for our data structures
interface BalanceReport {
  id: string
  clientName: string
  contact: string
  package: string
  totalAmount: number
  amountPaid: number
  balance: number
  dueDate: string
  dueDays: number
  counselor: string
  coach: string
  email: string
}

interface SalesReport {
  id: string
  date: string
  clientName: string
  contact: string
  package: string
  amount: number
  upsellRenewal: string
  counselor: string
  balance: number
  city: string
  source: string
}

interface ActivationReport {
  id: string
  clientName: string
  contact: string
  package: string
  joiningDate: string
  activationDate: string
  expiryDate: string
  leftDays: number
  counselor: string
  coach: string
}

interface ExpiryReport {
  id: string
  clientName: string
  contact: string
  package: string
  joiningDate: string
  activationDate: string
  expiryDate: string
  leftDays: number
  counselor: string
  coach: string
  renewalStatus: string
  email: string
}

interface FreezingReport {
  id: string
  clientName: string
  contact: string
  package: string
  activationDate: string
  frozenDays: number
  updatedExpiryDate: string
  counselor: string
  coach: string
  reason: string
}

interface FollowUpReport {
  id: string
  name: string
  contact: string
  counselor: string
  lastContact: string
  source: string
  leadDate: string
  status: string
  followUpDate: string
  attempts: number
}

interface AppointmentReport {
  id: string
  name: string
  contact: string
  counselor: string
  bde: string
  source: string
  leadDate: string
  followUpDate: string
  attempts: number
  appointmentStatus: string
}

interface ReferralReport {
  id: string
  name: string
  contact: string
  referredBy: string
  referrerContact: string
  counselor: string
  leadDate: string
  leadStatus: string
  followUpDate: string
}

interface RenewalReport {
  id: string
  clientName: string
  contact: string
  package: string
  joiningDate: string
  activationDate: string
  expiryDate: string
  leftDays: number
  counselor: string
  coach: string
  renewalMonth: string
}

// Add reference tracking table schema (we'll create this dynamically)
const REFERENCES_TABLE = `
CREATE TABLE IF NOT EXISTS user_references (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id uuid REFERENCES users(id),
  referred_user_id uuid REFERENCES users(id),
  referral_date timestamp DEFAULT now(),
  status varchar(20) DEFAULT 'pending',
  converted_at timestamp,
  created_at timestamp DEFAULT now()
);
`

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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Role-based access control
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [assignedLeadIds, setAssignedLeadIds] = useState<string[]>([])
  const [userAccessInitialized, setUserAccessInitialized] = useState(false)

  // Dynamic data states
  const [balanceReports, setBalanceReports] = useState<BalanceReport[]>([])
  const [salesReports, setSalesReports] = useState<SalesReport[]>([])
  const [activationReports, setActivationReports] = useState<ActivationReport[]>([])
  const [expiryReports, setExpiryReports] = useState<ExpiryReport[]>([])
  const [renewalReports, setRenewalReports] = useState<RenewalReport[]>([])
  const [freezingReports, setFreezingReports] = useState<FreezingReport[]>([])
  const [followUpReports, setFollowUpReports] = useState<FollowUpReport[]>([])
  const [appointmentReports, setAppointmentReports] = useState<AppointmentReport[]>([])
  const [referralReports, setReferralReports] = useState<ReferralReport[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string>("")

  // Initialize user role and assignments
  useEffect(() => {
    const initializeUserAccess = async () => {
      try {
        const userProfile = localStorage.getItem("userProfile")
        if (!userProfile) {
          setUserAccessInitialized(true)
          return
        }

        const { id: userId, role_id: roleId } = JSON.parse(userProfile)
        setCurrentUserId(userId)
        setCurrentUserRole(roleId)

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

  // Helper function to get coach name for a client
  const getClientCoach = async (userId: string) => {
    const { data } = await supabase
      .from("client_coach_relationships")
      .select("coach_id")
      .eq("client_id", userId)
      .eq("status", "active")
      .single()

    if (data) {
      const { data: coach } = await supabase
        .from("users")
        .select("first_name, last_name")
        .eq("id", data.coach_id)
        .single()

      if (coach) {
        return `${coach.first_name} ${coach.last_name}`
      }
    }
    return "Not Assigned"
  }

  // Fetch balance reports
  const fetchBalanceReports = async () => {
    try {
      setLoading(true)
      setError(null)

      const filteredLeadIds = getFilteredLeadIds()

      // Get all leads
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

      // Get all users for mapping
      const { data: users, error: usersError } = await supabase.from("users").select("id, email, phone, first_name, last_name")
      if (usersError) throw usersError

      // Get payment data
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

      // Process balance reports
      const balanceReports: BalanceReport[] = []

      for (const lead of leads || []) {
        const user = users?.find((u) => u.email === lead.email || u.phone === lead.phone_number)
        const clientName = user ? `${user.first_name} ${user.last_name}`.trim() : lead.name || "Unknown"
        
        // Get coach information
        const coach = user ? await getClientCoach(user.id) : "Not Assigned"

        // Get payments for this lead
        const leadPayments = [
          ...(paymentLinks || []).filter((p) => p.lead_id === lead.id),
          ...(manualPayments || []).filter((p) => p.lead_id === lead.id),
        ]

        const totalAmount = leadPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
        const amountPaid = leadPayments
          .filter((p) => p.status === "completed")
          .reduce((sum, p) => sum + (p.amount || 0), 0)
        const balance = totalAmount - amountPaid

        // Calculate due days
        const latestPayment = leadPayments.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )[0]
        
        const dueDate = latestPayment?.due_date || latestPayment?.expires_at || null
        let dueDays = 0
        if (dueDate) {
          const today = new Date()
          const due = new Date(dueDate)
          dueDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        }

        balanceReports.push({
          id: lead.id,
          clientName,
          contact: lead.phone_number || user?.phone || "N/A",
          package: latestPayment?.plan || latestPayment?.package_name || "No Package",
          totalAmount,
          amountPaid,
          balance,
          dueDate: dueDate || "Not Set",
          dueDays,
          counselor: lead.counselor || "Unassigned",
          coach,
          email: lead.email || user?.email || "",
        })
      }

      setBalanceReports(balanceReports)
    } catch (err: any) {
      console.error("Error fetching balance reports:", err)
      setError("Failed to fetch balance reports")
    } finally {
      setLoading(false)
    }
  }

  // Fetch sales reports
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

      // Get lead information
      const leadIds = allPayments.map((p) => p.lead_id).filter(Boolean)
      let leadsQuery = supabase.from("leads").select("*")
      if (leadIds.length > 0) {
        leadsQuery = leadsQuery.in("id", leadIds)
      }

      const { data: leads, error: leadsErr } = await leadsQuery
      if (leadsErr) throw leadsErr

      // Get users for mapping
      const { data: users, error: usersError } = await supabase.from("users").select("id, email, phone, first_name, last_name")
      if (usersError) throw usersError

      // Process sales reports
      const salesReports: SalesReport[] = []

      for (const payment of allPayments) {
        const lead = leads?.find((l) => l.id === payment.lead_id)
        const user = users?.find((u) => u.id === payment.user_id || u.email === lead?.email)
        
        const clientName = user ? `${user.first_name} ${user.last_name}`.trim() : lead?.name || "Unknown"
        
        // Calculate balance (if any pending payments)
        const leadPayments = allPayments.filter(p => p.lead_id === payment.lead_id)
        const totalAmount = leadPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
        const amountPaid = leadPayments
          .filter((p) => p.status === "completed")
          .reduce((sum, p) => sum + (p.amount || 0), 0)
        const balance = totalAmount - amountPaid

        salesReports.push({
          id: payment.id,
          date: payment.payment_date || payment.created_at,
          clientName,
          contact: lead?.phone_number || user?.phone || "N/A",
          package: payment.plan || payment.package_name || "Standard",
          amount: payment.amount || 0,
          upsellRenewal: payment.bill_type === "renewal" ? "Renewal" : payment.bill_type === "upsell" ? "Upsell" : "New",
          counselor: lead?.counselor || "Unassigned",
          balance,
          city: lead?.city || "N/A",
          source: lead?.source || "Unknown",
        })
      }

      setSalesReports(salesReports)
    } catch (err: any) {
      console.error("Error fetching sales reports:", err)
      setError("Failed to fetch sales reports")
    } finally {
      setLoading(false)
    }
  }

  // Fetch activation reports
// Fix fetchActivationReports function
const fetchActivationReports = async () => {
  try {
    setLoading(true)
    setError(null)

    const filteredLeadIds = getFilteredLeadIds()

    // Get all leads
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

    // Get all users for mapping
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, email, phone, first_name, last_name, created_at")
    if (usersError) throw usersError

    // Get completed payments from payment_links
    let linkPaymentsQuery = supabase.from("payment_links").select("*").eq("status", "completed")
    if (filteredLeadIds !== null && filteredLeadIds.length > 0) {
      linkPaymentsQuery = linkPaymentsQuery.in("lead_id", filteredLeadIds)
    }

    // Get completed payments from manual_payment
    let manualPaymentsQuery = supabase.from("manual_payment").select("*").eq("status", "completed")
    if (filteredLeadIds !== null && filteredLeadIds.length > 0) {
      manualPaymentsQuery = manualPaymentsQuery.in("lead_id", filteredLeadIds)
    }

    const { data: linkPayments, error: linkErr } = await linkPaymentsQuery
    const { data: manualPayments, error: manErr } = await manualPaymentsQuery

    if (linkErr) throw linkErr
    if (manErr) throw manErr

    // Combine payments from both tables
    const allPayments = [...(linkPayments || []), ...(manualPayments || [])]

    const activationReports: ActivationReport[] = []

    for (const lead of leads || []) {
      const user = users?.find((u) => u.email === lead.email || u.phone === lead.phone_number)
      const clientName = user ? `${user.first_name} ${user.last_name}`.trim() : lead.name || "Unknown"
      
      // Get coach information
      const coach = user ? await getClientCoach(user.id) : "Not Assigned"

      // Find first payment for activation
      const leadPayments = allPayments.filter((p: any) => p.lead_id === lead.id)
      if (leadPayments.length > 0) {
        const firstPayment = leadPayments.sort(
          (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )[0]

        const joiningDate = user?.created_at || lead.created_at
        const activationDate = firstPayment.payment_date || firstPayment.created_at
        const expiryDate = firstPayment.plan_expiry || "Not Set"
        
        // Calculate left days
        let leftDays = 0
        if (expiryDate !== "Not Set") {
          const today = new Date()
          const expiry = new Date(expiryDate)
          leftDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        }

        activationReports.push({
          id: lead.id,
          clientName,
          contact: lead.phone_number || user?.phone || "N/A",
          package: firstPayment.plan || firstPayment.package_name || "Standard",
          joiningDate,
          activationDate,
          expiryDate,
          leftDays,
          counselor: lead.counselor || "Unassigned",
          coach,
        })
      }
    }

    setActivationReports(activationReports)
  } catch (err: any) {
    console.error("Error fetching activation reports:", err)
    setError("Failed to fetch activation reports")
  } finally {
    setLoading(false)
  }
}

// Fix fetchExpiryReports function
const fetchExpiryReports = async () => {
  try {
    setLoading(true)
    setError(null)

    const filteredLeadIds = getFilteredLeadIds()

    // Get all leads
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

    // Get all users for mapping
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, email, phone, first_name, last_name, created_at")
    if (usersError) throw usersError

    // Get payments with expiry dates from payment_links
    let linkPaymentsQuery = supabase
      .from("payment_links")
      .select("*")
      .not("plan_expiry", "is", null)
      .eq("status", "completed")
    
    if (filteredLeadIds !== null && filteredLeadIds.length > 0) {
      linkPaymentsQuery = linkPaymentsQuery.in("lead_id", filteredLeadIds)
    }

    // Get payments with expiry dates from manual_payment
    let manualPaymentsQuery = supabase
      .from("manual_payment")
      .select("*")
      .not("plan_expiry", "is", null)
      .eq("status", "completed")
    
    if (filteredLeadIds !== null && filteredLeadIds.length > 0) {
      manualPaymentsQuery = manualPaymentsQuery.in("lead_id", filteredLeadIds)
    }

    const { data: linkPayments, error: linkErr } = await linkPaymentsQuery
    const { data: manualPayments, error: manErr } = await manualPaymentsQuery

    if (linkErr) throw linkErr
    if (manErr) throw manErr

    // Combine payments from both tables
    const allPayments = [...(linkPayments || []), ...(manualPayments || [])]

    const expiryReports: ExpiryReport[] = []

    for (const lead of leads || []) {
      const user = users?.find((u) => u.email === lead.email || u.phone === lead.phone_number)
      const clientName = user ? `${user.first_name} ${user.last_name}`.trim() : lead.name || "Unknown"
      
      // Get coach information
      const coach = user ? await getClientCoach(user.id) : "Not Assigned"

      // Find latest payment with expiry
      const leadPayments = allPayments.filter((p: any) => p.lead_id === lead.id)
      if (leadPayments.length > 0) {
        const latestPayment = leadPayments.sort(
          (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0]

        const joiningDate = user?.created_at || lead.created_at
        const activationDate = latestPayment.payment_date || latestPayment.created_at
        const expiryDate = latestPayment.plan_expiry
        
        // Calculate left days
        const today = new Date()
        const expiry = new Date(expiryDate)
        const leftDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        
        // Determine renewal status
        let renewalStatus = "Active"
        if (leftDays <= 0) renewalStatus = "Expired"
        else if (leftDays <= 30) renewalStatus = "Renewal Due"
        else if (leftDays <= 60) renewalStatus = "Upcoming Renewal"

        expiryReports.push({
          id: lead.id,
          clientName,
          contact: lead.phone_number || user?.phone || "N/A",
          package: latestPayment.plan || latestPayment.package_name || "Standard",
          joiningDate,
          activationDate,
          expiryDate,
          leftDays,
          counselor: lead.counselor || "Unassigned",
          coach,
          renewalStatus,
          email: lead.email || user?.email || "",
        })
      }
    }

    setExpiryReports(expiryReports)
  } catch (err: any) {
    console.error("Error fetching expiry reports:", err)
    setError("Failed to fetch expiry reports")
  } finally {
    setLoading(false)
  }
}

// Fix fetchRenewalReports function
const fetchRenewalReports = async () => {
  try {
    setLoading(true)
    setError(null)

    const filteredLeadIds = getFilteredLeadIds()

    // Get all leads
    let leadsQuery = supabase.from("leads").select("*")
    if (filteredLeadIds !== null) {
      if (filteredLeadIds.length === 0) {
        setRenewalReports([])
        return
      }
      leadsQuery = leadsQuery.in("id", filteredLeadIds)
    }

    const { data: leads, error: leadsError } = await leadsQuery
    if (leadsError) throw leadsError

    // Get all users for mapping
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, email, phone, first_name, last_name, created_at")
    if (usersError) throw usersError

    // Get current month range
    const currentDate = new Date()
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    
    // Format dates for Supabase query
    const firstDayStr = firstDayOfMonth.toISOString().split('T')[0]
    const lastDayStr = lastDayOfMonth.toISOString().split('T')[0]

    // Get payments with expiry dates in current month from payment_links
    let linkPaymentsQuery = supabase
      .from("payment_links")
      .select("*")
      .eq("status", "completed")
      .gte("plan_expiry", firstDayStr)
      .lte("plan_expiry", lastDayStr)
    
    if (filteredLeadIds !== null && filteredLeadIds.length > 0) {
      linkPaymentsQuery = linkPaymentsQuery.in("lead_id", filteredLeadIds)
    }

    // Get payments with expiry dates in current month from manual_payment
    let manualPaymentsQuery = supabase
      .from("manual_payment")
      .select("*")
      .eq("status", "completed")
      .gte("plan_expiry", firstDayStr)
      .lte("plan_expiry", lastDayStr)
    
    if (filteredLeadIds !== null && filteredLeadIds.length > 0) {
      manualPaymentsQuery = manualPaymentsQuery.in("lead_id", filteredLeadIds)
    }

    const { data: linkPayments, error: linkErr } = await linkPaymentsQuery
    const { data: manualPayments, error: manErr } = await manualPaymentsQuery

    if (linkErr) throw linkErr
    if (manErr) throw manErr

    // Combine payments from both tables
    const allPayments = [...(linkPayments || []), ...(manualPayments || [])]

    const renewalReports: RenewalReport[] = []

    for (const lead of leads || []) {
      const user = users?.find((u) => u.email === lead.email || u.phone === lead.phone_number)
      const clientName = user ? `${user.first_name} ${user.last_name}`.trim() : lead.name || "Unknown"
      
      // Get coach information
      const coach = user ? await getClientCoach(user.id) : "Not Assigned"

      // Find payments for this lead
      const leadPayments = allPayments.filter((p: any) => p.lead_id === lead.id)
      if (leadPayments.length > 0) {
        for (const payment of leadPayments) {
          const joiningDate = user?.created_at || lead.created_at
          const activationDate = payment.payment_date || payment.created_at
          const expiryDate = payment.plan_expiry
          
          // Calculate left days
          const today = new Date()
          const expiry = new Date(expiryDate)
          const leftDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

          renewalReports.push({
            id: `${lead.id}_${payment.id}`,
            clientName,
            contact: lead.phone_number || user?.phone || "N/A",
            package: payment.plan || payment.package_name || "Standard",
            joiningDate,
            activationDate,
            expiryDate,
            leftDays,
            counselor: lead.counselor || "Unassigned",
            coach,
            renewalMonth: `${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`,
          })
        }
      }
    }

    setRenewalReports(renewalReports)
  } catch (err: any) {
    console.error("Error fetching renewal reports:", err)
    setError("Failed to fetch renewal reports")
  } finally {
    setLoading(false)
  }
}

  // Fetch freezing reports
  const fetchFreezingReports = async () => {
    try {
      setLoading(true)
      setError(null)

      const filteredLeadIds = getFilteredLeadIds()

      // Get membership freezes
      let freezesQuery = supabase.from("membership_freezes").select("*")
      
      // We need to filter by lead/user access
      const { data: freezes, error: freezesError } = await freezesQuery
      if (freezesError) throw freezesError

      // Get users
      const { data: users, error: usersError } = await supabase.from("users").select("id, email, phone, first_name, last_name")
      if (usersError) throw usersError

      // Get leads for mapping
      const { data: leads, error: leadsError } = await supabase.from("leads").select("*")
      if (leadsError) throw leadsError

      const freezingReports: FreezingReport[] = []

      for (const freeze of freezes || []) {
        const user = users?.find((u) => u.id === freeze.user_id)
        if (!user) continue

        const lead = leads?.find((l) => l.email === user.email || l.phone_number === user.phone)
        if (!lead && filteredLeadIds !== null) continue // Skip if no lead found for executives

        // Check if executive has access to this lead
        if (filteredLeadIds !== null && !filteredLeadIds.includes(lead.id)) {
          continue
        }

        // Get coach
        const coach = await getClientCoach(user.id)

        // Calculate frozen days
        const start = new Date(freeze.freeze_start_date)
        const end = new Date(freeze.freeze_end_date)
        const frozenDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

        freezingReports.push({
          id: freeze.id.toString(),
          clientName: `${user.first_name} ${user.last_name}`,
          contact: user.phone || "N/A",
          package: freeze.plan_type || "Standard",
          activationDate: user.created_at || "N/A",
          frozenDays,
          updatedExpiryDate: freeze.new_expiry || "Not Set",
          counselor: lead?.counselor || "Unassigned",
          coach,
          reason: freeze.is_read ? "Processed" : "Pending Review", // Placeholder for reason
        })
      }

      setFreezingReports(freezingReports)
    } catch (err: any) {
      console.error("Error fetching freezing reports:", err)
      setError("Failed to fetch freezing reports")
    } finally {
      setLoading(false)
    }
  }

  // Fetch follow-up reports
  const fetchFollowUpReports = async () => {
    try {
      setLoading(true)
      setError(null)

      const filteredLeadIds = getFilteredLeadIds()

      // Get leads with follow-up dates
      let leadsQuery = supabase.from("leads").select("*").not("follow_up_date", "is", null)
      if (filteredLeadIds !== null) {
        if (filteredLeadIds.length === 0) {
          setFollowUpReports([])
          return
        }
        leadsQuery = leadsQuery.in("id", filteredLeadIds)
      }

      const { data: leads, error: leadsError } = await leadsQuery
      if (leadsError) throw leadsError

      const followUpReports: FollowUpReport[] = (leads || []).map(lead => ({
        id: lead.id,
        name: lead.name,
        contact: lead.phone_number,
        counselor: lead.counselor || "Unassigned",
        lastContact: lead.last_activity_date || lead.created_at,
        source: lead.source || "Unknown",
        leadDate: lead.created_at,
        status: lead.status === "Converted" ? "Done" : 
                lead.status === "Lost" ? "Failed" : "Pending",
        followUpDate: lead.follow_up_date,
        attempts: lead.lead_score || 1,
      }))

      setFollowUpReports(followUpReports)
    } catch (err: any) {
      console.error("Error fetching follow-up reports:", err)
      setError("Failed to fetch follow-up reports")
    } finally {
      setLoading(false)
    }
  }

  // Fetch appointment reports
  const fetchAppointmentReports = async () => {
    try {
      setLoading(true)
      setError(null)

      const filteredLeadIds = getFilteredLeadIds()

      // Get leads (considering all leads as potential appointments)
      let leadsQuery = supabase.from("leads").select("*")
      if (filteredLeadIds !== null) {
        if (filteredLeadIds.length === 0) {
          setAppointmentReports([])
          return
        }
        leadsQuery = leadsQuery.in("id", filteredLeadIds)
      }

      const { data: leads, error: leadsError } = await leadsQuery
      if (leadsError) throw leadsError

      // Get BDE information (assuming BDE is the user who created/modified the lead)
      const { data: users, error: usersError } = await supabase.from("users").select("id, email, first_name, last_name")
      if (usersError) throw usersError

      const appointmentReports: AppointmentReport[] = (leads || []).map(lead => {
        // Find BDE (could be the user associated with the lead or counselor)
        const bdeUser = users?.find(u => u.email === lead.email) || 
                       users?.find(u => `${u.first_name} ${u.last_name}` === lead.counselor)
        
        return {
          id: lead.id,
          name: lead.name,
          contact: lead.phone_number,
          counselor: lead.counselor || "Unassigned",
          bde: bdeUser ? `${bdeUser.first_name} ${bdeUser.last_name}` : "N/A",
          source: lead.source || "Unknown",
          leadDate: lead.created_at,
          followUpDate: lead.follow_up_date || "Not Set",
          attempts: lead.lead_score || 1,
          appointmentStatus: lead.status === "Converted" ? "Successful" : 
                           lead.status === "Lost" ? "Failed" : "Scheduled",
        }
      })

      setAppointmentReports(appointmentReports)
    } catch (err: any) {
      console.error("Error fetching appointment reports:", err)
      setError("Failed to fetch appointment reports")
    } finally {
      setLoading(false)
    }
  }

  // Fetch referral reports
  const fetchReferralReports = async () => {
    try {
      setLoading(true)
      setError(null)

      const filteredLeadIds = getFilteredLeadIds()

      // Get leads with referral source
      let leadsQuery = supabase.from("leads").select("*").ilike("source", "%referral%")
      if (filteredLeadIds !== null) {
        if (filteredLeadIds.length === 0) {
          setReferralReports([])
          return
        }
        leadsQuery = leadsQuery.in("id", filteredLeadIds)
      }

      const { data: leads, error: leadsError } = await leadsQuery
      if (leadsError) throw leadsError

      // Try to get referral data from users table (assuming referrer information might be in notes or extra field)
      const { data: users, error: usersError } = await supabase.from("users").select("*")
      if (usersError) throw usersError

      const referralReports: ReferralReport[] = (leads || []).map(lead => {
        // Try to extract referrer from notes or source
        let referredBy = "Unknown"
        let referrerContact = "N/A"
        
        if (lead.notes && lead.notes.includes("referred by")) {
          const match = lead.notes.match(/referred by\s*(.*?)(?:\s|$)/i)
          if (match) referredBy = match[1]
        } else if (lead.source && lead.source.includes("referral-")) {
          referredBy = lead.source.replace("referral-", "").split("-")[0]
        }

        // Try to find referrer contact
        const referrerUser = users?.find(u => 
          u.first_name?.includes(referredBy) || 
          u.last_name?.includes(referredBy) ||
          u.email?.includes(referredBy)
        )
        if (referrerUser) {
          referrerContact = referrerUser.phone || "N/A"
        }

        return {
          id: lead.id,
          name: lead.name,
          contact: lead.phone_number,
          referredBy,
          referrerContact,
          counselor: lead.counselor || "Unassigned",
          leadDate: lead.created_at,
          leadStatus: lead.status || "New",
          followUpDate: lead.follow_up_date || "Not Set",
        }
      })

      setReferralReports(referralReports)
    } catch (err: any) {
      console.error("Error fetching referral reports:", err)
      setError("Failed to fetch referral reports")
    } finally {
      setLoading(false)
    }
  }

  // Fetch data when report type changes
  useEffect(() => {
    if (!userAccessInitialized) return

    console.log("Fetching data for report:", activeReport)

    // Reset pagination when changing report type
    setCurrentPage(1)

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
      case "expiry":
        fetchExpiryReports()
        break
      case "renewal":
        fetchRenewalReports()
        break
      case "freezing":
        fetchFreezingReports()
        break
      case "followup":
        fetchFollowUpReports()
        break
      case "appointments":
        fetchAppointmentReports()
        break
      case "referral":
        fetchReferralReports()
        break
      default:
        break
    }
  }, [activeReport, userAccessInitialized, currentUserRole, assignedLeadIds])

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, counselorFilter, packageFilter, dateRange, sortField, sortDirection])

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

      // Date range filter
      let matchesDateRange = true
      if (dateRange?.from || dateRange?.to) {
        const itemDate = new Date(item.date || item.joiningDate || item.leadDate || item.activationDate || item.followUpDate)
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
    setCurrentPage(1)
  }

  const getReportData = () => {
    let filteredData = []
    
    switch (activeReport) {
      case "balance":
        filteredData = getFilteredAndSortedData(balanceReports, ["clientName", "contact", "package", "counselor"])
        break
      case "sales":
        filteredData = getFilteredAndSortedData(salesReports, ["clientName", "contact", "package", "counselor", "source", "city"])
        break
      case "activation":
        filteredData = getFilteredAndSortedData(activationReports, ["clientName", "contact", "package", "counselor"])
        break
      case "expiry":
        filteredData = getFilteredAndSortedData(expiryReports, ["clientName", "contact", "package", "counselor", "renewalStatus"])
        break
      case "renewal":
        filteredData = getFilteredAndSortedData(renewalReports, ["clientName", "contact", "package", "counselor", "renewalMonth"])
        break
      case "freezing":
        filteredData = getFilteredAndSortedData(freezingReports, ["clientName", "contact", "package", "counselor", "reason"])
        break
      case "followup":
        filteredData = getFilteredAndSortedData(followUpReports, ["name", "contact", "counselor", "source", "status"])
        break
      case "appointments":
        filteredData = getFilteredAndSortedData(appointmentReports, ["name", "contact", "counselor", "bde", "source", "appointmentStatus"])
        break
      case "referral":
        filteredData = getFilteredAndSortedData(referralReports, ["name", "contact", "counselor", "referredBy", "leadStatus"])
        break
      default:
        filteredData = []
    }

    // Calculate pagination
    const totalItems = filteredData.length
    const totalPages = Math.ceil(totalItems / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedData = filteredData.slice(startIndex, endIndex)

    return {
      data: paginatedData,
      totalItems,
      totalPages,
      currentPage,
      itemsPerPage,
      startIndex: startIndex + 1,
      endIndex: Math.min(endIndex, totalItems)
    }
  }

  const getReportStats = () => {
    switch (activeReport) {
      case "balance":
        return {
          total: balanceReports.length,
          paid: balanceReports.filter((r) => r.balance <= 0).length,
          pending: balanceReports.filter((r) => r.balance > 0).length,
          totalBalance: balanceReports.reduce((sum, r) => sum + r.balance, 0),
          overdue: balanceReports.filter((r) => r.dueDays < 0).length,
        }
      case "sales":
        return {
          total: salesReports.length,
          completed: salesReports.filter((r) => r.amount > 0).length,
          totalRevenue: salesReports.reduce((sum, r) => sum + r.amount, 0),
          upsell: salesReports.filter((r) => r.upsellRenewal === "Upsell").length,
          renewal: salesReports.filter((r) => r.upsellRenewal === "Renewal").length,
        }
      case "followup":
        return {
          total: followUpReports.length,
          done: followUpReports.filter((r) => r.status === "Done").length,
          pending: followUpReports.filter((r) => r.status === "Pending").length,
          failed: followUpReports.filter((r) => r.status === "Failed").length,
          totalAttempts: followUpReports.reduce((sum, r) => sum + r.attempts, 0),
        }
      case "activation":
        return {
          total: activationReports.length,
          active: activationReports.filter((r) => r.leftDays > 0).length,
          expired: activationReports.filter((r) => r.leftDays <= 0).length,
          expiringSoon: activationReports.filter((r) => r.leftDays > 0 && r.leftDays <= 30).length,
        }
      case "expiry":
        return {
          total: expiryReports.length,
          active: expiryReports.filter((r) => r.leftDays > 0).length,
          expired: expiryReports.filter((r) => r.leftDays <= 0).length,
          renewalDue: expiryReports.filter((r) => r.leftDays > 0 && r.leftDays <= 30).length,
        }
      case "renewal":
        return {
          total: renewalReports.length,
          thisMonth: renewalReports.filter((r) => r.leftDays > 0 && r.leftDays <= 30).length,
          nextMonth: renewalReports.filter((r) => r.leftDays > 30 && r.leftDays <= 60).length,
          overdue: renewalReports.filter((r) => r.leftDays <= 0).length,
        }
      case "freezing":
        return {
          total: freezingReports.length,
          active: freezingReports.filter((r) => r.frozenDays > 0).length,
          completed: freezingReports.filter((r) => r.reason === "Processed").length,
          pending: freezingReports.filter((r) => r.reason === "Pending Review").length,
          totalFrozenDays: freezingReports.reduce((sum, r) => sum + r.frozenDays, 0),
        }
      case "appointments":
        return {
          total: appointmentReports.length,
          successful: appointmentReports.filter((r) => r.appointmentStatus === "Successful").length,
          failed: appointmentReports.filter((r) => r.appointmentStatus === "Failed").length,
          scheduled: appointmentReports.filter((r) => r.appointmentStatus === "Scheduled").length,
          totalAttempts: appointmentReports.reduce((sum, r) => sum + r.attempts, 0),
        }
      case "referral":
        return {
          total: referralReports.length,
          converted: referralReports.filter((r) => r.leadStatus === "Converted").length,
          pending: referralReports.filter((r) => r.leadStatus === "New" || r.leadStatus === "Contacted").length,
          lost: referralReports.filter((r) => r.leadStatus === "Lost").length,
          uniqueReferrers: new Set(referralReports.map(r => r.referredBy)).size,
        }
      default:
        return {}
    }
  }

  const reportDataInfo = getReportData()
  const reportData = reportDataInfo.data
  const stats = getReportStats()

  // Pagination navigation functions
  const goToFirstPage = () => setCurrentPage(1)
  const goToPreviousPage = () => setCurrentPage(Math.max(1, currentPage - 1))
  const goToNextPage = () => setCurrentPage(Math.min(reportDataInfo.totalPages, currentPage + 1))
  const goToLastPage = () => setCurrentPage(reportDataInfo.totalPages)
  const goToPage = (page: number) => setCurrentPage(Math.max(1, Math.min(reportDataInfo.totalPages, page)))

  // Export to CSV function
  const exportToCSV = () => {
    let allFilteredData = []
    
    switch (activeReport) {
      case "balance":
        allFilteredData = getFilteredAndSortedData(balanceReports, ["clientName", "contact", "package", "counselor"])
        break
      case "sales":
        allFilteredData = getFilteredAndSortedData(salesReports, ["clientName", "contact", "package", "counselor", "source", "city"])
        break
      case "activation":
        allFilteredData = getFilteredAndSortedData(activationReports, ["clientName", "contact", "package", "counselor"])
        break
      case "expiry":
        allFilteredData = getFilteredAndSortedData(expiryReports, ["clientName", "contact", "package", "counselor", "renewalStatus"])
        break
      case "renewal":
        allFilteredData = getFilteredAndSortedData(renewalReports, ["clientName", "contact", "package", "counselor", "renewalMonth"])
        break
      case "freezing":
        allFilteredData = getFilteredAndSortedData(freezingReports, ["clientName", "contact", "package", "counselor", "reason"])
        break
      case "followup":
        allFilteredData = getFilteredAndSortedData(followUpReports, ["name", "contact", "counselor", "source", "status"])
        break
      case "appointments":
        allFilteredData = getFilteredAndSortedData(appointmentReports, ["name", "contact", "counselor", "bde", "source", "appointmentStatus"])
        break
      case "referral":
        allFilteredData = getFilteredAndSortedData(referralReports, ["name", "contact", "counselor", "referredBy", "leadStatus"])
        break
      default:
        allFilteredData = []
    }

    if (allFilteredData.length === 0) return

    const headers = Object.keys(allFilteredData[0]).join(",")
    const csvContent = [
      headers,
      ...allFilteredData.map((row) =>
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
              { key: "activation", label: "Membership Activation", icon: CheckCircle },
              { key: "expiry", label: "Membership Expiry", icon: AlertTriangle },
              { key: "renewal", label: "Renewal Reports", icon: RefreshCw },
              { key: "freezing", label: "Freezing Reports", icon: Snowflake },
              { key: "followup", label: "Follow Up Reports", icon: Phone },
              { key: "appointments", label: "Appointments", icon: CalendarIcon },
              { key: "referral", label: "Referral Reports", icon: Users },
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
                      <SelectItem value="done">Done</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </>
                  )}
                  {activeReport === "activation" && (
                    <>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </>
                  )}
                  {activeReport === "expiry" && (
                    <>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="renewal due">Renewal Due</SelectItem>
                    </>
                  )}
                  {activeReport === "freezing" && (
                    <>
                      <SelectItem value="processed">Processed</SelectItem>
                      <SelectItem value="pending review">Pending Review</SelectItem>
                    </>
                  )}
                  {activeReport === "appointments" && (
                    <>
                      <SelectItem value="successful">Successful</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                    </>
                  )}
                  {activeReport === "referral" && (
                    <>
                      <SelectItem value="converted">Converted</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
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
                {typeof value === "number" && (key.includes("total") || key.includes("Revenue") || key.includes("Balance"))
                  ? `₹${value.toLocaleString()}`
                  : value}
              </div>
              <p className="text-xs text-slate-600">
                {key === "total" ? "Total records" : 
                 key === "conversionRate" ? "Success rate" :
                 key.includes("total") && key !== "total" ? "Total amount" : "Count"}
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
            {activeReport.charAt(0).toUpperCase() + activeReport.slice(1)} Report 
            <span className="text-sm font-normal text-slate-500">
              ({reportDataInfo.totalItems} total records{reportDataInfo.totalItems > itemsPerPage ? `, showing ${reportDataInfo.startIndex}-${reportDataInfo.endIndex}` : ''})
            </span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={itemsPerPage.toString()} onValueChange={(value) => {
              setItemsPerPage(Number(value))
              setCurrentPage(1)
            }}>
              <SelectTrigger className="w-20 border-emerald-200 hover:border-emerald-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-transparent"
              onClick={exportToCSV}
              disabled={loading || reportDataInfo.totalItems === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              <span className="ml-2 text-emerald-600">Loading data...</span>
            </div>
          ) : reportDataInfo.totalItems === 0 ? (
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
                  {/* Balance Report Headers */}
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
                      <TableHead>Contact #</TableHead>
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
                          onClick={() => handleSort("dueDays")}
                          className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                        >
                          Due Days
                          {getSortIcon("dueDays")}
                        </Button>
                      </TableHead>
                      <TableHead>Counselor</TableHead>
                      <TableHead>Coach</TableHead>
                    </>
                  )}

                  {/* Sales Report Headers */}
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
                      <TableHead>Client</TableHead>
                      <TableHead>Contact #</TableHead>
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
                      <TableHead>Upsell/Renewal</TableHead>
                      <TableHead>Counselor</TableHead>
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
                      <TableHead>City</TableHead>
                      <TableHead>Source</TableHead>
                    </>
                  )}

                  {/* Membership Activation Headers */}
                  {activeReport === "activation" && (
                    <>
                      <TableHead>Client Name</TableHead>
                      <TableHead>Contact #</TableHead>
                      <TableHead>Package</TableHead>
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
                      <TableHead>Activation Date</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("leftDays")}
                          className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                        >
                          Left Days
                          {getSortIcon("leftDays")}
                        </Button>
                      </TableHead>
                      <TableHead>Counselor</TableHead>
                      <TableHead>Coach</TableHead>
                    </>
                  )}

                  {/* Membership Expiry Headers */}
                  {activeReport === "expiry" && (
                    <>
                      <TableHead>Client Name</TableHead>
                      <TableHead>Contact #</TableHead>
                      <TableHead>Package</TableHead>
                      <TableHead>Joining Date</TableHead>
                      <TableHead>Activation Date</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("leftDays")}
                          className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                        >
                          Left Days
                          {getSortIcon("leftDays")}
                        </Button>
                      </TableHead>
                      <TableHead>Counselor</TableHead>
                      <TableHead>Coach</TableHead>
                      <TableHead>Renewal Status</TableHead>
                    </>
                  )}

                  {/* Renewal Report Headers */}
                  {activeReport === "renewal" && (
                    <>
                      <TableHead>Client Name</TableHead>
                      <TableHead>Contact #</TableHead>
                      <TableHead>Package</TableHead>
                      <TableHead>Joining Date</TableHead>
                      <TableHead>Activation Date</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("leftDays")}
                          className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                        >
                          Left Days
                          {getSortIcon("leftDays")}
                        </Button>
                      </TableHead>
                      <TableHead>Counselor</TableHead>
                      <TableHead>Coach</TableHead>
                      <TableHead>Renewal Month</TableHead>
                    </>
                  )}

                  {/* Freezing Report Headers */}
                  {activeReport === "freezing" && (
                    <>
                      <TableHead>Client Name</TableHead>
                      <TableHead>Contact #</TableHead>
                      <TableHead>Package</TableHead>
                      <TableHead>Activation Date</TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("frozenDays")}
                          className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                        >
                          Frozen Days
                          {getSortIcon("frozenDays")}
                        </Button>
                      </TableHead>
                      <TableHead>Updated Expiry Date</TableHead>
                      <TableHead>Counselor</TableHead>
                      <TableHead>Coach</TableHead>
                      <TableHead>Reason</TableHead>
                    </>
                  )}

                  {/* Follow-up Report Headers */}
                  {activeReport === "followup" && (
                    <>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact #</TableHead>
                      <TableHead>Counselor</TableHead>
                      <TableHead>Last Contact</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Lead Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Follow Up Date</TableHead>
                      <TableHead>Attempts</TableHead>
                    </>
                  )}

                  {/* Appointment Report Headers */}
                  {activeReport === "appointments" && (
                    <>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact #</TableHead>
                      <TableHead>Counselor</TableHead>
                      <TableHead>BDE</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Lead Date</TableHead>
                      <TableHead>Follow Up Date</TableHead>
                      <TableHead>Attempts</TableHead>
                      <TableHead>Status</TableHead>
                    </>
                  )}

                  {/* Referral Report Headers */}
                  {activeReport === "referral" && (
                    <>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact #</TableHead>
                      <TableHead>Referred By</TableHead>
                      <TableHead>Referrer's #</TableHead>
                      <TableHead>Counselor</TableHead>
                      <TableHead>Lead Date</TableHead>
                      <TableHead>Lead Status</TableHead>
                      <TableHead>Follow Up Date</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.map((item, index) => (
                  <TableRow key={index} className="hover:bg-emerald-50/50">
                    {/* Balance Report Rows */}
                    {activeReport === "balance" && (
                      <>
                        <TableCell className="font-medium">{item.clientName}</TableCell>
                        <TableCell>{item.contact}</TableCell>
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
                          ) : (
                            <span className="text-emerald-600 font-medium">Paid</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3 text-slate-500" />
                            <span className={item.dueDays < 0 ? "text-red-600 font-medium" : ""}>
                              {item.dueDate !== "Not Set" ? new Date(item.dueDate).toLocaleDateString() : "Not Set"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              item.dueDays < 0
                                ? "bg-red-100 text-red-700 border-red-200"
                                : item.dueDays <= 7
                                  ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                                  : "bg-emerald-100 text-emerald-700 border-emerald-200"
                            }
                          >
                            {item.dueDays} days
                          </Badge>
                        </TableCell>
                        <TableCell>{item.counselor}</TableCell>
                        <TableCell>{item.coach}</TableCell>
                      </>
                    )}

                    {/* Sales Report Rows */}
                    {activeReport === "sales" && (
                      <>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3 text-emerald-600" />
                            {format(new Date(item.date), "LLL dd, yyyy")}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{item.clientName}</TableCell>
                        <TableCell>{item.contact}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                            {item.package}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-emerald-600">
                          <div className="flex items-center gap-1">₹{item.amount.toLocaleString()}</div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              item.upsellRenewal === "Upsell"
                                ? "bg-purple-100 text-purple-700 border-purple-200"
                                : item.upsellRenewal === "Renewal"
                                  ? "bg-blue-100 text-blue-700 border-blue-200"
                                  : "bg-green-100 text-green-700 border-green-200"
                            }
                          >
                            {item.upsellRenewal}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.counselor}</TableCell>
                        <TableCell>
                          {item.balance > 0 ? (
                            <span className="text-red-600 font-medium">₹{item.balance.toLocaleString()}</span>
                          ) : (
                            <span className="text-emerald-600">Paid</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-slate-200 text-slate-700">
                            {item.city}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-blue-200 text-blue-700">
                            {item.source}
                          </Badge>
                        </TableCell>
                      </>
                    )}

                    {/* Membership Activation Rows */}
                    {activeReport === "activation" && (
                      <>
                        <TableCell className="font-medium">{item.clientName}</TableCell>
                        <TableCell>{item.contact}</TableCell>
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
                            {format(new Date(item.activationDate), "LLL dd, yyyy")}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3 text-slate-500" />
                            {item.expiryDate !== "Not Set" ? format(new Date(item.expiryDate), "LLL dd, yyyy") : "Not Set"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              item.leftDays <= 0
                                ? "bg-red-100 text-red-700 border-red-200"
                                : item.leftDays <= 30
                                  ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                                  : "bg-emerald-100 text-emerald-700 border-emerald-200"
                            }
                          >
                            {item.leftDays} days
                          </Badge>
                        </TableCell>
                        <TableCell>{item.counselor}</TableCell>
                        <TableCell>{item.coach}</TableCell>
                      </>
                    )}

                    {/* Membership Expiry Rows */}
                    {activeReport === "expiry" && (
                      <>
                        <TableCell className="font-medium">{item.clientName}</TableCell>
                        <TableCell>{item.contact}</TableCell>
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
                            {format(new Date(item.activationDate), "LLL dd, yyyy")}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3 text-slate-500" />
                            <span className={item.leftDays <= 0 ? "text-red-600 font-medium" : ""}>
                              {format(new Date(item.expiryDate), "LLL dd, yyyy")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              item.leftDays <= 0
                                ? "bg-red-100 text-red-700 border-red-200"
                                : item.leftDays <= 30
                                  ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                                  : "bg-emerald-100 text-emerald-700 border-emerald-200"
                            }
                          >
                            {item.leftDays} days
                          </Badge>
                        </TableCell>
                        <TableCell>{item.counselor}</TableCell>
                        <TableCell>{item.coach}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              item.renewalStatus === "Expired"
                                ? "bg-red-100 text-red-700 border-red-200"
                                : item.renewalStatus === "Renewal Due"
                                  ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                                  : item.renewalStatus === "Upcoming Renewal"
                                    ? "bg-blue-100 text-blue-700 border-blue-200"
                                    : "bg-emerald-100 text-emerald-700 border-emerald-200"
                            }
                          >
                            {item.renewalStatus}
                          </Badge>
                        </TableCell>
                      </>
                    )}

                    {/* Renewal Report Rows */}
                    {activeReport === "renewal" && (
                      <>
                        <TableCell className="font-medium">{item.clientName}</TableCell>
                        <TableCell>{item.contact}</TableCell>
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
                            {format(new Date(item.activationDate), "LLL dd, yyyy")}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3 text-slate-500" />
                            <span className={item.leftDays <= 0 ? "text-red-600 font-medium" : ""}>
                              {format(new Date(item.expiryDate), "LLL dd, yyyy")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              item.leftDays <= 0
                                ? "bg-red-100 text-red-700 border-red-200"
                                : item.leftDays <= 30
                                  ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                                  : "bg-emerald-100 text-emerald-700 border-emerald-200"
                            }
                          >
                            {item.leftDays} days
                          </Badge>
                        </TableCell>
                        <TableCell>{item.counselor}</TableCell>
                        <TableCell>{item.coach}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-purple-200 text-purple-700">
                            {item.renewalMonth}
                          </Badge>
                        </TableCell>
                      </>
                    )}

                    {/* Freezing Report Rows */}
                    {activeReport === "freezing" && (
                      <>
                        <TableCell className="font-medium">{item.clientName}</TableCell>
                        <TableCell>{item.contact}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-blue-200 text-blue-700">
                            {item.package}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3 text-slate-500" />
                            {item.activationDate !== "N/A" ? format(new Date(item.activationDate), "LLL dd, yyyy") : "N/A"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                            {item.frozenDays} days
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3 text-slate-500" />
                            {item.updatedExpiryDate !== "Not Set" ? format(new Date(item.updatedExpiryDate), "LLL dd, yyyy") : "Not Set"}
                          </div>
                        </TableCell>
                        <TableCell>{item.counselor}</TableCell>
                        <TableCell>{item.coach}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              item.reason === "Processed"
                                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                : "bg-yellow-100 text-yellow-700 border-yellow-200"
                            }
                          >
                            {item.reason}
                          </Badge>
                        </TableCell>
                      </>
                    )}

                    {/* Follow-up Report Rows */}
                    {activeReport === "followup" && (
                      <>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.contact}</TableCell>
                        <TableCell>{item.counselor}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3 text-slate-500" />
                            {format(new Date(item.lastContact), "LLL dd, yyyy")}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                            {item.source}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3 text-slate-500" />
                            {format(new Date(item.leadDate), "LLL dd, yyyy")}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              item.status === "Done"
                                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                : item.status === "Failed"
                                  ? "bg-red-100 text-red-700 border-red-200"
                                  : "bg-yellow-100 text-yellow-700 border-yellow-200"
                            }
                          >
                            {item.status === "Done" ? (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            ) : item.status === "Failed" ? (
                              <XCircle className="h-3 w-3 mr-1" />
                            ) : (
                              <Clock className="h-3 w-3 mr-1" />
                            )}
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3 text-emerald-600" />
                            {item.followUpDate !== "Not Set" ? format(new Date(item.followUpDate), "LLL dd, yyyy") : "Not Set"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-blue-200 text-blue-700">
                            {item.attempts}
                          </Badge>
                        </TableCell>
                      </>
                    )}

                    {/* Appointment Report Rows */}
                    {activeReport === "appointments" && (
                      <>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.contact}</TableCell>
                        <TableCell>{item.counselor}</TableCell>
                        <TableCell>{item.bde}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                            {item.source}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3 text-slate-500" />
                            {format(new Date(item.leadDate), "LLL dd, yyyy")}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3 text-emerald-600" />
                            {item.followUpDate !== "Not Set" ? format(new Date(item.followUpDate), "LLL dd, yyyy") : "Not Set"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-blue-200 text-blue-700">
                            {item.attempts}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              item.appointmentStatus === "Successful"
                                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                : item.appointmentStatus === "Failed"
                                  ? "bg-red-100 text-red-700 border-red-200"
                                  : "bg-yellow-100 text-yellow-700 border-yellow-200"
                            }
                          >
                            {item.appointmentStatus === "Successful" ? (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            ) : item.appointmentStatus === "Failed" ? (
                              <XCircle className="h-3 w-3 mr-1" />
                            ) : (
                              <Clock className="h-3 w-3 mr-1" />
                            )}
                            {item.appointmentStatus}
                          </Badge>
                        </TableCell>
                      </>
                    )}

                    {/* Referral Report Rows */}
                    {activeReport === "referral" && (
                      <>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.contact}</TableCell>
                        <TableCell>{item.referredBy}</TableCell>
                        <TableCell>{item.referrerContact}</TableCell>
                        <TableCell>{item.counselor}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3 text-slate-500" />
                            {format(new Date(item.leadDate), "LLL dd, yyyy")}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              item.leadStatus === "Converted"
                                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                : item.leadStatus === "Lost"
                                  ? "bg-red-100 text-red-700 border-red-200"
                                  : "bg-yellow-100 text-yellow-700 border-yellow-200"
                            }
                          >
                            {item.leadStatus === "Converted" ? (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            ) : item.leadStatus === "Lost" ? (
                              <XCircle className="h-3 w-3 mr-1" />
                            ) : (
                              <Clock className="h-3 w-3 mr-1" />
                            )}
                            {item.leadStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3 text-emerald-600" />
                            {item.followUpDate !== "Not Set" ? format(new Date(item.followUpDate), "LLL dd, yyyy") : "Not Set"}
                          </div>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination Controls */}
          {!loading && reportDataInfo.totalItems > 0 && reportDataInfo.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span>
                  Showing {reportDataInfo.startIndex} to {reportDataInfo.endIndex} of {reportDataInfo.totalItems} results
                </span>
              </div>
              
              <div className="flex items-center gap-1">
                {/* First Page */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToFirstPage}
                  disabled={currentPage === 1}
                  className="border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                
                {/* Previous Page */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, reportDataInfo.totalPages) }, (_, i) => {
                    let pageNum
                    if (reportDataInfo.totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= reportDataInfo.totalPages - 2) {
                      pageNum = reportDataInfo.totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToPage(pageNum)}
                        className={
                          currentPage === pageNum
                            ? "bg-emerald-600 hover:bg-emerald-700"
                            : "border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50"
                        }
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                
                {/* Next Page */}
                <Button
                  variant="outline" 
                  size="sm"
                  onClick={goToNextPage}
                  disabled={currentPage === reportDataInfo.totalPages}
                  className="border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                
                {/* Last Page */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToLastPage}
                  disabled={currentPage === reportDataInfo.totalPages}
                  className="border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}