"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Badge } from "./ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { Label } from "./ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Calendar } from "./ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import {
  Search,
  Plus,
  Phone,
  Users,
  CalendarDays,
  DollarSign,
  AlertTriangle,
  Filter,
  Edit,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  User,
  Loader2,
  UserCheck,
  IndianRupee,
} from "lucide-react"
import { format } from "date-fns"
import type { DateRange } from "react-day-picker"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Types
interface Coach {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  created_at: string;
  is_active: boolean;
  totalAmountPaid: number;
  latestExpiryDate: string | null;
  status: 'Active' | 'Inactive' | 'Expired';
  assignedCoach: Coach | null;
  hasWorkoutAssignment: boolean;
}

type SortField =
  | "name"
  | "phone"
  | "created_at"
  | "latestExpiryDate"
  | "totalAmountPaid"
  | "coach"
type SortDirection = "asc" | "desc" | null

const STATIC_ROLE_ID = '3b9aeecb-3f68-434e-bc63-4f30f7bde8f1'; // Replace with actual client role ID

export function ClientsTab() {
  // State
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [balanceFilter, setBalanceFilter] = useState("all")
  const [joiningDateRange, setJoiningDateRange] = useState<DateRange | undefined>()
  const [expiryDateRange, setExpiryDateRange] = useState<DateRange | undefined>()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  
  // Edit functionality state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [editFormData, setEditFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: ''
  })

  const supabase = createClientComponentClient()

  // Fetch clients data
  useEffect(() => {
    fetchClients()
  }, [])

const fetchClients = async () => {
  try {
    setLoading(true)
    setError(null)

    // 1. Fetch users with client role
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
      .eq('role_id', STATIC_ROLE_ID)
      .order('created_at', { ascending: false })

    if (userErr) {
      console.error('User fetch error:', userErr)
      throw userErr
    }

    // ─────── Executive-only filter ───────
    const { id: currentUserId, role_id: currentRoleId } = JSON.parse(
      localStorage.getItem('userProfile') || '{}'
    )
    const EXECUTIVE_ROLE = '1fe1759c-dc14-4933-947a-c240c046bcde'

    if (currentRoleId === EXECUTIVE_ROLE) {
      // a) get all lead_ids assigned to this Executive
      const { data: leadAssignments, error: laErr } = await supabase
        .from('lead_assignments')
        .select('lead_id')
        .eq('assigned_to', currentUserId)
      if (laErr) {
        console.error('Lead‐assignments fetch error:', laErr)
        throw laErr
      }

      const leadIds = leadAssignments.map((a) => a.lead_id)
      if (leadIds.length) {
        // b) fetch those leads to pull their emails
        const { data: leadsData, error: lErr } = await supabase
          .from('leads')
          .select('email')
          .in('id', leadIds)
        if (lErr) {
          console.error('Leads fetch error:', lErr)
          throw lErr
        }

        const assignedEmails = leadsData.map((l) => l.email)
        // c) filter userData down to only those emails
        userData = userData.filter((u) =>
          assignedEmails.includes(u.email)
        )
      } else {
        // no assignments → show no one
        userData = []
      }
    }
    // ────────────────────────────────────────

    // nothing to do if no clients
    if (!userData || userData.length === 0) {
      setClients([])
      setLoading(false)
      return
    }

    // pull all matching user IDs
    const userIds = userData.map(u => u.id)

    // 2. Fetch payment data in bulk
    const [manualPaymentsResult, paymentLinksResult] = await Promise.all([
      supabase
        .from('manual_payment')
        .select('user_id, amount, plan_expiry, payment_date')
        .in('user_id', userIds)
        .eq('status', 'completed'),
      supabase
        .from('payment_links')
        .select('user_id, amount, plan_expiry, created_at')
        .in('user_id', userIds)
        .eq('status', 'completed')
    ])

    // 3. Fetch coach & workout assignments
    const [coachAssignments, workoutAssignments] = await Promise.all([
      supabase
        .from('client_coach_relationships')
        .select('client_id, coach_id')
        .in('client_id', userIds)
        .eq('status', 'active'),
      supabase
        .from('workout_assignments')
        .select('user_id')
        .in('user_id', userIds)
    ])

    // 4. Fetch coach details
    const coachIds = (coachAssignments.data || []).map(c => c.coach_id).filter(Boolean)
    const uniqueCoachIds = Array.from(new Set(coachIds))
    let coachesData: Coach[] = []
    if (uniqueCoachIds.length) {
      const { data: coaches, error: coachErr } = await supabase
        .from('users')
        .select('id, first_name, last_name, email')
        .in('id', uniqueCoachIds)
      if (coachErr) {
        console.error('Coach fetch error:', coachErr)
      } else {
        coachesData = coaches || []
      }
    }

    // Process payments into totals & expiry maps
    const paymentTotalsMap = new Map<string, number>()
    const planExpiryMap    = new Map<string, Date>()
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

    // Build lookup maps
    const coachAssignmentMap = new Map(
      (coachAssignments.data || []).map(c => [c.client_id, c.coach_id] as const)
    )
    const coachesMap = new Map(coachesData.map(c => [c.id, c] as const))
    const hasWorkout = new Set((workoutAssignments.data || []).map(w => w.user_id))

    // Stitch together final Client[]
    const processed: Client[] = userData.map(user => {
      const totalPaid = paymentTotalsMap.get(user.id) || 0
      const expiry    = planExpiryMap.get(user.id)
      let   status: Client['status'] = 'Inactive'
      if (user.is_active) {
        status = expiry
          ? expiry > new Date() ? 'Active' : 'Expired'
          : 'Inactive'
      }
      const coachId = coachAssignmentMap.get(user.id)
      const assignedCoach = coachId ? coachesMap.get(coachId) || null : null

      return {
        id: user.id,
        first_name: user.first_name || '',
        last_name:  user.last_name  || '',
        email:      user.email      || '',
        phone:      user.phone      || '',
        created_at: user.created_at,
        is_active:  user.is_active,
        totalAmountPaid:  totalPaid,
        latestExpiryDate: expiry?.toISOString().split('T')[0] || null,
        status,
        assignedCoach,
        hasWorkoutAssignment: hasWorkout.has(user.id)
      }
    })

    setClients(processed)
  } catch (err) {
    console.error('Error fetching clients:', err)
    setError('Failed to fetch client data')
  } finally {
    setLoading(false)
  }
}


  // Sorting handlers
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

  // Edit functionality handlers
  const handleEditClient = (client: Client) => {
    setEditingClient(client)
    setEditFormData({
      first_name: client.first_name,
      last_name: client.last_name,
      email: client.email,
      phone: client.phone
    })
    setIsEditDialogOpen(true)
  }

  const handleEditFormChange = (field: string, value: string) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSaveEdit = async () => {
    if (!editingClient) return

    try {
      // Update client in database
      const { error } = await supabase
        .from('users')
        .update({
          first_name: editFormData.first_name,
          last_name: editFormData.last_name,
          email: editFormData.email,
          phone: editFormData.phone
        })
        .eq('id', editingClient.id)

      if (error) {
        console.error('Error updating client:', error)
        alert('Failed to update client')
        return
      }

      // Refresh the clients data
      await fetchClients()
      
      // Close the dialog and reset form
      setIsEditDialogOpen(false)
      setEditingClient(null)
      setEditFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: ''
      })

      alert('Client updated successfully!')
    } catch (err) {
      console.error('Error updating client:', err)
      alert('Failed to update client')
    }
  }

  const handleCancelEdit = () => {
    setIsEditDialogOpen(false)
    setEditingClient(null)
    setEditFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: ''
    })
  }

  // Filtered and sorted clients
  const filteredAndSortedClients = useMemo(() => {
    const filtered = clients.filter((client) => {
      const fullName = `${client.first_name} ${client.last_name}`.toLowerCase()
      const matchesSearch =
        fullName.includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone.includes(searchTerm)

      const matchesStatus = statusFilter === "all" || client.status.toLowerCase() === statusFilter

      const matchesBalance =
        balanceFilter === "all" ||
        (balanceFilter === "paid" && client.totalAmountPaid > 0) ||
        (balanceFilter === "pending" && client.totalAmountPaid === 0)

      // Joining date range filter
      let matchesJoiningDateRange = true
      if (joiningDateRange?.from || joiningDateRange?.to) {
        const joiningDate = new Date(client.created_at)
        if (joiningDateRange.from && joiningDateRange.to) {
          matchesJoiningDateRange = joiningDate >= joiningDateRange.from && joiningDate <= joiningDateRange.to
        } else if (joiningDateRange.from) {
          matchesJoiningDateRange = joiningDate >= joiningDateRange.from
        } else if (joiningDateRange.to) {
          matchesJoiningDateRange = joiningDate <= joiningDateRange.to
        }
      }

      // Expiry date range filter
      let matchesExpiryDateRange = true
      if ((expiryDateRange?.from || expiryDateRange?.to) && client.latestExpiryDate) {
        const expiryDate = new Date(client.latestExpiryDate)
        if (expiryDateRange.from && expiryDateRange.to) {
          matchesExpiryDateRange = expiryDate >= expiryDateRange.from && expiryDate <= expiryDateRange.to
        } else if (expiryDateRange.from) {
          matchesExpiryDateRange = expiryDate >= expiryDateRange.from
        } else if (expiryDateRange.to) {
          matchesExpiryDateRange = expiryDate <= expiryDateRange.to
        }
      }

      return (
        matchesSearch &&
        matchesStatus &&
        matchesBalance &&
        matchesJoiningDateRange &&
        matchesExpiryDateRange
      )
    })

    // Apply sorting
    if (sortField && sortDirection) {
      filtered.sort((a, b) => {
        let aValue: string | number | Date
        let bValue: string | number | Date

        switch (sortField) {
          case "name":
            aValue = `${a.first_name} ${a.last_name}`.toLowerCase()
            bValue = `${b.first_name} ${b.last_name}`.toLowerCase()
            break
          case "created_at":
            aValue = new Date(a.created_at)
            bValue = new Date(b.created_at)
            break
          case "latestExpiryDate":
            aValue = a.latestExpiryDate ? new Date(a.latestExpiryDate) : new Date(0)
            bValue = b.latestExpiryDate ? new Date(b.latestExpiryDate) : new Date(0)
            break
          case "totalAmountPaid":
            aValue = a.totalAmountPaid
            bValue = b.totalAmountPaid
            break
          case "phone":
            aValue = a.phone.toLowerCase()
            bValue = b.phone.toLowerCase()
            break
          case "coach":
            aValue = a.assignedCoach ? `${a.assignedCoach.first_name} ${a.assignedCoach.last_name}`.toLowerCase() : ""
            bValue = b.assignedCoach ? `${b.assignedCoach.first_name} ${b.assignedCoach.last_name}`.toLowerCase() : ""
            break
          default:
            aValue = a[sortField]
            bValue = b[sortField]
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
  }, [
    clients,
    searchTerm,
    statusFilter,
    balanceFilter,
    joiningDateRange,
    expiryDateRange,
    sortField,
    sortDirection,
  ])

  // Calculate stats
  const stats = useMemo(() => {
    const total = clients.length
    const active = clients.filter((c) => c.status === "Active").length
    const expired = clients.filter((c) => c.status === "Expired").length
    const inactive = clients.filter((c) => c.status === "Inactive").length
    const totalRevenue = clients.reduce((sum, c) => sum + c.totalAmountPaid, 0)
    const paidClients = clients.filter(c => c.totalAmountPaid > 0).length
    
    const expiringThisMonth = clients.filter((c) => {
      if (!c.latestExpiryDate) return false
      const expiry = new Date(c.latestExpiryDate)
      const now = new Date()
      const thisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      return expiry <= thisMonth && expiry >= now
    }).length

    const avgClientValue = total > 0 ? Math.round(totalRevenue / total) : 0

    return {
      total,
      active,
      expired,
      inactive,
      totalRevenue,
      paidClients,
      expiringThisMonth,
      avgClientValue,
    }
  }, [clients])

  // Top paying clients
  const topPayingClients = useMemo(() => {
    return [...clients]
      .sort((a, b) => b.totalAmountPaid - a.totalAmountPaid)
      .slice(0, 5)
  }, [clients])

  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setBalanceFilter("all")
    setJoiningDateRange(undefined)
    setExpiryDateRange(undefined)
    setSortField(null)
    setSortDirection(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <span className="ml-2 text-lg">Loading clients...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-700 mb-2">Error Loading Clients</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchClients} className="bg-emerald-600 hover:bg-emerald-700">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Filters */}
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-700">
            <Filter className="h-5 w-5" />
            Advanced Client Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Search Clients</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by name, email, phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-emerald-200 hover:border-emerald-300"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Joining Date Range</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal border-emerald-200 hover:border-emerald-300"
                  >
                    <CalendarDays className="mr-2 h-4 w-4 text-emerald-600" />
                    {joiningDateRange?.from ? (
                      joiningDateRange.to ? (
                        <>
                          {format(joiningDateRange.from, "LLL dd, y")} - {format(joiningDateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(joiningDateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick joining date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={joiningDateRange?.from}
                    selected={joiningDateRange}
                    onSelect={setJoiningDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Expiry Date Range</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal border-emerald-200 hover:border-emerald-300"
                  >
                    <CalendarDays className="mr-2 h-4 w-4 text-emerald-600" />
                    {expiryDateRange?.from ? (
                      expiryDateRange.to ? (
                        <>
                          {format(expiryDateRange.from, "LLL dd, y")} - {format(expiryDateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(expiryDateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick expiry date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={expiryDateRange?.from}
                    selected={expiryDateRange}
                    onSelect={setExpiryDateRange}
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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Payment Status</label>
              <Select value={balanceFilter} onValueChange={setBalanceFilter}>
                <SelectTrigger className="border-emerald-200 hover:border-emerald-300">
                  <SelectValue placeholder="All Payments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="paid">Has Payments</SelectItem>
                  <SelectItem value="pending">No Payments</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg">
                Apply Filters
              </Button>
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
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={fetchClients}
                className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                Refresh Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Client Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-green-50 hover:shadow-xl transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-emerald-700">
              <Users className="h-4 w-4" />
              Total Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.total}</div>
            <p className="text-xs text-slate-600">All registered clients</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50 hover:shadow-xl transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-700">
              <Users className="h-4 w-4" />
              Active Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
            <p className="text-xs text-slate-600">{stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(1) : 0}% active rate</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-orange-50 hover:shadow-xl transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-orange-700">
              <AlertTriangle className="h-4 w-4" />
              Inactive
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.inactive}</div>
            <p className="text-xs text-slate-600">Need attention</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-pink-50 hover:shadow-xl transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-4 w-4" />
              Expired
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
            <p className="text-xs text-slate-600">Need renewal</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50 hover:shadow-xl transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-purple-700">
              <IndianRupee className="h-4 w-4" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">₹{stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-slate-600">From all clients</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-xl transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-green-700">
              <Users className="h-4 w-4" />
              Paid Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.paidClients}</div>
            <p className="text-xs text-slate-600">Have made payments</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-teal-50 to-cyan-50 hover:shadow-xl transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-teal-700">
              <CalendarDays className="h-4 w-4" />
              Expiring Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-600">{stats.expiringThisMonth}</div>
            <p className="text-xs text-slate-600">This month</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-purple-50 hover:shadow-xl transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-indigo-700">
              <IndianRupee className="h-4 w-4" />
              Avg Client Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">₹{stats.avgClientValue.toLocaleString()}</div>
            <p className="text-xs text-slate-600">Average revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Client Management with Sorting */}
      <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-emerald-700">
            <Users className="h-5 w-5" />
            Client Management Dashboard ({filteredAndSortedClients.length} clients)
          </CardTitle>
          
          {/* Add Client Dialog */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg">
                <Plus className="h-4 w-4 mr-2" />
                Add Client
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-emerald-700">Add New Client</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" className="border-emerald-200" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" className="border-emerald-200" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" className="border-emerald-200" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" className="border-emerald-200" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  className="border-emerald-200 text-emerald-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => setIsAddDialogOpen(false)}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
                >
                  Add Client
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("name")}
                    className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                  >
                    Name
                    {getSortIcon("name")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("phone")}
                    className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                  >
                    Phone
                    {getSortIcon("phone")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("created_at")}
                    className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                  >
                    Joining Date
                    {getSortIcon("created_at")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("latestExpiryDate")}
                    className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                  >
                    Expiry Date
                    {getSortIcon("latestExpiryDate")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("totalAmountPaid")}
                    className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                  >
                    Total Paid
                    {getSortIcon("totalAmountPaid")}
                  </Button>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("coach")}
                    className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                  >
                    Assigned Coach
                    {getSortIcon("coach")}
                  </Button>
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedClients.map((client) => (
                <TableRow key={client.id} className="hover:bg-emerald-50/50">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs">
                          {`${client.first_name?.[0] || ''}${client.last_name?.[0] || ''}`.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold">{`${client.first_name} ${client.last_name}`.trim()}</div>
                        <div className="text-sm text-slate-500">{client.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3 text-emerald-600" />
                      {client.phone || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3 text-emerald-600" />
                      {format(new Date(client.created_at), 'MMM dd, yyyy')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3 text-slate-500" />
                      <span className={
                        client.latestExpiryDate && new Date(client.latestExpiryDate) < new Date() 
                          ? "text-red-600 font-medium" 
                          : ""
                      }>
                        {client.latestExpiryDate ? format(new Date(client.latestExpiryDate), 'MMM dd, yyyy') : 'N/A'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-emerald-600">
                    <div className="flex items-center gap-1">
                      <span className="text-sm">₹</span>
                      {client.totalAmountPaid.toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={`
                        ${client.status === 'Active' ? 'border-green-200 text-green-700 bg-green-50' : ''}
                        ${client.status === 'Expired' ? 'border-red-200 text-red-700 bg-red-50' : ''}
                        ${client.status === 'Inactive' ? 'border-gray-200 text-gray-700 bg-gray-50' : ''}
                      `}
                    >
                      {client.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {client.assignedCoach ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs">
                            {`${client.assignedCoach.first_name?.[0] || ''}${client.assignedCoach.last_name?.[0] || ''}`.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium">{`${client.assignedCoach.first_name} ${client.assignedCoach.last_name}`.trim()}</div>
                          <div className="text-xs text-slate-500">{client.assignedCoach.email}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-slate-500">
                        <UserCheck className="h-3 w-3" />
                        <span className="text-sm">No coach assigned</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClient(client)}
                        className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Client Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-emerald-700">Edit Client</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editFirstName">First Name</Label>
                <Input 
                  id="editFirstName" 
                  value={editFormData.first_name}
                  onChange={(e) => handleEditFormChange('first_name', e.target.value)}
                  className="border-emerald-200" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editLastName">Last Name</Label>
                <Input 
                  id="editLastName" 
                  value={editFormData.last_name}
                  onChange={(e) => handleEditFormChange('last_name', e.target.value)}
                  className="border-emerald-200" 
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editEmail">Email</Label>
                <Input 
                  id="editEmail" 
                  type="email" 
                  value={editFormData.email}
                  onChange={(e) => handleEditFormChange('email', e.target.value)}
                  className="border-emerald-200" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editPhone">Phone</Label>
                <Input 
                  id="editPhone" 
                  value={editFormData.phone}
                  onChange={(e) => handleEditFormChange('phone', e.target.value)}
                  className="border-emerald-200" 
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleCancelEdit}
              className="border-emerald-200 text-emerald-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Client Activity Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-50 to-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-700">
              <CalendarDays className="h-5 w-5" />
              Membership Expiry Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-white/70 rounded-lg backdrop-blur-sm">
                <span className="font-medium">Expiring This Month</span>
                <Badge className="bg-red-100 text-red-700 border-red-200">{stats.expiringThisMonth}</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/70 rounded-lg backdrop-blur-sm">
                <span className="font-medium">Expiring Next Month</span>
                <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
                  {
                    clients.filter((c) => {
                      if (!c.latestExpiryDate) return false
                      const expiry = new Date(c.latestExpiryDate)
                      const nextMonth = new Date()
                      nextMonth.setMonth(nextMonth.getMonth() + 1)
                      return expiry.getMonth() === nextMonth.getMonth() && expiry.getFullYear() === nextMonth.getFullYear()
                    }).length
                  }
                </Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/70 rounded-lg backdrop-blur-sm">
                <span className="font-medium">Already Expired</span>
                <Badge className="bg-red-100 text-red-700 border-red-200">
                  {clients.filter((c) => c.latestExpiryDate && new Date(c.latestExpiryDate) < new Date()).length}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <IndianRupee className="h-5 w-5" />
              Top Paying Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPayingClients.map((client, index) => (
                <div
                  key={client.id}
                  className="flex justify-between items-center p-3 bg-white/70 rounded-lg backdrop-blur-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                    <div>
                      <span className="font-medium">{`${client.first_name} ${client.last_name}`.trim()}</span>
                      <div className="text-sm text-slate-600">{client.email}</div>
                    </div>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                    ₹{client.totalAmountPaid.toLocaleString()}
                  </Badge>
                </div>
              ))}
              {topPayingClients.length === 0 && (
                <div className="text-center text-slate-500 py-4">
                  No payment data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}