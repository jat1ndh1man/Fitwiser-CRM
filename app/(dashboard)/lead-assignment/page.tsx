"use client"
import React from 'react'
import { useState, useEffect, useMemo, } from "react"
import { useRouter } from "next/navigation"
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Textarea } from "../../../components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table"
import { Badge } from "../../../components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs"
import { Alert, AlertDescription } from "../../../components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog"
import { toast } from "../../../components/ui/use-toast"
import {
  Search,
  UserPlus,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Clock,
  Users,
  AlertCircle,
  CheckCircle,
  Phone,
  Mail,
  MapPin,
  Star,
  RefreshCw,
  Loader2,
  TrendingUp,
  Target,
  Flame,
  Thermometer,
  Snowflake,
  Sparkles,
  AlertTriangle,
  Calendar,
  Activity,
  Award,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../../components/ui/dropdown-menu"
import { format, isValid, parseISO } from "date-fns"

// Supabase client setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface Lead {
  id: string
  created_at: string
  updated_at: string
  name: string
  email: string
  phone_number: string
  city?: string
  profession?: string
  status: 'New' | 'Hot' | 'Warm' | 'Cold' | 'Failed' | 'assigned' | 'contacted' | 'qualified' | 'converted'
  source?: 'Website' | 'Social Media' | 'Referral' | 'Cold Call'
  counselor?: string
  priority: 'High' | 'Medium' | 'Low'
  lead_score?: number
  conversion_probability?: number
  follow_up_date?: string
  last_activity_date?: string
  budget?: string
  timeline?: string
  notes?: string
}

interface Executive {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  profile_image_url?: string
  specialty?: string
  is_active: boolean
  created_at: string
  active_assignments?: number
  completed_assignments?: number
  performance_score?: number
}

interface LeadAssignment {
  id: string
  lead_id: string
  assigned_to: string
  assigned_by: string
  assigned_at: string
  status: 'active' | 'completed' | 'cancelled'
  priority: 'High' | 'Medium' | 'Low'
  notes?: string
  due_date?: string
  completed_at?: string
  created_at: string
  updated_at: string
  lead?: Lead
  executive?: Executive
  assigner?: Executive
}

interface AutoAssignmentConfig {
  id?: string
  is_enabled: boolean
  assignment_strategy: 'least_workload' | 'round_robin' | 'priority_based'
  max_assignments_per_executive: number
  consider_priority_matching: boolean
  blacklisted_executives: string[]
  priority_executives: string[]
  working_hours_only: boolean
  working_hours_start: string
  working_hours_end: string
  auto_assign_interval_minutes: number
  created_at?: string
  updated_at?: string
}

interface ExecutivePriority {
  executive_id: string
  priority_level: number // 1 = highest, 5 = lowest
  specialty_match: string[]
}

interface PaginationState {
  currentPage: number
  itemsPerPage: number
  totalItems: number
  totalPages: number
}

export default function LeadAssignmentTab() {
  const router = useRouter()
  const [activeView, setActiveView] = useState("overview")
  const [pendingLeads, setPendingLeads] = useState<Lead[]>([])
  const [executives, setExecutives] = useState<Executive[]>([])
  const [assignments, setAssignments] = useState<LeadAssignment[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [selectedExecutive, setSelectedExecutive] = useState<string | null>(null)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [selectedLead, setSelectedLeadForAssignment] = useState("")
  const [selectedExecutiveForAssignment, setSelectedExecutiveForAssignment] = useState("")
  const [assignmentNotes, setAssignmentNotes] = useState("")
  const [assignmentPriority, setAssignmentPriority] = useState("Medium")
  const [assignmentDueDate, setAssignmentDueDate] = useState("")
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const STRATEGY_HELP: Record<'least_workload' | 'round_robin' | 'priority_based', string> = {
  least_workload: 'Assigns to executives with the fewest active assignments',
  round_robin: 'Distributes leads evenly across all executives',
  priority_based: 'Prioritizes specific executives first',
};

  const [autoAssignConfig, setAutoAssignConfig] = useState<AutoAssignmentConfig>({
  is_enabled: false,
  assignment_strategy: 'least_workload',
  max_assignments_per_executive: 10,
  consider_priority_matching: false,
  blacklisted_executives: [],
  priority_executives: [],
  working_hours_only: false,
  working_hours_start: '09:00',
  working_hours_end: '17:00',
  auto_assign_interval_minutes: 30
})
const [isAutoAssignDialogOpen, setIsAutoAssignDialogOpen] = useState(false)
const [isAutoAssignmentRunning, setIsAutoAssignmentRunning] = useState(false)
const [autoAssignmentStats, setAutoAssignmentStats] = useState({
  last_run: null as string | null,
  assignments_today: 0,
  success_rate: 0,
  failed_assignments: 0
})

  // Pagination states
  const [pendingPagination, setPendingPagination] = useState<PaginationState>({
    currentPage: 1,
    itemsPerPage: 9, // 3x3 grid
    totalItems: 0,
    totalPages: 0
  })
  const [executivePagination, setExecutivePagination] = useState<PaginationState>({
    currentPage: 1,
    itemsPerPage: 6, // 2x3 grid
    totalItems: 0,
    totalPages: 0
  })
  const [assignmentPagination, setAssignmentPagination] = useState<PaginationState>({
    currentPage: 1,
    itemsPerPage: 10, // 10 rows per page
    totalItems: 0,
    totalPages: 0
  })

  // Executive role ID
  const executiveRoleId = "1fe1759c-dc14-4933-947a-c240c046bcde"

  // Helper function to safely format dates
  const safeFormatDate = (dateValue: string | null | undefined, formatString: string = 'MMM dd, yyyy'): string => {
    if (!dateValue) return 'N/A'
    
    try {
      const date = typeof dateValue === 'string' ? parseISO(dateValue) : new Date(dateValue)
      if (!isValid(date)) return 'Invalid Date'
      return format(date, formatString)
    } catch (error) {
      console.warn('Error formatting date:', dateValue, error)
      return 'Invalid Date'
    }
  }

  // Helper function to safely parse dates for comparisons
  const safeParseDateForComparison = (dateValue: string | null | undefined): Date | null => {
    if (!dateValue) return null
    
    try {
      const date = typeof dateValue === 'string' ? parseISO(dateValue) : new Date(dateValue)
      return isValid(date) ? date : null
    } catch {
      return null
    }
  }

  const fetchAutoAssignConfig = async () => {
  try {
    const { data, error } = await supabase
      .from('auto_assignment_config')
      .select('*')
      .eq('created_by', currentUser?.id)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') throw error
    
    if (data) {
      setAutoAssignConfig(data)
    }
  } catch (error) {
    console.error("Error fetching auto-assignment config:", error)
  }
}

// Save auto-assignment configuration
const saveAutoAssignConfig = async (config: AutoAssignmentConfig) => {
  try {
    const configData = {
      ...config,
      created_by: currentUser?.id,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('auto_assignment_config')
      .upsert(configData)
      .select()

    if (error) throw error

    setAutoAssignConfig(data[0])
    toast({
      title: "Success",
      description: "Auto-assignment configuration saved successfully",
    })
  } catch (error) {
    console.error("Error saving auto-assignment config:", error)
    toast({
      title: "Error",
      description: "Failed to save configuration",
      variant: "destructive",
    })
  }
}

const runAutomatedAssignment = async () => {
  if (!autoAssignConfig.is_enabled) {
    toast({
      title: "Auto-assignment Disabled",
      description: "Please enable auto-assignment first",
      variant: "destructive",
    })
    return
  }

  setIsAutoAssignmentRunning(true)
  let assignmentCount = 0
  const assignmentResults: any[] = []
  
  try {
    console.log("🚀 Starting automated assignment...")
    console.log("Config:", autoAssignConfig)
    console.log("Available executives:", executives.length)
    console.log("Pending leads:", pendingLeads.length)

    // Check working hours if enabled
    if (autoAssignConfig.working_hours_only) {
      const now = new Date()
      const currentTime = format(now, 'HH:mm')
      const startTime = autoAssignConfig.working_hours_start
      const endTime = autoAssignConfig.working_hours_end
      
      if (currentTime < startTime || currentTime > endTime) {
        toast({
          title: "Outside Working Hours",
          description: `Auto-assignment only runs between ${startTime} and ${endTime}`,
          variant: "destructive",
        })
        return
      }
    }

    // Get available executives (not blacklisted, under max assignments)
    const availableExecutives = executives.filter(exec => {
      const isBlacklisted = autoAssignConfig.blacklisted_executives.includes(exec.id)
      const isOverLimit = (exec.active_assignments || 0) >= autoAssignConfig.max_assignments_per_executive
      
      console.log(`Executive ${exec.first_name} ${exec.last_name}:`, {
        isBlacklisted,
        isOverLimit,
        activeAssignments: exec.active_assignments || 0,
        maxAllowed: autoAssignConfig.max_assignments_per_executive
      })
      
      return !isBlacklisted && !isOverLimit
    })

    console.log("Available executives after filtering:", availableExecutives.length)

    if (availableExecutives.length === 0) {
      toast({
        title: "No Available Executives",
        description: "All executives are either blacklisted or at maximum capacity",
        variant: "destructive",
      })
      return
    }

    // Get leads to assign - start with high priority, then medium, then low
    const priorityOrder = ['High', 'Medium', 'Low']
    let leadsToAssign: Lead[] = []
    
    for (const priority of priorityOrder) {
      const leadsWithPriority = pendingLeads
        .filter(lead => lead.priority === priority)
        .slice(0, Math.min(5, availableExecutives.length * 2)) // Limit per priority
      
      leadsToAssign = [...leadsToAssign, ...leadsWithPriority]
      
      if (leadsToAssign.length >= 10) break // Overall limit
    }

    console.log("Leads to assign:", leadsToAssign.length)

    if (leadsToAssign.length === 0) {
      toast({
        title: "No Leads to Assign",
        description: "No pending leads available for assignment",
      })
      return
    }

    // Sort executives based on strategy
    let sortedExecutives = [...availableExecutives]
    
    switch (autoAssignConfig.assignment_strategy) {
      case 'least_workload':
        sortedExecutives.sort((a, b) => (a.active_assignments || 0) - (b.active_assignments || 0))
        console.log("Sorted by least workload:", sortedExecutives.map(e => `${e.first_name} (${e.active_assignments || 0})`))
        break
        
      case 'priority_based':
        sortedExecutives.sort((a, b) => {
          const aPriority = autoAssignConfig.priority_executives.indexOf(a.id)
          const bPriority = autoAssignConfig.priority_executives.indexOf(b.id)
          
          // Both in priority list - sort by priority order
          if (aPriority !== -1 && bPriority !== -1) return aPriority - bPriority
          
          // Only a is in priority list
          if (aPriority !== -1) return -1
          
          // Only b is in priority list  
          if (bPriority !== -1) return 1
          
          // Neither in priority list - sort by workload
          return (a.active_assignments || 0) - (b.active_assignments || 0)
        })
        console.log("Sorted by priority:", sortedExecutives.map(e => `${e.first_name} (priority: ${autoAssignConfig.priority_executives.indexOf(e.id)})`))
        break
        
      case 'round_robin':
        // For round robin, we'll cycle through executives
        // This is a simplified version - you might want to store last assigned executive
        sortedExecutives.sort(() => Math.random() - 0.5)
        console.log("Round robin shuffle:", sortedExecutives.map(e => e.first_name))
        break
    }

    // Assign leads
    let executiveIndex = 0
    
    for (let i = 0; i < leadsToAssign.length; i++) {
      const lead = leadsToAssign[i]
      
      // Find next available executive
      let assignedExecutive = null
      let attempts = 0
      
      while (attempts < sortedExecutives.length) {
        const executive = sortedExecutives[executiveIndex % sortedExecutives.length]
        
        // Check if this executive can still take more assignments
        if ((executive.active_assignments || 0) < autoAssignConfig.max_assignments_per_executive) {
          assignedExecutive = executive
          break
        }
        
        executiveIndex++
        attempts++
      }
      
      if (!assignedExecutive) {
        console.log("No more available executives")
        break
      }
      
      console.log(`Assigning lead ${lead.name} to ${assignedExecutive.first_name} ${assignedExecutive.last_name}`)
      
      // Calculate due date (7 days from now)
      const dueDate = format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd")
      
      // Create assignment
      const assignmentData = {
        lead_id: lead.id,
        assigned_to: assignedExecutive.id,
        assigned_by: currentUser!.id,
        assigned_at: new Date().toISOString(),
        status: "active",
        priority: lead.priority,
        notes: `Auto-assigned via ${autoAssignConfig.assignment_strategy} strategy at ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`,
        due_date: dueDate,
        is_auto_assigned: true
      }

      const { data: insertedAssignment, error: insertError } = await supabase
        .from("lead_assignments")
        .insert([assignmentData])
        .select()

      if (insertError) {
        console.error("Error inserting assignment:", insertError)
        continue
      }

      // Update lead status
      const { error: leadUpdateError } = await supabase
        .from("leads")
        .update({
          status: "assigned",
          counselor: `${assignedExecutive.first_name} ${assignedExecutive.last_name}`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", lead.id)

      if (leadUpdateError) {
        console.error("Error updating lead:", leadUpdateError)
        // Rollback assignment if lead update fails
        await supabase.from("lead_assignments").delete().eq("id", insertedAssignment[0].id)
        continue
      }

      // Success - record the assignment
      assignmentResults.push({
        lead: lead.name,
        executive: `${assignedExecutive.first_name} ${assignedExecutive.last_name}`,
        priority: lead.priority
      })

      assignmentCount++
      
      // Update executive's active assignments count for next iteration
      assignedExecutive.active_assignments = (assignedExecutive.active_assignments || 0) + 1
      
      // Move to next executive for round robin and least workload
      if (autoAssignConfig.assignment_strategy === 'round_robin') {
        executiveIndex++
      } else if (autoAssignConfig.assignment_strategy === 'least_workload') {
        // Re-sort executives by current workload
        sortedExecutives.sort((a, b) => (a.active_assignments || 0) - (b.active_assignments || 0))
        executiveIndex = 0 // Always pick the first (least loaded) executive
      } else {
        executiveIndex++
      }
    }

    // Update stats
    setAutoAssignmentStats(prev => ({
      ...prev,
      last_run: new Date().toISOString(),
      assignments_today: prev.assignments_today + assignmentCount,
      success_rate: assignmentCount > 0 ? 100 : prev.success_rate
    }))

    // Show results
    if (assignmentCount > 0) {
      toast({
        title: "Auto-assignment Complete! 🎉",
        description: `Successfully assigned ${assignmentCount} leads:\n${assignmentResults.map(r => `• ${r.lead} → ${r.executive}`).join('\n')}`,
      })
    } else {
      toast({
        title: "No Assignments Made",
        description: "No suitable lead-executive matches found",
        variant: "destructive",
      })
    }

    // Refresh data
    console.log("Refreshing data...")
    await Promise.all([fetchPendingLeads(), fetchAssignments(), fetchExecutives()])
    console.log("✅ Auto-assignment completed")

  } catch (error) {
    console.error("❌ Error in automated assignment:", error)
    setAutoAssignmentStats(prev => ({
      ...prev,
      failed_assignments: prev.failed_assignments + 1
    }))
    
    toast({
      title: "Auto-assignment Failed",
      description: `An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
      variant: "destructive",
    })
  } finally {
    setIsAutoAssignmentRunning(false)
  }
}

// Toggle executive blacklist
const toggleExecutiveBlacklist = (executiveId: string) => {
  setAutoAssignConfig(prev => ({
    ...prev,
    blacklisted_executives: prev.blacklisted_executives.includes(executiveId)
      ? prev.blacklisted_executives.filter(id => id !== executiveId)
      : [...prev.blacklisted_executives, executiveId]
  }))
}

// Toggle executive priority
const toggleExecutivePriority = (executiveId: string) => {
  setAutoAssignConfig(prev => ({
    ...prev,
    priority_executives: prev.priority_executives.includes(executiveId)
      ? prev.priority_executives.filter(id => id !== executiveId)
      : [...prev.priority_executives, executiveId]
  }))
}

  // Pagination helper functions
  const updatePaginationState = (
    data: any[], 
    currentPage: number, 
    itemsPerPage: number, 
    setPagination: React.Dispatch<React.SetStateAction<PaginationState>>
  ) => {
    const totalItems = data.length
    const totalPages = Math.ceil(totalItems / itemsPerPage)
    
    setPagination({
      currentPage: Math.min(currentPage, Math.max(1, totalPages)),
      itemsPerPage,
      totalItems,
      totalPages
    })
  }

  const paginateData = (data: any[], pagination: PaginationState) => {
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage
    const endIndex = startIndex + pagination.itemsPerPage
    return data.slice(startIndex, endIndex)
  }

  const resetPagination = (view: string) => {
    switch (view) {
      case 'pending':
        setPendingPagination(prev => ({ ...prev, currentPage: 1 }))
        break
      case 'executives':
        setExecutivePagination(prev => ({ ...prev, currentPage: 1 }))
        break
      case 'assignments':
        setAssignmentPagination(prev => ({ ...prev, currentPage: 1 }))
        break
    }
  }

  useEffect(() => {
    initializeData()
  }, [])
  
  useEffect(() => {
  if (currentUser?.id) {
    fetchAutoAssignConfig()
  }
}, [currentUser?.id])

  // Clear filters when switching views
  useEffect(() => {
    if (activeView !== "assignments") {
      clearFilters()
    }
    // Reset pagination when switching views
    resetPagination(activeView)
  }, [activeView])

const initializeData = async () => {
  try {
    setLoading(true)
    setError(null)
    await getCurrentUser()
    await Promise.all([
      fetchPendingLeads(),
      fetchExecutives(),
      fetchAssignments(),
      fetchAutoAssignConfig() // Add this line
    ])
  } catch (error) {
    console.error("Error initializing data:", error)
    setError(error instanceof Error ? error.message : "Failed to load data")
    toast({
      title: "Error",
      description: "Failed to load data. Please try again.",
      variant: "destructive",
    })
  } finally {
    setLoading(false)
  }
}

  const getCurrentUser = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) throw authError
      
      if (user) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (userError) throw userError
        setCurrentUser(userData)
      }
    } catch (error) {
      console.error("Error getting current user:", error)
      setError("Failed to authenticate user")
    }
  }

  const fetchPendingLeads = async () => {
    try {
      // Get leads that are not assigned (not in lead_assignments table with active status)
      const { data: assignedLeadIds, error: assignedError } = await supabase
        .from('lead_assignments')
        .select('lead_id')
        .eq('status', 'active')

      if (assignedError) throw assignedError

      const assignedIds = assignedLeadIds?.map(item => item.lead_id) || []

      let query = supabase
        .from('leads')
        .select('*')
        .in('status', ['New', 'Hot', 'Warm', 'Cold'])
        .order('created_at', { ascending: false })

      if (assignedIds.length > 0) {
        query = query.not('id', 'in', `(${assignedIds.join(',')})`)
      }

      const { data, error } = await query

      if (error) throw error
      setPendingLeads(data || [])
    } catch (error) {
      console.error("Error fetching pending leads:", error)
      setError("Failed to fetch pending leads")
    }
  }

  const fetchExecutives = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role_id', executiveRoleId)
        .eq('is_active', true)
        .order('first_name', { ascending: true })

      if (error) throw error

      // Calculate assignment counts for each executive
      const executivesWithStats = await Promise.all(
        (data || []).map(async (executive) => {
          const { data: activeAssignments, error: activeError } = await supabase
            .from('lead_assignments')
            .select('id')
            .eq('assigned_to', executive.id)
            .eq('status', 'active')

          const { data: completedAssignments, error: completedError } = await supabase
            .from('lead_assignments')
            .select('id')
            .eq('assigned_to', executive.id)
            .eq('status', 'completed')

          if (activeError || completedError) {
            console.warn(`Error fetching stats for executive ${executive.id}`)
          }

          const activeCount = activeAssignments?.length || 0
          const completedCount = completedAssignments?.length || 0
          const totalAssignments = activeCount + completedCount
          const performance_score = totalAssignments > 0 
            ? Math.round((completedCount / totalAssignments) * 100) 
            : 0

          return {
            ...executive,
            active_assignments: activeCount,
            completed_assignments: completedCount,
            performance_score
          }
        })
      )

      setExecutives(executivesWithStats)
    } catch (error) {
      console.error("Error fetching executives:", error)
      setError("Failed to fetch executives")
    }
  }

  const fetchAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('lead_assignments')
        .select(`
          *,
          lead:leads(
            id,
            name,
            email,
            phone_number,
            status,
            priority
          ),
          executive:users!lead_assignments_assigned_to_fkey(
            id,
            first_name,
            last_name,
            email,
            profile_image_url
          ),
          assigner:users!lead_assignments_assigned_by_fkey(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error("Supabase error fetching assignments:", error)
        throw error
      }

      setAssignments(data || [])
    } catch (err: any) {
      console.error("Error fetching assignments:", err.message)
      setError(`Failed to fetch assignments: ${err.message}`)
    }
  }

  // Fixed filter data with proper null checking and pagination
  const filteredData = useMemo(() => {
    let baseData: any[] = []

    // Select base data based on active view
    switch (activeView) {
      case "pending":
        baseData = pendingLeads
        break
      case "executives":
        baseData = executives
        break
      case "assignments":
        baseData = selectedExecutive 
          ? assignments.filter((a) => a.assigned_to === selectedExecutive) 
          : assignments
        break
      default:
        baseData = []
    }

    // Apply search filter
    let filtered = baseData
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      filtered = baseData.filter((item: any) => {
        switch (activeView) {
          case "pending":
            return (
              (item.name || '').toLowerCase().includes(searchLower) ||
              (item.email || '').toLowerCase().includes(searchLower) ||
              (item.phone_number || '').includes(searchTerm) ||
              (item.city || '').toLowerCase().includes(searchLower) ||
              (item.profession || '').toLowerCase().includes(searchLower)
            )
          case "executives":
            return (
              `${item.first_name || ''} ${item.last_name || ''}`.toLowerCase().includes(searchLower) ||
              (item.email || '').toLowerCase().includes(searchLower) ||
              (item.specialty || '').toLowerCase().includes(searchLower)
            )
          case "assignments":
            return (
              (item.lead?.name || '').toLowerCase().includes(searchLower) ||
              `${item.executive?.first_name || ''} ${item.executive?.last_name || ''}`.toLowerCase().includes(searchLower) ||
              (item.notes || '').toLowerCase().includes(searchLower)
            )
          default:
            return true
        }
      })
    }

    // Apply status filter (only for assignments)
    if (statusFilter !== "all" && activeView === "assignments") {
      filtered = filtered.filter((item: any) => item.status === statusFilter)
    }

    // Apply priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter((item: any) => {
        const itemPriority = item.priority?.toLowerCase()
        return itemPriority === priorityFilter.toLowerCase()
      })
    }

    // Update pagination states
    switch (activeView) {
      case "pending":
        updatePaginationState(filtered, pendingPagination.currentPage, pendingPagination.itemsPerPage, setPendingPagination)
        break
      case "executives":
        updatePaginationState(filtered, executivePagination.currentPage, executivePagination.itemsPerPage, setExecutivePagination)
        break
      case "assignments":
        updatePaginationState(filtered, assignmentPagination.currentPage, assignmentPagination.itemsPerPage, setAssignmentPagination)
        break
    }

    return filtered
  }, [pendingLeads, assignments, executives, searchTerm, statusFilter, priorityFilter, selectedExecutive, activeView, pendingPagination.currentPage, executivePagination.currentPage, assignmentPagination.currentPage])

  // Get paginated data for current view
  const paginatedData = useMemo(() => {
    switch (activeView) {
      case "pending":
        return paginateData(filteredData, pendingPagination)
      case "executives":
        return paginateData(filteredData, executivePagination)
      case "assignments":
        return paginateData(filteredData, assignmentPagination)
      default:
        return filteredData
    }
  }, [filteredData, activeView, pendingPagination, executivePagination, assignmentPagination])

  const handleAssignLead = async () => {
    if (!selectedLead || !selectedExecutiveForAssignment) {
      toast({
        title: "Error",
        description: "Please select both a lead and an executive.",
        variant: "destructive",
      })
      return
    }

    console.log("▶️ Assign button clicked", {
      selectedLead,
      selectedExecutiveForAssignment,
      assignmentPriority,
      assignmentDueDate,
      assignmentNotes,
    })

    setIsSubmitting(true)
    try {
      // default due date = one week from now
      const dueDate = assignmentDueDate || (() => {
        try {
          return format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd")
        } catch {
          return format(new Date(), "yyyy-MM-dd") // fallback to today
        }
      })()

      // 1) Insert into lead_assignments
      const { data: inserted, error: insertError } = await supabase
        .from("lead_assignments")
        .insert([
          {
            lead_id: selectedLead,
            assigned_to: selectedExecutiveForAssignment,
            assigned_by: currentUser!.id,
            assigned_at: new Date().toISOString(),
            status: "active",
            priority: assignmentPriority,
            notes: assignmentNotes || null,
            due_date: dueDate,
          },
        ])
        .select()

      if (insertError) throw insertError

      // 2) Update the lead's status + counselor name
      const exec = executives.find((e) => e.id === selectedExecutiveForAssignment)!
      const { error: leadError } = await supabase
        .from("leads")
        .update({
          status: "assigned",
          counselor: `${exec.first_name} ${exec.last_name}`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedLead)

      if (leadError) throw leadError

      toast({
        title: "Success",
        description: `Lead assigned to ${exec.first_name} ${exec.last_name}!`,
      })

      // reset & refresh
      resetAssignmentForm()
      setIsAssignDialogOpen(false)
      await Promise.all([fetchPendingLeads(), fetchAssignments()])
    } catch (err: any) {
      console.error("Error assigning lead:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to assign lead.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateAssignmentStatus = async (assignmentId: string, newStatus: string) => {
    try {
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      }

      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('lead_assignments')
        .update(updateData)
        .eq('id', assignmentId)

      if (error) throw error

      toast({
        title: "Success",
        description: `Assignment status updated to ${newStatus}`,
      })

      await handleRefresh()
    } catch (error) {
      console.error("Error updating assignment status:", error)
      toast({
        title: "Error",
        description: "Failed to update assignment status.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteAssignment = async (assignmentId: string, leadId: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return
    
    try {
      const { error } = await supabase
        .from('lead_assignments')
        .delete()
        .eq('id', assignmentId)

      if (error) throw error

      // Reset lead status back to previous state
      const { error: leadUpdateError } = await supabase
        .from('leads')
        .update({ 
          status: 'New', 
          updated_at: new Date().toISOString(),
          counselor: null
        })
        .eq('id', leadId)

      if (leadUpdateError) throw leadUpdateError

      toast({
        title: "Success",
        description: "Assignment deleted successfully",
      })

      await handleRefresh()
    } catch (error) {
      console.error("Error deleting assignment:", error)
      toast({
        title: "Error",
        description: "Failed to delete assignment.",
        variant: "destructive",
      })
    }
  }

  const handleQuickAssign = (leadId: string, executiveId: string) => {
    setSelectedLeadForAssignment(leadId)
    setSelectedExecutiveForAssignment(executiveId)
    setIsAssignDialogOpen(true)
  }

  // Fixed handleViewLeadInfo function with proper routing
  const handleViewLeadInfo = (leadId: string) => {
    // Navigate to lead info page with the lead ID as a query parameter
    const url = `/lead-information?tab=lead-information&leadId=${leadId}&tab=lead-info`
    router.push(url)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([
        fetchPendingLeads(),
        fetchExecutives(),
        fetchAssignments()
      ])
      toast({
        title: "Success",
        description: "Data refreshed successfully",
      })
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to refresh data",
        variant: "destructive"
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  const resetAssignmentForm = () => {
    setSelectedLeadForAssignment("")
    setSelectedExecutiveForAssignment("")
    setAssignmentNotes("")
    setAssignmentPriority("Medium")
    setAssignmentDueDate("")
  }

  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setPriorityFilter("all")
    if (activeView !== "assignments") {
      setSelectedExecutive(null)
    }
  }

  // New function to handle executive assignment view
  const handleViewExecutiveAssignments = (executiveId: string) => {
    setSelectedExecutive(executiveId)
    setActiveView("assignments")
  }

  // New function to clear executive filter
  const clearExecutiveFilter = () => {
    setSelectedExecutive(null)
  }

  // Pagination handlers
  const handlePageChange = (newPage: number, view: string) => {
    switch (view) {
      case 'pending':
        setPendingPagination(prev => ({ ...prev, currentPage: newPage }))
        break
      case 'executives':
        setExecutivePagination(prev => ({ ...prev, currentPage: newPage }))
        break
      case 'assignments':
        setAssignmentPagination(prev => ({ ...prev, currentPage: newPage }))
        break
    }
  }

  const handleItemsPerPageChange = (newItemsPerPage: number, view: string) => {
    switch (view) {
      case 'pending':
        setPendingPagination(prev => ({ ...prev, itemsPerPage: newItemsPerPage, currentPage: 1 }))
        break
      case 'executives':
        setExecutivePagination(prev => ({ ...prev, itemsPerPage: newItemsPerPage, currentPage: 1 }))
        break
      case 'assignments':
        setAssignmentPagination(prev => ({ ...prev, itemsPerPage: newItemsPerPage, currentPage: 1 }))
        break
    }
  }

  // Pagination component
  const PaginationControls = ({ pagination, view }: { pagination: PaginationState, view: string }) => (
    <div className="flex items-center justify-between mt-6">
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600">Show</span>
        <Select
          value={pagination.itemsPerPage.toString()}
          onValueChange={(value) => handleItemsPerPageChange(parseInt(value), view)}
        >
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {view === 'pending' && (
              <>
                <SelectItem value="6">6</SelectItem>
                <SelectItem value="9">9</SelectItem>
                <SelectItem value="12">12</SelectItem>
                <SelectItem value="18">18</SelectItem>
              </>
            )}
            {view === 'executives' && (
              <>
                <SelectItem value="4">4</SelectItem>
                <SelectItem value="6">6</SelectItem>
                <SelectItem value="8">8</SelectItem>
                <SelectItem value="12">12</SelectItem>
              </>
            )}
            {view === 'assignments' && (
              <>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>
        <span className="text-sm text-gray-600">per page</span>
      </div>
      
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600">
          Showing {Math.min((pagination.currentPage - 1) * pagination.itemsPerPage + 1, pagination.totalItems)} to{' '}
          {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of {pagination.totalItems} entries
        </span>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(1, view)}
          disabled={pagination.currentPage === 1}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(pagination.currentPage - 1, view)}
          disabled={pagination.currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        {/* Page numbers */}
        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
          const pageNum = Math.max(1, Math.min(pagination.currentPage - 2, pagination.totalPages - 4)) + i
          if (pageNum <= pagination.totalPages) {
            return (
              <Button
                key={pageNum}
                variant={pagination.currentPage === pageNum ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(pageNum, view)}
                className={pagination.currentPage === pageNum ? "bg-emerald-600 hover:bg-emerald-700" : ""}
              >
                {pageNum}
              </Button>
            )
          }
          return null
        })}
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(pagination.currentPage + 1, view)}
          disabled={pagination.currentPage === pagination.totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(pagination.totalPages, view)}
          disabled={pagination.currentPage === pagination.totalPages}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: Clock },
      completed: { color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle },
      cancelled: { color: "bg-red-100 text-red-800 border-red-200", icon: AlertCircle },
      New: { color: "bg-blue-100 text-blue-800 border-blue-200", icon: Sparkles },
      Hot: { color: "bg-red-100 text-red-800 border-red-200", icon: Flame },
      Warm: { color: "bg-orange-100 text-orange-800 border-orange-200", icon: Thermometer },
      Cold: { color: "bg-blue-100 text-blue-800 border-blue-200", icon: Snowflake },
      Failed: { color: "bg-gray-100 text-gray-800 border-gray-200", icon: AlertTriangle },
      assigned: { color: "bg-purple-100 text-purple-800 border-purple-200", icon: UserPlus },
      contacted: { color: "bg-teal-100 text-teal-800 border-teal-200", icon: Phone },
      qualified: { color: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: CheckCircle },
      converted: { color: "bg-green-100 text-green-800 border-green-200", icon: Award },
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.New
    return { color: config.color, icon: config.icon }
  }

  const getPriorityBadge = (priority: string) => {
    const priorityColors = {
      High: "bg-red-100 text-red-800 border-red-200",
      Medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
      Low: "bg-emerald-100 text-emerald-800 border-emerald-200",
    }
    return priorityColors[priority as keyof typeof priorityColors] || priorityColors.Medium
  }

  const getExecutiveName = (executive: Executive | null | undefined) => {
    if (!executive) return "Unknown Executive"
    return `${executive.first_name || ''} ${executive.last_name || ''}`.trim() || "Unknown Executive"
  }

  // Calculate enhanced stats
  const stats = useMemo(() => {
    const totalLeads = pendingLeads.length
    const totalAssignments = assignments.length
    const activeAssignments = assignments.filter(a => a.status === 'active').length
    const completedAssignments = assignments.filter(a => a.status === 'completed').length
    const completionRate = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0
    const avgPerformance = executives.length > 0 
      ? Math.round(executives.reduce((sum, exec) => sum + (exec.performance_score || 0), 0) / executives.length)
      : 0

    return {
      totalPending: totalLeads,
      activeAssignments,
      completedAssignments,
      availableExecutives: executives.length,
      completionRate,
      avgPerformance,
      highPriorityPending: pendingLeads.filter(l => l.priority === 'High').length,
      overdueAssignments: assignments.filter(a => {
        if (a.status !== 'active' || !a.due_date) return false
        const dueDate = safeParseDateForComparison(a.due_date)
        return dueDate && dueDate < new Date()
      }).length
    }
  }, [pendingLeads, assignments, executives])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Activity className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-emerald-800">Loading Lead Assignment Dashboard</h3>
            <p className="text-gray-600">Fetching leads, executives, and assignments...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 bg-gradient-to-br from-emerald-50/30 to-teal-50/30 min-h-screen p-6">
      {/* Error Alert */}
      {error && (
        <Alert className="border-red-200 bg-red-50/80 backdrop-blur-sm">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={initializeData}
              className="ml-2 h-6 px-2 text-xs border-red-300 hover:bg-red-100"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Enhanced Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
     
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="border-emerald-200 hover:bg-emerald-50 text-emerald-700"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
    variant="outline"
    onClick={handleRefresh}
    disabled={isRefreshing}
    className="border-emerald-200 hover:bg-emerald-50 text-emerald-700"
  >
    <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
    Refresh
  </Button>
  
  {/* Auto Assignment Button */}
  <Dialog open={isAutoAssignDialogOpen} onOpenChange={setIsAutoAssignDialogOpen}>
    <DialogTrigger asChild>
      <Button 
        variant="outline"
        className="border-blue-200 hover:bg-blue-50 text-blue-700"
      >
        <Activity className="h-4 w-4 mr-2" />
        Auto Assignment
      </Button>
    </DialogTrigger>
    <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-blue-800 text-xl flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Automated Lead Assignment
        </DialogTitle>
        <DialogDescription className="text-gray-600">
          Configure and manage automated lead assignment settings
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-6 py-4">
        {/* Status Card */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${autoAssignConfig.is_enabled ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className="font-medium text-gray-900">
                  Auto-assignment is {autoAssignConfig.is_enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <Button
                onClick={runAutomatedAssignment}
                disabled={isAutoAssignmentRunning || !autoAssignConfig.is_enabled}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isAutoAssignmentRunning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Run Now
                  </>
                )}
              </Button>
            </div>
            
            {autoAssignmentStats.last_run && (
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Last Run:</span>
                  <div className="font-medium">{safeFormatDate(autoAssignmentStats.last_run, 'MMM dd, HH:mm')}</div>
                </div>
                <div>
                  <span className="text-gray-600">Today's Assignments:</span>
                  <div className="font-medium text-blue-600">{autoAssignmentStats.assignments_today}</div>
                </div>
                <div>
                  <span className="text-gray-600">Available Executives:</span>
                  <div className="font-medium text-emerald-600">
                    {executives.filter(e => !autoAssignConfig.blacklisted_executives.includes(e.id)).length}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General Settings</TabsTrigger>
            <TabsTrigger value="executives">Executive Management</TabsTrigger>
            <TabsTrigger value="schedule">Schedule & Rules</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">Enable Auto-assignment</Label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={autoAssignConfig.is_enabled}
                    onChange={(e) => setAutoAssignConfig(prev => ({ ...prev, is_enabled: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-600">Automatically assign new leads</span>
                </div>
              </div>
              
              <div className="space-y-2">
               <Label className="text-gray-700 font-medium">Assignment Strategy</Label>

{/* NEW helper row under the title */}
<p className="text-xs text-gray-500">
  {STRATEGY_HELP[autoAssignConfig.assignment_strategy]}
</p>

<Select
  value={autoAssignConfig.assignment_strategy}
  onValueChange={(value: 'least_workload' | 'round_robin' | 'priority_based') =>
    setAutoAssignConfig(prev => ({ ...prev, assignment_strategy: value }))
  }
>
  <SelectTrigger className="border-gray-300">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="least_workload">Least Workload First</SelectItem>
    <SelectItem value="round_robin">Round Robin</SelectItem>
    <SelectItem value="priority_based">Priority Based</SelectItem>
  </SelectContent>
</Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">Max Assignments per Executive</Label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={autoAssignConfig.max_assignments_per_executive}
                  onChange={(e) => setAutoAssignConfig(prev => ({ 
                    ...prev, 
                    max_assignments_per_executive: parseInt(e.target.value) || 10 
                  }))}
                  className="border-gray-300"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">Auto-assign Interval (minutes)</Label>
                <Input
                  type="number"
                  min="5"
                  max="1440"
                  value={autoAssignConfig.auto_assign_interval_minutes}
                  onChange={(e) => setAutoAssignConfig(prev => ({ 
                    ...prev, 
                    auto_assign_interval_minutes: parseInt(e.target.value) || 30 
                  }))}
                  className="border-gray-300"
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="executives" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Priority Executives</h4>
                <p className="text-sm text-gray-600 mb-3">These executives will be assigned leads first</p>
                <div className="grid grid-cols-2 gap-2">
                  {executives.map((executive) => (
                    <div key={executive.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <input
                        type="checkbox"
                        checked={autoAssignConfig.priority_executives.includes(executive.id)}
                        onChange={() => toggleExecutivePriority(executive.id)}
                        className="rounded border-gray-300"
                      />
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={executive.profile_image_url || "/placeholder.svg"} />
                        <AvatarFallback className="bg-green-100 text-green-800">
                          {(executive.first_name?.[0] || '') + (executive.last_name?.[0] || '')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm">{getExecutiveName(executive)}</div>
                        <div className="text-xs text-gray-500">{executive.active_assignments || 0} active</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Blacklisted Executives</h4>
                <p className="text-sm text-gray-600 mb-3">These executives will not receive auto-assigned leads</p>
                <div className="grid grid-cols-2 gap-2">
                  {executives.map((executive) => (
                    <div key={executive.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <input
                        type="checkbox"
                        checked={autoAssignConfig.blacklisted_executives.includes(executive.id)}
                        onChange={() => toggleExecutiveBlacklist(executive.id)}
                        className="rounded border-gray-300"
                      />
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={executive.profile_image_url || "/placeholder.svg"} />
                        <AvatarFallback className="bg-red-100 text-red-800">
                          {(executive.first_name?.[0] || '') + (executive.last_name?.[0] || '')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm">{getExecutiveName(executive)}</div>
                        <div className="text-xs text-gray-500">{executive.active_assignments || 0} active</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="schedule" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={autoAssignConfig.working_hours_only}
                  onChange={(e) => setAutoAssignConfig(prev => ({ ...prev, working_hours_only: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <Label className="text-gray-700">Only assign during working hours</Label>
              </div>
              
              {autoAssignConfig.working_hours_only && (
                <div className="grid grid-cols-2 gap-4 ml-6">
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-medium">Working Hours Start</Label>
                    <Input
                      type="time"
                      value={autoAssignConfig.working_hours_start}
                      onChange={(e) => setAutoAssignConfig(prev => ({ ...prev, working_hours_start: e.target.value }))}
                      className="border-gray-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-medium">Working Hours End</Label>
                    <Input
                      type="time"
                      value={autoAssignConfig.working_hours_end}
                      onChange={(e) => setAutoAssignConfig(prev => ({ ...prev, working_hours_end: e.target.value }))}
                      className="border-gray-300"
                    />
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      <DialogFooter>
        <Button 
          variant="outline" 
          onClick={() => setIsAutoAssignDialogOpen(false)}
          className="border-gray-300"
        >
          Cancel
        </Button>
        <Button 
          onClick={() => saveAutoAssignConfig(autoAssignConfig)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Save Configuration
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
          
          <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg">
                <UserPlus className="h-4 w-4 mr-2" />
                Assign Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="text-emerald-800 text-xl">Assign Lead to Executive</DialogTitle>
                <DialogDescription className="text-gray-600">Select a lead and an executive to create a new assignment.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lead" className="text-gray-700 font-medium">Select Lead</Label>
                    <Select value={selectedLead} onValueChange={setSelectedLeadForAssignment}>
                        <SelectTrigger className="border-emerald-200 focus:border-emerald-500 h-18  ">
                            <SelectValue placeholder="Choose a lead" />
                      </SelectTrigger>
                      <SelectContent>
                        {pendingLeads.map((lead) => (
                          <SelectItem key={lead.id} value={lead.id}>
                            <div className="flex items-center space-x-3 py-2">
                              <Avatar className="h-8 w-8 ring-2 ring-emerald-100">
                                <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">
                                  {(lead.name || '').split(" ").map((n) => n[0] || '').join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-gray-900">{lead.name}</div>
                                <div className="text-sm text-gray-500">{lead.email}</div>
                                <div className="text-xs text-emerald-600">{lead.status} • {lead.priority} Priority</div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="executive" className="text-gray-700 font-medium">Select Executive</Label>
                    <Select value={selectedExecutiveForAssignment} onValueChange={setSelectedExecutiveForAssignment}>
                    <SelectTrigger className="border-emerald-200 focus:border-emerald-500 h-15 p-2 ">
                            <SelectValue placeholder="Choose an executive" />
                      </SelectTrigger>
                      <SelectContent>
                        {executives.map((executive) => (
                          <SelectItem key={executive.id} value={executive.id}>
                            <div className="flex items-center space-x-3 py-2">
                              <Avatar className="h-8 w-8 ring-2 ring-emerald-100">
                                <AvatarImage src={executive.profile_image_url || "/placeholder.svg"} />
                                <AvatarFallback className="bg-emerald-100 text-emerald-700">
                                  {(executive.first_name?.[0] || '') + (executive.last_name?.[0] || '')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-gray-900">{getExecutiveName(executive)}</div>
                                <div className="text-sm text-emerald-500">
                                  {executive.active_assignments} active</div>
                                  <div className="text-sm text-gray-500">{executive.performance_score}% performance</div>
                                {executive.specialty && (
                                  <div className="text-xs text-emerald-600">{executive.specialty}</div>
                                )}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority" className="text-gray-700 font-medium">Priority</Label>
                    <Select value={assignmentPriority} onValueChange={setAssignmentPriority}>
                      <SelectTrigger className="border-emerald-200 focus:border-emerald-500">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="High">🔥 High Priority</SelectItem>
                        <SelectItem value="Medium">⚡ Medium Priority</SelectItem>
                        <SelectItem value="Low">❄️ Low Priority</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate" className="text-gray-700 font-medium">Due Date</Label>
                    <Input
                      type="date"
                      value={assignmentDueDate}
                      onChange={(e) => setAssignmentDueDate(e.target.value)}
                      className="border-emerald-200 focus:border-emerald-500"
                      min={(() => {
                        try {
                          return format(new Date(), 'yyyy-MM-dd')
                        } catch {
                          return undefined
                        }
                      })()}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-gray-700 font-medium">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any special instructions or notes for this assignment..."
                    value={assignmentNotes}
                    onChange={(e) => setAssignmentNotes(e.target.value)}
                    className="border-emerald-200 focus:border-emerald-500 min-h-[100px]"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsAssignDialogOpen(false)
                    resetAssignmentForm()
                  }}
                  className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAssignLead} 
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Assign Lead
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
        <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-emerald-100 to-emerald-50 hover:from-emerald-200 hover:to-emerald-100" onClick={() => setActiveView("pending")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-emerald-800">
              <AlertCircle className="h-4 w-4" />
              Pending Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">{stats.totalPending}</div>
            <p className="text-xs text-gray-600 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              Awaiting assignment
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-blue-100 to-blue-50 hover:from-blue-200 hover:to-blue-100" onClick={() => setActiveView("assignments")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-800">
              <Clock className="h-4 w-4" />
              Active Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{stats.activeAssignments}</div>
            <p className="text-xs text-gray-600">In progress</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-teal-100 to-teal-50 hover:from-teal-200 hover:to-teal-100" onClick={() => setActiveView("executives")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-teal-800">
              <Users className="h-4 w-4" />
              Available Executives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-700">{stats.availableExecutives}</div>
            <p className="text-xs text-gray-600">Ready for assignments</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-green-100 to-green-50 hover:from-green-200 hover:to-green-100" onClick={() => setActiveView("assignments")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-green-800">
              <CheckCircle className="h-4 w-4" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{stats.completedAssignments}</div>
            <p className="text-xs text-gray-600">Successfully completed</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-purple-100 to-purple-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-purple-800">
              <Target className="h-4 w-4" />
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">{stats.completionRate}%</div>
            <p className="text-xs text-gray-600">Overall performance</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-orange-100 to-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-orange-800">
              <Award className="h-4 w-4" />
              Avg Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">{stats.avgPerformance}%</div>
            <p className="text-xs text-gray-600">Executive average</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-red-100 to-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-800">
              <Flame className="h-4 w-4" />
              High Priority
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{stats.highPriorityPending}</div>
            <p className="text-xs text-gray-600">Need attention</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-yellow-100 to-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-4 w-4" />
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700">{stats.overdueAssignments}</div>
            <p className="text-xs text-gray-600">Past due date</p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Main Content with Modern Tabs */}
      <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm border border-emerald-200 shadow-lg rounded-lg p-1">
          <TabsTrigger 
            value="overview" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white rounded-md transition-all duration-200"
          >
            <Target className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="pending" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white rounded-md transition-all duration-200"
          >
            <AlertCircle className="h-4 w-4 mr-2" />
            Pending ({stats.totalPending})
          </TabsTrigger>
          <TabsTrigger 
            value="executives" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white rounded-md transition-all duration-200"
          >
            <Users className="h-4 w-4 mr-2" />
            Executives ({stats.availableExecutives})
          </TabsTrigger>
          <TabsTrigger 
            value="assignments" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white rounded-md transition-all duration-200"
          >
            <Activity className="h-4 w-4 mr-2" />
            Assignments ({assignments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Pending Leads */}
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-t-lg">
                <CardTitle className="flex items-center justify-between text-emerald-800">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Recent Pending Leads
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setActiveView("pending")} className="border-emerald-300 hover:bg-emerald-100">
                    View All ({stats.totalPending})
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {pendingLeads.slice(0, 5).map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between p-4 border border-emerald-100 rounded-lg hover:bg-emerald-50/50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <Avatar className="ring-2 ring-emerald-200">
                          <AvatarFallback className="bg-emerald-100 text-emerald-800">
                            {(lead.name || '').split(" ").map((n) => n[0] || '').join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-gray-900">{lead.name}</div>
                          <div className="text-sm text-gray-600">{lead.email}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={getPriorityBadge(lead.priority)} variant="outline">
                              {lead.priority}
                            </Badge>
                            <Badge className={getStatusBadge(lead.status).color} variant="outline">
                              {lead.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline" onClick={() => handleViewLeadInfo(lead.id)} className="border-emerald-300 hover:bg-emerald-100">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          className="bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => {
                            setSelectedLeadForAssignment(lead.id)
                            setIsAssignDialogOpen(true)
                          }}
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {pendingLeads.length === 0 && (
                    <div className="text-center py-8">
                      <CheckCircle className="mx-auto h-12 w-12 text-emerald-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">All leads assigned!</h3>
                      <p className="mt-1 text-sm text-gray-600">Great job! No pending leads at the moment.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Top Performing Executives */}
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-t-lg">
                <CardTitle className="flex items-center justify-between text-teal-800">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Top Performing Executives
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setActiveView("executives")} className="border-teal-300 hover:bg-teal-100">
                    View All ({stats.availableExecutives})
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {executives
                    .sort((a, b) => (b.performance_score || 0) - (a.performance_score || 0))
                    .slice(0, 5)
                    .map((executive, index) => (
                    <div key={executive.id} className="flex items-center justify-between p-4 border border-emerald-100 rounded-lg hover:bg-emerald-50/50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <Avatar className="ring-2 ring-emerald-200">
                            <AvatarImage src={executive.profile_image_url || "/placeholder.svg"} />
                            <AvatarFallback className="bg-emerald-100 text-emerald-800">
                              {(executive.first_name?.[0] || '') + (executive.last_name?.[0] || '')}
                            </AvatarFallback>
                          </Avatar>
                          {index < 3 && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center text-xs font-bold text-white">
                              {index + 1}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{getExecutiveName(executive)}</div>
                          <div className="text-sm text-gray-600">{executive.email}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                              {executive.active_assignments} active
                            </Badge>
                            <Badge variant="outline" className="border-green-200 text-green-700">
                              {executive.completed_assignments} completed
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-emerald-700">{executive.performance_score}%</div>
                        <div className="text-sm text-gray-500">Performance</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="border-0 shadow-xl bg-gradient-to-r from-emerald-50 to-teal-50">
            <CardHeader>
              <CardTitle className="text-emerald-800 flex items-center gap-2">
                <Star className="h-5 w-5" />
                Quick Actions & Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-600 mb-2">{stats.completionRate}%</div>
                  <div className="text-gray-700 font-medium">Overall Completion Rate</div>
                  <p className="text-sm text-gray-600 mt-1">
                    {stats.completedAssignments} of {assignments.length} assignments completed
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-teal-600 mb-2">{stats.avgPerformance}%</div>
                  <div className="text-gray-700 font-medium">Average Performance</div>
                  <p className="text-sm text-gray-600 mt-1">Across all executives</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-2">{stats.overdueAssignments}</div>
                  <div className="text-gray-700 font-medium">Overdue Assignments</div>
                  <p className="text-sm text-gray-600 mt-1">Need immediate attention</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4 mt-6">
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-t-lg">
              <CardTitle className="text-emerald-800 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Pending Leads Management
              </CardTitle>
              <CardDescription className="text-gray-600">
                {filteredData.length} leads waiting to be assigned to executives
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {/* Enhanced Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-emerald-50/50 rounded-lg">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-500 h-4 w-4" />
                  <Input
                    placeholder="Search leads by name, email, city, profession..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-emerald-200 focus:border-emerald-500"
                  />
                </div>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-full sm:w-[200px] border-emerald-200 focus:border-emerald-500">
                    <Filter className="h-4 w-4 mr-2 text-emerald-600" />
                    <SelectValue placeholder="Filter by priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="high">🔥 High Priority</SelectItem>
                    <SelectItem value="medium">⚡ Medium Priority</SelectItem>
                    <SelectItem value="low">❄️ Low Priority</SelectItem>
                  </SelectContent>
                </Select>
                {(searchTerm || priorityFilter !== "all") && (
                  <Button 
                    variant="outline" 
                    onClick={clearFilters}
                    className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>

              {/* Leads Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedData.map((lead) => (
                  <Card key={lead.id} className="hover:shadow-lg transition-all duration-300 border-emerald-200 hover:border-emerald-300 bg-white/80">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <Avatar className="ring-2 ring-emerald-200">
                            <AvatarFallback className="bg-emerald-100 text-emerald-800">
                              {(lead.name || '').split(" ").map((n) => n[0] || '').join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold text-gray-900">{lead.name}</div>
                            <div className="text-sm text-gray-600">{lead.source}</div>
                          </div>
                        </div>
                        <Badge className={getPriorityBadge(lead.priority)}>{lead.priority}</Badge>
                      </div>

                      <div className="space-y-3 mb-4">
                        <div className="flex items-center text-sm text-gray-700">
                          <Mail className="h-4 w-4 mr-2" />
                          {lead.email}
                        </div>
                        <div className="flex items-center text-sm text-gray-700">
                          <Phone className="h-4 w-4 mr-2" />
                          {lead.phone_number}
                        </div>
                        {lead.city && (
                          <div className="flex items-center text-sm text-gray-700">
                            <MapPin className="h-4 w-4 mr-2" />
                            {lead.city}
                          </div>
                        )}
                        {lead.profession && (
                          <div className="flex items-center text-sm text-gray-700">
                            <Star className="h-4 w-4 mr-2" />
                            {lead.profession}
                          </div>
                        )}
                        <div className="flex items-center text-sm text-gray-700">
                          <Calendar className="h-4 w-4 mr-2" />
                          {safeFormatDate(lead.created_at)}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <Badge className={getStatusBadge(lead.status).color}>
                          {React.createElement(getStatusBadge(lead.status).icon, { className: "h-3 w-3 mr-1" })}
                          {lead.status}
                        </Badge>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" onClick={() => handleViewLeadInfo(lead.id)} className="border-emerald-300 hover:bg-emerald-100">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                <UserPlus className="h-4 w-4 mr-1" />
                                Assign
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              {executives.slice(0, 5).map((executive) => (
                                <DropdownMenuItem
                                  key={executive.id}
                                  onClick={() => handleQuickAssign(lead.id, executive.id)}
                                  className="hover:bg-emerald-50"
                                >
                                  <div className="flex items-center space-x-2">
                                    <Avatar className="h-6 w-6 ring-1 ring-emerald-200">
                                      <AvatarImage src={executive.profile_image_url || "/placeholder.svg"} />
                                      <AvatarFallback className="bg-emerald-100 text-emerald-800 text-xs">
                                        {(executive.first_name?.[0] || '') + (executive.last_name?.[0] || '')}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <span className="font-medium">{getExecutiveName(executive)}</span>
                                      <div className="text-xs text-gray-500">
                                        {executive.active_assignments} active • {executive.performance_score}%
                                      </div>
                                    </div>
                                  </div>
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedLeadForAssignment(lead.id)
                                  setIsAssignDialogOpen(true)
                                }}
                                className="border-t"
                              >
                                <UserPlus className="h-4 w-4 mr-2" />
                                View All Executives
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredData.length === 0 && (
                <div className="text-center py-12">
                  <AlertCircle className="mx-auto h-16 w-16 text-emerald-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No pending leads found</h3>
                  <p className="mt-2 text-gray-600">
                    {searchTerm || priorityFilter !== "all"
                      ? "Try adjusting your search or filter criteria."
                      : "All leads have been assigned. Great job!"}
                  </p>
                </div>
              )}

              {/* Pagination Controls */}
              {filteredData.length > 0 && (
                <PaginationControls pagination={pendingPagination} view="pending" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="executives" className="space-y-4 mt-6">
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-t-lg">
              <CardTitle className="text-teal-800 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Executive Dashboard
              </CardTitle>
              <CardDescription className="text-gray-600">View executive performance and manage assignments</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {/* Search Filter */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-teal-50/50 rounded-lg">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-500 h-4 w-4" />
                  <Input
                    placeholder="Search executives..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-teal-200 focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {paginatedData.map((executive) => (
                  <Card key={executive.id} className="hover:shadow-lg transition-shadow border-teal-200 hover:border-teal-300">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-16 w-16 ring-2 ring-teal-200">
                            <AvatarImage src={executive.profile_image_url || "/placeholder.svg"} />
                            <AvatarFallback className="bg-teal-100 text-teal-800 text-lg">
                              {(executive.first_name?.[0] || '') + (executive.last_name?.[0] || '')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold text-xl text-gray-900">{getExecutiveName(executive)}</div>
                            <div className="text-sm text-gray-600">{executive.email}</div>
                            {executive.specialty && (
                              <div className="text-sm text-gray-500 font-medium">{executive.specialty}</div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-teal-700">{executive.performance_score}%</div>
                          <div className="text-sm text-gray-500">Performance</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="text-center p-4 bg-teal-50 rounded-lg border border-teal-100">
                          <div className="text-2xl font-bold text-teal-700">{executive.active_assignments}</div>
                          <div className="text-sm text-gray-600">Active</div>
                        </div>
                        <div className="text-center p-4 bg-teal-50 rounded-lg border border-teal-100">
                          <div className="text-2xl font-bold text-teal-700">{executive.completed_assignments}</div>
                          <div className="text-sm text-gray-600">Completed</div>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          className="flex-1 border-teal-300 hover:bg-teal-100 text-gray-700"
                          onClick={() => handleViewExecutiveAssignments(executive.id)}
                        >
                          <Activity className="h-4 w-4 mr-2" />
                          View Assignments
                        </Button>
                        <Button
                          className="bg-teal-600 hover:bg-teal-700"
                          onClick={() => {
                            setSelectedExecutiveForAssignment(executive.id)
                            setIsAssignDialogOpen(true)
                          }}
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination Controls */}
              {filteredData.length > 0 && (
                <PaginationControls pagination={executivePagination} view="executives" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4 mt-6">
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-t-lg">
              <CardTitle className="flex items-center justify-between text-blue-800">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Assignment Management
                </div>
                {selectedExecutive && (
                  <Button variant="outline" size="sm" onClick={clearExecutiveFilter} className="border-blue-300 hover:bg-blue-100">
                    <X className="h-4 w-4 mr-2" />
                    Clear Filter
                  </Button>
                )}
              </CardTitle>
              <CardDescription className="text-gray-600">
                {selectedExecutive
                  ? `Assignments for ${getExecutiveName(executives.find((e) => e.id === selectedExecutive))}`
                  : `Managing ${filteredData.length} assignments across all executives`}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {/* Enhanced Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-blue-50/50 rounded-lg">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 h-4 w-4" />
                  <Input
                    placeholder="Search assignments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-blue-200 focus:border-blue-500"
                  />
                </div>
                <Select value={selectedExecutive || "all"} onValueChange={(value) => setSelectedExecutive(value === "all" ? null : value)}>
                  <SelectTrigger className="w-full sm:w-[200px] border-blue-200 focus:border-blue-500">
                    <Users className="h-4 w-4 mr-2 text-blue-600" />
                    <SelectValue placeholder="Filter by executive" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Executives</SelectItem>
                    {executives.map((executive) => (
                      <SelectItem key={executive.id} value={executive.id}>
                        {getExecutiveName(executive)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px] border-blue-200 focus:border-blue-500">
                    <Filter className="h-4 w-4 mr-2 text-blue-600" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">🔵 Active</SelectItem>
                    <SelectItem value="completed">✅ Completed</SelectItem>
                    <SelectItem value="cancelled">❌ Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-full sm:w-[180px] border-blue-200 focus:border-blue-500">
                    <Filter className="h-4 w-4 mr-2 text-blue-600" />
                    <SelectValue placeholder="Filter by priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="high">🔥 High Priority</SelectItem>
                    <SelectItem value="medium">⚡ Medium Priority</SelectItem>
                    <SelectItem value="low">❄️ Low Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Assignments Table */}
              <div className="rounded-lg border border-blue-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-blue-50">
                      <TableHead className="text-blue-800 font-semibold">Lead</TableHead>
                      <TableHead className="text-blue-800 font-semibold">Executive</TableHead>
                      <TableHead className="text-blue-800 font-semibold">Priority</TableHead>
                      <TableHead className="text-blue-800 font-semibold">Status</TableHead>
                      <TableHead className="text-blue-800 font-semibold">Assigned Date</TableHead>
                      <TableHead className="text-blue-800 font-semibold">Due Date</TableHead>
                      <TableHead className="text-blue-800 font-semibold">Notes</TableHead>
                      <TableHead className="text-right text-blue-800 font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((assignment) => (
                      <TableRow key={assignment.id} className="hover:bg-blue-50/50">
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10 ring-2 ring-blue-200">
                              <AvatarFallback className="bg-blue-100 text-blue-800">
                                {(assignment.lead?.name || "Unknown")
                                  .split(" ")
                                  .map((n) => n[0] || '')
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-gray-900">{assignment.lead?.name || "Unknown Lead"}</div>
                              <div className="text-sm text-gray-600">{assignment.lead?.email || "No email"}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10 ring-2 ring-blue-200">
                              <AvatarImage src={assignment.executive?.profile_image_url || "/placeholder.svg"} />
                              <AvatarFallback className="bg-blue-100 text-blue-800">
                                {(assignment.executive?.first_name?.[0] || '') + (assignment.executive?.last_name?.[0] || '')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-gray-900">{getExecutiveName(assignment.executive)}</div>
                              <div className="text-sm text-gray-600">{assignment.executive?.email || "No email"}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityBadge(assignment.priority)}>{assignment.priority}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(assignment.status).color}>
                            {React.createElement(getStatusBadge(assignment.status).icon, { className: "h-3 w-3 mr-1" })}
                            {assignment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-700">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {safeFormatDate(assignment.assigned_at)}
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-700">
                          {assignment.due_date ? (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {safeFormatDate(assignment.due_date)}
                              {(() => {
                                const dueDate = safeParseDateForComparison(assignment.due_date)
                                return dueDate && dueDate < new Date() && assignment.status === 'active'
                              })() && (
                                <Badge className="ml-2 bg-red-100 text-red-800 border-red-200">Overdue</Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">No due date</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate text-gray-700">{assignment.notes || "-"}</div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-blue-100">
                                <MoreHorizontal className="h-4 w-4 text-blue-600" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewLeadInfo(assignment.lead_id)} className="hover:bg-blue-50">
                                <Eye className="mr-2 h-4 w-4" />
                                View Lead Details
                              </DropdownMenuItem>
                              {assignment.status === 'active' && (
                                <DropdownMenuItem onClick={() => handleUpdateAssignmentStatus(assignment.id, 'completed')} className="hover:bg-green-50">
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Mark Complete
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleDeleteAssignment(assignment.id, assignment.lead_id)} className="text-red-600 hover:bg-red-50">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Assignment
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filteredData.length === 0 && (
                <div className="text-center py-12">
                  <UserPlus className="mx-auto h-16 w-16 text-blue-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No assignments found</h3>
                  <p className="mt-2 text-gray-600">
                    {searchTerm || statusFilter !== "all" || priorityFilter !== "all" || selectedExecutive
                      ? "Try adjusting your search or filter criteria."
                      : "Get started by assigning your first lead."}
                  </p>
                </div>
              )}

              {/* Pagination Controls */}
              {filteredData.length > 0 && (
                <PaginationControls pagination={assignmentPagination} view="assignments" />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}