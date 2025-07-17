"use client"
import { Session } from '@supabase/supabase-js'
import { useState, useMemo, useEffect } from "react"
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Phone,
  User,
  MapPin,
  CalendarIcon,
  Clock,
  TrendingUp,
  Filter,
  Star,
  Target,
  Flame,
  Thermometer,
  Snowflake,
  Sparkles,
  AlertTriangle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { format } from "date-fns"
import type { DateRange } from "react-day-picker"
import { createClient } from '@supabase/supabase-js'

// Supabase client setup - replace with your actual URL and anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
interface Lead {
  id: string
  created_at: string
  updated_at: string
  name: string
  email: string
  phone_number: string
  city: string | null
  profession: string | null
  status: 'New' | 'Hot' | 'Warm' | 'Cold' | 'Failed'
  source: 'Website' | 'Social Media' | 'Referral' | 'Cold Call' | null
  counselor: string | null
  priority: 'High' | 'Medium' | 'Low'
  lead_score: number
  conversion_probability: number
  follow_up_date: string | null
  last_activity_date: string | null
  budget: string | null
  timeline: string | null
  notes: string | null
}

interface NewLead {
  name: string
  email: string
  phone_number: string
  city?: string
  profession?: string
  status: 'New' | 'Hot' | 'Warm' | 'Cold' | 'Failed'
  source?: 'Website' | 'Social Media' | 'Referral' | 'Cold Call'
  counselor?: string
  priority: 'High' | 'Medium' | 'Low'
  lead_score?: number
  conversion_probability?: number
  follow_up_date?: string
  budget?: string
  timeline?: string
  notes?: string
}

type SortField = "created_at" | "name" | "counselor" | "city" | "profession" | "status" | "follow_up_date" | "source"
type SortDirection = "asc" | "desc" | null

export function LeadsTab() {
  // Router and search params for URL filtering
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // State for leads data
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sourceFilter, setSourceFilter] = useState("all")
  const [counselorFilter, setCounselorFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  
  // Dialog and form states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Sorting states
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  
  // Form data state
  const [formData, setFormData] = useState<NewLead>({
    name: '',
    email: '',
    phone_number: '',
    city: '',
    profession: '',
    status: 'New',
    source: 'Website',
    counselor: '',
    priority: 'Medium',
    lead_score: 50,
    conversion_probability: 30,
    budget: '',
    timeline: '',
    notes: ''
  })

  // Helper function to normalize filter values from URL
  const normalizeFilterValue = (value: string, filterType: 'status' | 'source' | 'priority'): string => {
    if (!value) return "all"
    
    const lowerValue = value.toLowerCase()
    
    switch (filterType) {
      case 'status':
        // Valid status values: "all", "new", "hot", "warm", "cold", "failed"
        if (['new', 'hot', 'warm', 'cold', 'failed'].includes(lowerValue)) {
          return lowerValue
        }
        break
      case 'source':
        // Valid source values: "all", "website", "socialmedia", "referral", "coldcall"
        const sourceMap: { [key: string]: string } = {
          'website': 'website',
          'social': 'socialmedia',
          'socialmedia': 'socialmedia',
          'social-media': 'socialmedia',
          'referral': 'referral',
          'coldcall': 'coldcall',
          'cold-call': 'coldcall'
        }
        return sourceMap[lowerValue] || "all"
      case 'priority':
        // Valid priority values: "all", "high", "medium", "low"
        if (['high', 'medium', 'low'].includes(lowerValue)) {
          return lowerValue
        }
        break
    }
    
    return "all"
  }

  // Apply URL parameters on component mount
  useEffect(() => {
    const status = searchParams.get('status')
    const source = searchParams.get('source')
    const counselor = searchParams.get('counselor')
    const priority = searchParams.get('priority')
    const search = searchParams.get('search')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    
    // Apply filters from URL parameters
    if (status) {
      setStatusFilter(normalizeFilterValue(status, 'status'))
    }
    
    if (source) {
      setSourceFilter(normalizeFilterValue(source, 'source'))
    }
    
    if (counselor) {
      setCounselorFilter(decodeURIComponent(counselor))
    }
    
    if (priority) {
      setPriorityFilter(normalizeFilterValue(priority, 'priority'))
    }
    
    if (search) {
      setSearchTerm(decodeURIComponent(search))
    }
    
    // Handle date range from URL
    if (dateFrom || dateTo) {
      const range: DateRange = {}
      if (dateFrom) {
        try {
          range.from = new Date(dateFrom)
        } catch (e) {
          console.warn('Invalid dateFrom parameter:', dateFrom)
        }
      }
      if (dateTo) {
        try {
          range.to = new Date(dateTo)
        } catch (e) {
          console.warn('Invalid dateTo parameter:', dateTo)
        }
      }
      if (range.from || range.to) {
        setDateRange(range)
      }
    }
  }, [searchParams])

  // Function to update URL with current filters (optional - for better UX)
  const updateURLWithFilters = () => {
    const params = new URLSearchParams()
    
    if (statusFilter !== "all") params.set('status', statusFilter)
    if (sourceFilter !== "all") params.set('source', sourceFilter)
    if (counselorFilter !== "all") params.set('counselor', counselorFilter)
    if (priorityFilter !== "all") params.set('priority', priorityFilter)
    if (searchTerm) params.set('search', searchTerm)
    if (dateRange?.from) params.set('dateFrom', format(dateRange.from, 'yyyy-MM-dd'))
    if (dateRange?.to) params.set('dateTo', format(dateRange.to, 'yyyy-MM-dd'))
    
    const newURL = params.toString() 
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname
    
    // Use replace instead of push to not add to browser history for every filter change
    window.history.replaceState({}, '', newURL)
  }

  // Update URL whenever filters change (optional)
  useEffect(() => {
    if (leads.length > 0) { // Only update URL after initial load
      updateURLWithFilters()
    }
  }, [statusFilter, sourceFilter, counselorFilter, priorityFilter, searchTerm, dateRange])

  // Fetch leads from Supabase
  const fetchLeads = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      setLeads(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch leads')
    } finally {
      setLoading(false)
    }
  }

  // Add new lead
  const addLead = async (leadData: NewLead) => {
    try {
      setIsSubmitting(true)
      
      const { data, error } = await supabase
        .from('leads')
        .insert([leadData])
        .select()
        .single()
      
      if (error) throw error
      
      setLeads(prev => [data, ...prev])
      setIsAddDialogOpen(false)
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add lead')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Update lead
  const updateLead = async (id: string, updates: Partial<NewLead>) => {
    try {
      setIsSubmitting(true)
      
      const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      
      setLeads(prev => prev.map(lead => lead.id === id ? data : lead))
      setIsEditDialogOpen(false)
      setEditingLead(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update lead')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete lead
  const deleteLead = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return
    
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      setLeads(prev => prev.filter(lead => lead.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete lead')
    }
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone_number: '',
      city: '',
      profession: '',
      status: 'New',
      source: 'Website',
      counselor: '',
      priority: 'Medium',
      lead_score: 50,
      conversion_probability: 30,
      budget: '',
      timeline: '',
      notes: ''
    })
    setSelectedDate(undefined)
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const submitData = {
      ...formData,
      follow_up_date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined
    }
    
    if (editingLead) {
      updateLead(editingLead.id, submitData)
    } else {
      addLead(submitData)
    }
  }

  // Handle edit
  const handleEdit = (lead: Lead) => {
    setEditingLead(lead)
    setFormData({
      name: lead.name,
      email: lead.email,
      phone_number: lead.phone_number,
      city: lead.city || '',
      profession: lead.profession || '',
      status: lead.status,
      source: lead.source || 'Website',
      counselor: lead.counselor || '',
      priority: lead.priority,
      lead_score: lead.lead_score,
      conversion_probability: lead.conversion_probability,
      budget: lead.budget || '',
      timeline: lead.timeline || '',
      notes: lead.notes || ''
    })
    setSelectedDate(lead.follow_up_date ? new Date(lead.follow_up_date) : undefined)
    setIsEditDialogOpen(true)
  }

    const handleRowClick = (id: string) => {
    // adjust this URL to whatever route or query your Lead Information tab listens to:
  router.push(`/lead-information?tab=lead-information&leadId=${id}`)
  }

  // Load leads on component mount
  useEffect(() => {
    fetchLeads()
  }, [])

  // Sorting logic
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

  // Filter and sort leads
  const filteredAndSortedLeads = useMemo(() => {
    const filtered = leads.filter((lead) => {
      const matchesSearch =
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone_number.includes(searchTerm) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.counselor?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (lead.city?.toLowerCase() || '').includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === "all" || lead.status.toLowerCase() === statusFilter
      const matchesSource = sourceFilter === "all" || (lead.source?.toLowerCase().replace(" ", "") === sourceFilter)
      const matchesCounselor = counselorFilter === "all" || lead.counselor === counselorFilter
      const matchesPriority = priorityFilter === "all" || lead.priority.toLowerCase() === priorityFilter

      // Date range filter
      let matchesDateRange = true
      if (dateRange?.from || dateRange?.to) {
        const leadDate = new Date(lead.created_at)
        if (dateRange.from && dateRange.to) {
          matchesDateRange = leadDate >= dateRange.from && leadDate <= dateRange.to
        } else if (dateRange.from) {
          matchesDateRange = leadDate >= dateRange.from
        } else if (dateRange.to) {
          matchesDateRange = leadDate <= dateRange.to
        }
      }

      return matchesSearch && matchesStatus && matchesSource && matchesCounselor && matchesPriority && matchesDateRange
    })

    // Apply sorting
    if (sortField && sortDirection) {
      filtered.sort((a, b) => {
        let aValue: string | number | Date
        let bValue: string | number | Date

        switch (sortField) {
          case "created_at":
          case "follow_up_date":
            aValue = new Date(a[sortField] || '')
            bValue = new Date(b[sortField] || '')
            break
          case "name":
          case "counselor":
          case "city":
          case "profession":
          case "status":
          case "source":
            aValue = (a[sortField] || '').toLowerCase()
            bValue = (b[sortField] || '').toLowerCase()
            break
          default:
            aValue = a[sortField] || ''
            bValue = b[sortField] || ''
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
  }, [leads, searchTerm, statusFilter, sourceFilter, counselorFilter, priorityFilter, dateRange, sortField, sortDirection])

  // Calculate stats
  const stats = {
    total: leads.length,
    new: leads.filter((l) => l.status === "New").length,
    hot: leads.filter((l) => l.status === "Hot").length,
    warm: leads.filter((l) => l.status === "Warm").length,
    cold: leads.filter((l) => l.status === "Cold").length,
    failed: leads.filter((l) => l.status === "Failed").length,
    conversionRate: leads.length > 0 ? ((leads.filter((l) => ["Hot", "Warm"].includes(l.status)).length / leads.length) * 100).toFixed(1) : "0",
    avgLeadScore: leads.length > 0 ? (leads.reduce((sum, l) => sum + l.lead_score, 0) / leads.length).toFixed(0) : "0",
    highPriority: leads.filter((l) => l.priority === "High").length,
  }

  // Get unique counselors for filter
  const uniqueCounselors = [...new Set(leads.map(l => l.counselor).filter(Boolean))]

  const getStatusColor = (status: string) => {
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
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "hot":
        return <Flame className="h-3 w-3" />
      case "warm":
        return <Thermometer className="h-3 w-3" />
      case "cold":
        return <Snowflake className="h-3 w-3" />
      case "new":
        return <Sparkles className="h-3 w-3" />
      case "failed":
        return <AlertTriangle className="h-3 w-3" />
      default:
        return <User className="h-3 w-3" />
    }
  }

  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setSourceFilter("all")
    setCounselorFilter("all")
    setPriorityFilter("all")
    setDateRange(undefined)
    setSortField(null)
    setSortDirection(null)
    
    // Clear URL parameters as well
    window.history.replaceState({}, '', window.location.pathname)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <span className="ml-2 text-slate-600">Loading leads...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* URL Filter Indicator */}
      {(statusFilter !== "all" || sourceFilter !== "all" || counselorFilter !== "all" || priorityFilter !== "all" || searchTerm || dateRange) && (
        <Alert className="border-emerald-200 bg-emerald-50">
          <Filter className="h-4 w-4 text-emerald-600" />
          <AlertDescription className="text-emerald-800">
            Active filters applied from URL or manual selection. 
            <Button 
              variant="link" 
              size="sm" 
              onClick={clearFilters}
              className="ml-2 h-auto p-0 text-emerald-700 underline"
            >
              Clear all filters
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchLeads}
              className="ml-2 h-6 px-2 text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Enhanced Filters with Date Range */}
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-700">
            <Filter className="h-5 w-5" />
            Advanced Lead Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Search Leads</label>
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
                  <SelectItem value="socialmedia">Social Media</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="coldcall">Cold Call</SelectItem>
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
                  {uniqueCounselors.map(counselor => (
                    <SelectItem key={counselor} value={counselor!}>{counselor}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Priority</label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="border-emerald-200 hover:border-emerald-300">
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="low">Low Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={fetchLeads}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
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
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Lead Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-green-50 hover:shadow-xl transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-emerald-700">
              <Target className="h-4 w-4" />
              Total Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.total}</div>
            <p className="text-xs text-slate-600 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1 text-emerald-500" />
              All time leads
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50 hover:shadow-xl transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-700">
              <Sparkles className="h-4 w-4" />
              New Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.new}</div>
            <p className="text-xs text-slate-600">Fresh prospects</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-pink-50 hover:shadow-xl transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-700">
              <Flame className="h-4 w-4" />
              Hot Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.hot}</div>
            <p className="text-xs text-slate-600">High priority</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-yellow-50 hover:shadow-xl transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-orange-700">
              <Thermometer className="h-4 w-4" />
              Warm Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.warm}</div>
            <p className="text-xs text-slate-600">Medium priority</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-xl transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-700">
              <Snowflake className="h-4 w-4" />
              Cold Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.cold}</div>
            <p className="text-xs text-slate-600">Low priority</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50 hover:shadow-xl transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-purple-700">
              <Star className="h-4 w-4" />
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.conversionRate}%</div>
            <p className="text-xs text-slate-600">Hot + Warm leads</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-teal-50 to-cyan-50 hover:shadow-xl transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-teal-700">
              <Target className="h-4 w-4" />
              Avg Lead Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-600">{stats.avgLeadScore}</div>
            <p className="text-xs text-slate-600">Out of 100</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-rose-50 to-pink-50 hover:shadow-xl transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-rose-700">
              <AlertTriangle className="h-4 w-4" />
              High Priority
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">{stats.highPriority}</div>
            <p className="text-xs text-slate-600">Need attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Lead Management with Sorting */}
      <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-emerald-700">
            <User className="h-5 w-5" />
            Lead Management Dashboard ({filteredAndSortedLeads.length} leads)
          </CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg">
                <Plus className="h-4 w-4 mr-2" />
                Add New Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-emerald-700">Add New Lead</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="grid gap-6 py-4">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-800">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="leadName">Full Name *</Label>
                      <Input 
                        id="leadName" 
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                        className="border-emerald-200" 
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="leadEmail">Email Address *</Label>
                      <Input 
                        id="leadEmail" 
                        type="email" 
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                        className="border-emerald-200" 
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="leadNumber">Phone Number *</Label>
                      <Input 
                        id="leadNumber" 
                        value={formData.phone_number}
                        onChange={(e) => setFormData(prev => ({...prev, phone_number: e.target.value}))}
                        className="border-emerald-200" 
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="leadCity">City</Label>
                      <Input 
                        id="leadCity" 
                        value={formData.city}
                        onChange={(e) => setFormData(prev => ({...prev, city: e.target.value}))}
                        className="border-emerald-200" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="leadProfession">Profession</Label>
                    <Input 
                      id="leadProfession" 
                      value={formData.profession}
                      onChange={(e) => setFormData(prev => ({...prev, profession: e.target.value}))}
                      className="border-emerald-200" 
                    />
                  </div>
                </div>

                {/* Lead Management */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-800">Lead Management</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="leadStatus">Status</Label>
                      <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({...prev, status: value as any}))}>
                        <SelectTrigger className="border-emerald-200">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="New">New</SelectItem>
                          <SelectItem value="Hot">Hot</SelectItem>
                          <SelectItem value="Warm">Warm</SelectItem>
                          <SelectItem value="Cold">Cold</SelectItem>
                          <SelectItem value="Failed">Failed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="leadSource">Source</Label>
                      <Select value={formData.source} onValueChange={(value) => setFormData(prev => ({...prev, source: value as any}))}>
                        <SelectTrigger className="border-emerald-200">
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Website">Website</SelectItem>
                          <SelectItem value="Social Media">Social Media</SelectItem>
                          <SelectItem value="Referral">Referral</SelectItem>
                          <SelectItem value="Cold Call">Cold Call</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="leadCounselor">Assigned Counselor</Label>
                      <Input 
                        id="leadCounselor" 
                        value={formData.counselor}
                        onChange={(e) => setFormData(prev => ({...prev, counselor: e.target.value}))}
                        className="border-emerald-200"
                        placeholder="Enter counselor name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="leadPriority">Priority Level</Label>
                      <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({...prev, priority: value as any}))}>
                        <SelectTrigger className="border-emerald-200">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="High">High Priority</SelectItem>
                          <SelectItem value="Medium">Medium Priority</SelectItem>
                          <SelectItem value="Low">Low Priority</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Follow-up Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal border-emerald-200"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 text-emerald-600" />
                          {selectedDate ? format(selectedDate, "PPP") : "Select follow-up date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-800">Additional Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="leadBudget">Budget Range</Label>
                      <Input 
                        id="leadBudget" 
                        value={formData.budget}
                        onChange={(e) => setFormData(prev => ({...prev, budget: e.target.value}))}
                        className="border-emerald-200"
                        placeholder="e.g., $1000-2000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="leadTimeline">Timeline</Label>
                      <Input 
                        id="leadTimeline" 
                        value={formData.timeline}
                        onChange={(e) => setFormData(prev => ({...prev, timeline: e.target.value}))}
                        className="border-emerald-200"
                        placeholder="e.g., Within 1 week"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="leadNotes">Notes</Label>
                    <Textarea
                      id="leadNotes"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({...prev, notes: e.target.value}))}
                      placeholder="Add any additional notes about the lead..."
                      className="border-emerald-200"
                      rows={4}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAddDialogOpen(false)
                      resetForm()
                    }}
                    className="border-emerald-200 text-emerald-700"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      'Add Lead'
                    )}
                  </Button>
                </div>
              </form>
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
                    onClick={() => handleSort("created_at")}
                    className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                  >
                    Created Date
                    {getSortIcon("created_at")}
                  </Button>
                </TableHead>
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
                <TableHead>Phone Number</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("counselor")}
                    className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                  >
                    Counsellor
                    {getSortIcon("counselor")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("city")}
                    className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                  >
                    City
                    {getSortIcon("city")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("profession")}
                    className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                  >
                    Profession
                    {getSortIcon("profession")}
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
                    onClick={() => handleSort("follow_up_date")}
                    className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                  >
                    Follow Up Date
                    {getSortIcon("follow_up_date")}
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
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
             {filteredAndSortedLeads.map((lead) => (
              <TableRow
                key={lead.id}
                onClick={() => handleRowClick(lead.id)}
                className="cursor-pointer hover:bg-emerald-50/50"
              >
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <CalendarIcon className="h-3 w-3 text-emerald-600" />
                      {format(new Date(lead.created_at), 'MMM dd, yyyy')}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="/placeholder.svg" alt={lead.name} />
                        <AvatarFallback className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs">
                          {lead.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div>{lead.name}</div>
                        <div className="text-xs text-slate-500">{lead.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3 text-emerald-600" />
                      {lead.phone_number}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3 text-emerald-600" />
                      {lead.counselor || 'Unassigned'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-emerald-600" />
                      {lead.city || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>{lead.profession || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge className={`${getStatusColor(lead.status)} text-xs flex items-center gap-1 w-fit`}>
                      {getStatusIcon(lead.status)}
                      {lead.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-emerald-600" />
                      {lead.follow_up_date ? format(new Date(lead.follow_up_date), 'MMM dd, yyyy') : 'Not set'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                      {lead.source || 'Unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(lead)}
                        className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => deleteLead(lead.id)}
                        className="border-red-200 text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-emerald-700">Edit Lead</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-6 py-4">
            {/* Same form structure as Add dialog but with edit functionality */}
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editLeadName">Full Name *</Label>
                  <Input 
                    id="editLeadName" 
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                    className="border-emerald-200" 
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editLeadEmail">Email Address *</Label>
                  <Input 
                    id="editLeadEmail" 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                    className="border-emerald-200" 
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editLeadNumber">Phone Number *</Label>
                  <Input 
                    id="editLeadNumber" 
                    value={formData.phone_number}
                    onChange={(e) => setFormData(prev => ({...prev, phone_number: e.target.value}))}
                    className="border-emerald-200" 
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editLeadCity">City</Label>
                  <Input 
                    id="editLeadCity" 
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({...prev, city: e.target.value}))}
                    className="border-emerald-200" 
                  />
                </div>
              </div>
            </div>

            {/* Lead Management */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800">Lead Management</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({...prev, status: value as any}))}>
                    <SelectTrigger className="border-emerald-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="New">New</SelectItem>
                      <SelectItem value="Hot">Hot</SelectItem>
                      <SelectItem value="Warm">Warm</SelectItem>
                      <SelectItem value="Cold">Cold</SelectItem>
                      <SelectItem value="Failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({...prev, priority: value as any}))}>
                    <SelectTrigger className="border-emerald-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">High Priority</SelectItem>
                      <SelectItem value="Medium">Medium Priority</SelectItem>
                      <SelectItem value="Low">Low Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false)
                  setEditingLead(null)
                }}
                className="border-emerald-200 text-emerald-700"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Lead'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Lead Performance Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-50 to-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-700">
              <TrendingUp className="h-5 w-5" />
              Lead Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-white/70 rounded-lg backdrop-blur-sm">
                <span className="font-medium">Total Leads</span>
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">{stats.total}</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/70 rounded-lg backdrop-blur-sm">
                <span className="font-medium">Conversion Rate</span>
                <Badge className="bg-blue-100 text-blue-700 border-blue-200">{stats.conversionRate}%</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/70 rounded-lg backdrop-blur-sm">
                <span className="font-medium">Average Lead Score</span>
                <Badge className="bg-purple-100 text-purple-700 border-purple-200">{stats.avgLeadScore}/100</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/70 rounded-lg backdrop-blur-sm">
                <span className="font-medium">High Priority Leads</span>
                <Badge className="bg-orange-100 text-orange-700 border-orange-200">{stats.highPriority}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Target className="h-5 w-5" />
              Source Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {["Website", "Social Media", "Referral", "Cold Call"].map((source) => {
                const sourceLeads = leads.filter((l) => l.source === source)
                const conversionRate = sourceLeads.length
                  ? (
                      (sourceLeads.filter((l) => ["Hot", "Warm"].includes(l.status)).length / sourceLeads.length) *
                      100
                    ).toFixed(1)
                  : "0"
                return (
                  <div
                    key={source}
                    className="flex justify-between items-center p-3 bg-white/70 rounded-lg backdrop-blur-sm"
                  >
                    <div>
                      <span className="font-medium">{source}</span>
                      <div className="text-sm text-slate-600">{sourceLeads.length} leads</div>
                    </div>
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200">{conversionRate}%</Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}