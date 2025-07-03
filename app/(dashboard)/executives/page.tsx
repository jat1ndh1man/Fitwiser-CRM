"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  User,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Clock,
  FileText,
  Target,
  DollarSign,
  MessageSquare,
  Activity,
  Filter,
  Search,
  TrendingUp,
  Users,
  Calendar,
  Award,
  BookOpen,
  Settings,
  BarChart3,
  PieChart,
  Loader2,
  AlertCircle,
  Save,
  Star,
  ChevronDown,
  ChevronRight,
  Eye,
  Edit3,
  RefreshCw
} from "lucide-react"
import { format } from "date-fns"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { createClient } from '@supabase/supabase-js'
import { toast } from "sonner"

// Types
interface Executive {
  id: string
  email: string
  phone: string
  first_name: string
  last_name: string
  profile_image_url?: string
  specialty?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface ExecutiveInfo {
  id?: string
  user_id: string
  
  // Contact & Personal Information
  alternate_phone?: string
  emergency_contact?: string
  address?: string
  pincode?: string
  date_of_birth?: string
  gender?: string
  marital_status?: string
  
  // Professional Information
  employee_id?: string
  department?: string
  designation?: string
  reporting_manager_id?: string
  date_of_joining?: string
  employment_type?: string
  salary_grade?: string
  experience_years?: number
  previous_experience?: string
  
  // Performance & Sales
  monthly_target?: number
  quarterly_target?: number
  annual_target?: number
  current_month_sales?: number
  current_quarter_sales?: number
  current_year_sales?: number
  total_lifetime_sales?: number
  best_month_sales?: number
  average_deal_size?: number
  
  // Lead Management
  total_leads_assigned?: number
  total_leads_converted?: number
  current_active_leads?: number
  conversion_rate?: number
  average_response_time?: number
  follow_up_efficiency?: number
  
  // Skills & Specializations
  specializations?: string[]
  skills?: string[]
  certifications?: string[]
  languages_spoken?: string[]
  
  // Availability & Preferences
  working_hours_start?: string
  working_hours_end?: string
  time_zone?: string
  preferred_communication?: string
  availability_schedule?: string
  
  // Recognition & Achievements
  awards?: string[]
  achievements?: string
  performance_rating?: number
  customer_satisfaction_score?: number
  team_collaboration_score?: number
  
  // Training & Development
  last_training_date?: string
  training_completed?: string[]
  upcoming_trainings?: string[]
  development_goals?: string
  
  // Administrative
  bank_account_number?: string
  bank_ifsc_code?: string
  pan_number?: string
  aadhar_number?: string
  
  // Internal Notes
  manager_notes?: string
  hr_notes?: string
  performance_notes?: string
  internal_tags?: string[]
}

interface LeadAssignment {
  id: string
  lead_id: string
  assigned_to: string
  status: string
  priority: string
  assigned_at: string
  due_date?: string
  completed_at?: string
  lead?: {
    id: string
    name: string
    email: string
    status: string
    priority: string
  }
}

export default function ExecutiveInformationPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  // State management
  const [executives, setExecutives] = useState<Executive[]>([])
  const [selectedExecutive, setSelectedExecutive] = useState<Executive | null>(null)
  const [executiveInfo, setExecutiveInfo] = useState<ExecutiveInfo | null>(null)
  const [assignments, setAssignments] = useState<LeadAssignment[]>([])
  const [reportingManagers, setReportingManagers] = useState<Executive[]>([])
  const [assignmentsLoading, setAssignmentsLoading] = useState(false)
  
  // UI State
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  
  const [collapsedSections, setCollapsedSections] = useState({
    contact: false,
    professional: false,
    performance: false,
    leadManagement: false,
    skills: false,
    availability: false,
    recognition: false,
    training: false,
    administrative: false,
    notes: false,
  })

  // Executive role ID
  const executiveRoleId = "1fe1759c-dc14-4933-947a-c240c046bcde"

  // Fetch all executives
  const fetchExecutives = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role_id', executiveRoleId)
        .order('first_name', { ascending: true })
      
      if (error) throw error
      setExecutives(data || [])
      setReportingManagers(data || []) // Same executives can be reporting managers
    } catch (error) {
      console.error('Error fetching executives:', error)
      toast.error('Failed to fetch executives')
    } finally {
      setLoading(false)
    }
  }

  // Fetch executive info
  const fetchExecutiveInfo = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('executive_information')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      return data
    } catch (error) {
      console.error('Error fetching executive info:', error)
      return null
    }
  }

  // Fetch lead assignments for executive
  const fetchExecutiveAssignments = async (userId: string) => {
    try {
      console.log('Fetching assignments for executive:', userId) // Debug log
      
      const { data, error } = await supabase
        .from('lead_assignments')
        .select(`
          *,
          lead:leads(
            id,
            name,
            email,
            status,
            priority
          )
        `)
        .eq('assigned_to', userId)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching assignments:', error)
        throw error
      }
      
      console.log('Fetched assignments:', data) // Debug log
      return data || []
    } catch (error) {
      console.error('Error fetching assignments:', error)
      toast.error('Failed to fetch lead assignments')
      return []
    }
  }

  // Calculate performance metrics dynamically
  const calculatePerformanceMetrics = (assignments: LeadAssignment[]) => {
    const totalAssignments = assignments.length
    const activeAssignments = assignments.filter(a => a.status === 'active').length
    const completedAssignments = assignments.filter(a => a.status === 'completed').length
    const cancelledAssignments = assignments.filter(a => a.status === 'cancelled').length
    const conversionRate = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0
    
    // Calculate high priority leads
    const highPriorityLeads = assignments.filter(a => a.priority === 'High').length
    
    // Calculate overdue assignments
    const now = new Date()
    const overdueAssignments = assignments.filter(a => {
      if (a.status !== 'active' || !a.due_date) return false
      return new Date(a.due_date) < now
    }).length
    
    // Calculate average response time (mock calculation - would need actual response data)
    const averageResponseTime = 24 // hours - this should be calculated from actual response data
    
    return {
      totalAssignments,
      activeAssignments,
      completedAssignments,
      cancelledAssignments,
      conversionRate,
      highPriorityLeads,
      overdueAssignments,
      averageResponseTime
    }
  }

  // Dynamic metrics calculated from current assignments
  const currentMetrics = selectedExecutive ? calculatePerformanceMetrics(assignments) : {
    totalAssignments: 0,
    activeAssignments: 0,
    completedAssignments: 0,
    cancelledAssignments: 0,
    conversionRate: 0,
    highPriorityLeads: 0,
    overdueAssignments: 0,
    averageResponseTime: 0
  }

  // Handle executive selection
  const handleExecutiveSelection = async (executiveId: string) => {
    setLoading(true)
    setAssignmentsLoading(true)
    try {
      const executive = executives.find(e => e.id === executiveId)
      if (!executive) return

      setSelectedExecutive(executive)
      
      // Fetch executive info
      const executiveInfoData = await fetchExecutiveInfo(executiveId)
      setExecutiveInfo(executiveInfoData || {
        user_id: executiveId,
        specializations: [],
        skills: [],
        certifications: [],
        languages_spoken: [],
        awards: [],
        training_completed: [],
        upcoming_trainings: [],
        internal_tags: []
      })
      
      // Fetch assignments
      console.log('Starting to fetch assignments for:', executiveId)
      const assignmentsData = await fetchExecutiveAssignments(executiveId)
      console.log('Assignments data received:', assignmentsData)
      setAssignments(assignmentsData)
      
      if (assignmentsData.length > 0) {
        toast.success(`Loaded ${assignmentsData.length} assignments for ${executive.first_name} ${executive.last_name}`)
      } else {
        toast.info(`No assignments found for ${executive.first_name} ${executive.last_name}`)
      }
      
    } catch (error) {
      console.error('Error selecting executive:', error)
      toast.error('Failed to load executive information')
    } finally {
      setLoading(false)
      setAssignmentsLoading(false)
    }
  }

  // Refresh assignments only
  const refreshAssignments = async () => {
    if (!selectedExecutive) return
    
    setAssignmentsLoading(true)
    try {
      console.log('Refreshing assignments for:', selectedExecutive.id)
      const assignmentsData = await fetchExecutiveAssignments(selectedExecutive.id)
      console.log('Refreshed assignments data:', assignmentsData)
      setAssignments(assignmentsData)
      toast.success(`Refreshed assignments: ${assignmentsData.length} found`)
    } catch (error) {
      console.error('Error refreshing assignments:', error)
      toast.error('Failed to refresh assignments')
    } finally {
      setAssignmentsLoading(false)
    }
  }

  // Update executive info with calculated metrics whenever assignments change
  useEffect(() => {
    if (selectedExecutive && executiveInfo && assignments.length >= 0) {
      const metrics = calculatePerformanceMetrics(assignments)
      
      // Update the executiveInfo with calculated metrics
      setExecutiveInfo(prev => prev ? {
        ...prev,
        total_leads_assigned: metrics.totalAssignments,
        total_leads_converted: metrics.completedAssignments,
        current_active_leads: metrics.activeAssignments,
        conversion_rate: metrics.conversionRate,
        average_response_time: metrics.averageResponseTime,
        follow_up_efficiency: metrics.conversionRate // Using conversion rate as efficiency for now
      } : null)
    }
  }, [assignments, selectedExecutive])

  // Save executive info
  const saveExecutiveInfo = async () => {
    if (!executiveInfo || !selectedExecutive) return
    
    setSaving(true)
    try {
      const dataToSave = {
        ...executiveInfo,
        updated_at: new Date().toISOString()
      }

      if (executiveInfo.id) {
        // Update existing
        const { error } = await supabase
          .from('executive_information')
          .update(dataToSave)
          .eq('id', executiveInfo.id)
        
        if (error) throw error
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('executive_information')
          .insert([dataToSave])
          .select()
          .single()
        
        if (error) throw error
        setExecutiveInfo({ ...executiveInfo, id: data.id })
      }
      
      toast.success('Executive information saved successfully')
    } catch (error) {
      console.error('Error saving executive info:', error)
      toast.error('Failed to save executive information')
    } finally {
      setSaving(false)
    }
  }

  // Initialize data
  useEffect(() => {
    fetchExecutives()
  }, [])

  // Utility functions
  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section as keyof typeof prev]
    }))
  }

  const getExecutiveName = (executive: Executive | null | undefined) => {
    if (!executive) return "Unknown Executive"
    return `${executive.first_name || ''} ${executive.last_name || ''}`.trim() || "Unknown Executive"
  }

  const getPerformanceColor = (rating: number) => {
    if (rating >= 4.5) return "text-emerald-600"
    if (rating >= 3.5) return "text-blue-600"
    if (rating >= 2.5) return "text-yellow-600"
    return "text-red-600"
  }

  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return "$0"
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  // Filter executives
  const filteredExecutives = executives.filter(executive => {
    const matchesSearch = 
      getExecutiveName(executive).toLowerCase().includes(searchTerm.toLowerCase()) ||
      executive.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (executive.phone || '').includes(searchTerm)
    const matchesDepartment = departmentFilter === "all" // Add department filtering logic
    const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? executive.is_active : !executive.is_active)

    return matchesSearch && matchesDepartment && matchesStatus
  })

  if (loading && !selectedExecutive) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <span className="ml-2 text-emerald-600">Loading executives...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Executive Selection */}
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-700">
            <Filter className="h-5 w-5" />
            Executive Selection & Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Search Executives</Label>
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
              <Label className="text-sm font-medium text-slate-700">Department</Label>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="border-emerald-200 hover:border-emerald-300">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="operations">Operations</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-emerald-200 hover:border-emerald-300">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Select Executive</Label>
              <Select 
                value={selectedExecutive?.id || ""} 
                onValueChange={handleExecutiveSelection}
              >
                <SelectTrigger className="border-emerald-200 hover:border-emerald-300">
                  <SelectValue placeholder="Select an executive" />
                </SelectTrigger>
                <SelectContent>
                  {filteredExecutives.map((executive) => (
                    <SelectItem key={executive.id} value={executive.id}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${executive.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span>{getExecutiveName(executive)}</span>
                        <Badge variant="outline" className="text-xs">
                          {executive.specialty || 'General'}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedExecutive && executiveInfo && (
        <>
          {/* Executive Profile Header */}
          <Card className="border-0 shadow-xl bg-gradient-to-b from-emerald-100 to-emerald-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24 border-4 border-emerald-200">
                  <AvatarImage src={selectedExecutive.profile_image_url} alt={getExecutiveName(selectedExecutive)} />
                  <AvatarFallback className="text-2xl font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                    {selectedExecutive.first_name?.[0]}{selectedExecutive.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-3xl font-bold text-slate-800">{getExecutiveName(selectedExecutive)}</h2>
                    <Badge className={`${selectedExecutive.is_active ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                      {selectedExecutive.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-slate-600 text-lg mb-3">
                    {executiveInfo.designation || 'Executive'} • {executiveInfo.department || 'General'}
                  </p>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                      ID: {executiveInfo.employee_id || 'Not Set'}
                    </Badge>
                    <Badge variant="outline" className="border-blue-200 text-blue-700">
                      Exp: {executiveInfo.experience_years || 0} years
                    </Badge>
                    {executiveInfo.performance_rating && (
                      <Badge variant="outline" className="border-yellow-200 text-yellow-700">
                        ⭐ {executiveInfo.performance_rating}/5.0
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-white/80 rounded-lg p-3 border border-emerald-200">
                      <div className="text-2xl font-bold text-emerald-600">{currentMetrics.activeAssignments}</div>
                      <div className="text-sm text-slate-600">Active Leads</div>
                    </div>
                    <div className="bg-white/80 rounded-lg p-3 border border-emerald-200">
                      <div className="text-2xl font-bold text-blue-600">{currentMetrics.conversionRate}%</div>
                      <div className="text-sm text-slate-600">Conversion</div>
                    </div>
                    <div className="bg-white/80 rounded-lg p-3 border border-emerald-200">
                      <div className="text-2xl font-bold text-green-600">{formatCurrency(executiveInfo.current_month_sales)}</div>
                      <div className="text-sm text-slate-600">This Month</div>
                    </div>
                    <div className="bg-white/80 rounded-lg p-3 border border-emerald-200">
                      <div className="text-2xl font-bold text-purple-600">{formatCurrency(executiveInfo.total_lifetime_sales)}</div>
                      <div className="text-sm text-slate-600">Lifetime</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Debug Information - Remove in production */}
          {selectedExecutive && (
            <Card className="border-0 shadow-xl bg-yellow-50/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-700">
                  <AlertCircle className="h-5 w-5" />
                  Debug Information (Remove in Production)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <strong>Executive ID:</strong> {selectedExecutive.id}
                  </div>
                  <div>
                    <strong>Assignments Fetched:</strong> {assignments.length}
                  </div>
                  <div>
                    <strong>Active Count:</strong> {currentMetrics.activeAssignments}
                  </div>
                  <div>
                    <strong>Completed Count:</strong> {currentMetrics.completedAssignments}
                  </div>
                  <div>
                    <strong>Total Assigned:</strong> {currentMetrics.totalAssignments}
                  </div>
                  <div>
                    <strong>Conversion Rate:</strong> {currentMetrics.conversionRate}%
                  </div>
                  <div>
                    <strong>High Priority:</strong> {currentMetrics.highPriorityLeads}
                  </div>
                  <div>
                    <strong>Overdue:</strong> {currentMetrics.overdueAssignments}
                  </div>
                </div>
                <div className="mt-4">
                  <strong>Assignment Statuses:</strong>
                  <div className="mt-2 space-y-1">
                    {assignments.map((a, i) => (
                      <div key={i} className="text-xs">
                        {i + 1}. {a.lead?.name || 'Unknown'} - Status: {a.status} - Priority: {a.priority} - Lead Priority: {a.lead?.priority}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contact & Personal Information */}
          <Collapsible open={!collapsedSections.contact} onOpenChange={() => toggleSection("contact")}>
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-emerald-50/50 transition-colors">
                  <CardTitle className="flex items-center justify-between text-emerald-700">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Contact & Personal Information
                    </div>
                    {collapsedSections.contact ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Full Name</Label>
                      <Input 
                        value={getExecutiveName(selectedExecutive)} 
                        readOnly 
                        className="bg-slate-50" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Email</Label>
                      <Input 
                        value={selectedExecutive.email} 
                        readOnly 
                        className="bg-slate-50" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Primary Phone</Label>
                      <Input 
                        value={selectedExecutive.phone || ''} 
                        readOnly 
                        className="bg-slate-50" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Alternate Phone</Label>
                      <Input
                        value={executiveInfo.alternate_phone || ""}
                        onChange={(e) => setExecutiveInfo({...executiveInfo, alternate_phone: e.target.value})}
                        className="border-emerald-200"
                        placeholder="Enter alternate phone"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Emergency Contact</Label>
                      <Input
                        value={executiveInfo.emergency_contact || ""}
                        onChange={(e) => setExecutiveInfo({...executiveInfo, emergency_contact: e.target.value})}
                        className="border-emerald-200"
                        placeholder="Enter emergency contact"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Pincode</Label>
                      <Input
                        value={executiveInfo.pincode || ""}
                        onChange={(e) => setExecutiveInfo({...executiveInfo, pincode: e.target.value})}
                        className="border-emerald-200"
                        placeholder="Enter pincode"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Address</Label>
                    <Textarea
                      value={executiveInfo.address || ""}
                      onChange={(e) => setExecutiveInfo({...executiveInfo, address: e.target.value})}
                      className="border-emerald-200"
                      placeholder="Enter full address"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Date of Birth</Label>
                      <Input
                        type="date"
                        value={executiveInfo.date_of_birth || ""}
                        onChange={(e) => setExecutiveInfo({...executiveInfo, date_of_birth: e.target.value})}
                        className="border-emerald-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Gender</Label>
                      <Select 
                        value={executiveInfo.gender || ""}
                        onValueChange={(value) => setExecutiveInfo({...executiveInfo, gender: value})}
                      >
                        <SelectTrigger className="border-emerald-200">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                          <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Marital Status</Label>
                      <Select 
                        value={executiveInfo.marital_status || ""}
                        onValueChange={(value) => setExecutiveInfo({...executiveInfo, marital_status: value})}
                      >
                        <SelectTrigger className="border-emerald-200">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Single">Single</SelectItem>
                          <SelectItem value="Married">Married</SelectItem>
                          <SelectItem value="Divorced">Divorced</SelectItem>
                          <SelectItem value="Widowed">Widowed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Professional Information */}
          <Collapsible open={!collapsedSections.professional} onOpenChange={() => toggleSection("professional")}>
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-emerald-50/50 transition-colors">
                  <CardTitle className="flex items-center justify-between text-emerald-700">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      Professional Information
                    </div>
                    {collapsedSections.professional ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Employee ID</Label>
                      <Input
                        value={executiveInfo.employee_id || ""}
                        onChange={(e) => setExecutiveInfo({...executiveInfo, employee_id: e.target.value})}
                        className="border-emerald-200"
                        placeholder="e.g., EMP001"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Department</Label>
                      <Select 
                        value={executiveInfo.department || ""}
                        onValueChange={(value) => setExecutiveInfo({...executiveInfo, department: value})}
                      >
                        <SelectTrigger className="border-emerald-200">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Sales">Sales</SelectItem>
                          <SelectItem value="Marketing">Marketing</SelectItem>
                          <SelectItem value="Support">Support</SelectItem>
                          <SelectItem value="Operations">Operations</SelectItem>
                          <SelectItem value="HR">HR</SelectItem>
                          <SelectItem value="Finance">Finance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Designation</Label>
                      <Input
                        value={executiveInfo.designation || ""}
                        onChange={(e) => setExecutiveInfo({...executiveInfo, designation: e.target.value})}
                        className="border-emerald-200"
                        placeholder="e.g., Senior Sales Executive"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Reporting Manager</Label>
                      <Select 
                        value={executiveInfo.reporting_manager_id || ""}
                        onValueChange={(value) => setExecutiveInfo({...executiveInfo, reporting_manager_id: value})}
                      >
                        <SelectTrigger className="border-emerald-200">
                          <SelectValue placeholder="Select manager" />
                        </SelectTrigger>
                        <SelectContent>
                          {reportingManagers.filter(m => m.id !== selectedExecutive.id).map((manager) => (
                            <SelectItem key={manager.id} value={manager.id}>
                              {getExecutiveName(manager)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Date of Joining</Label>
                      <Input
                        type="date"
                        value={executiveInfo.date_of_joining || ""}
                        onChange={(e) => setExecutiveInfo({...executiveInfo, date_of_joining: e.target.value})}
                        className="border-emerald-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Employment Type</Label>
                      <Select 
                        value={executiveInfo.employment_type || ""}
                        onValueChange={(value) => setExecutiveInfo({...executiveInfo, employment_type: value})}
                      >
                        <SelectTrigger className="border-emerald-200">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Full-time">Full-time</SelectItem>
                          <SelectItem value="Part-time">Part-time</SelectItem>
                          <SelectItem value="Contract">Contract</SelectItem>
                          <SelectItem value="Internship">Internship</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Experience (Years)</Label>
                      <Input
                        type="number"
                        value={executiveInfo.experience_years || ""}
                        onChange={(e) => setExecutiveInfo({...executiveInfo, experience_years: parseInt(e.target.value) || 0})}
                        className="border-emerald-200"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Previous Experience</Label>
                    <Textarea
                      value={executiveInfo.previous_experience || ""}
                      onChange={(e) => setExecutiveInfo({...executiveInfo, previous_experience: e.target.value})}
                      className="border-emerald-200"
                      placeholder="Describe previous work experience..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Performance & Sales */}
          <Collapsible open={!collapsedSections.performance} onOpenChange={() => toggleSection("performance")}>
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-emerald-50/50 transition-colors">
                  <CardTitle className="flex items-center justify-between text-emerald-700">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Performance & Sales
                    </div>
                    {collapsedSections.performance ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-6">
                  {/* Sales Targets */}
                  <div>
                    <h4 className="font-medium text-slate-800 mb-3">Sales Targets</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">Monthly Target</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={executiveInfo.monthly_target || ""}
                          onChange={(e) => setExecutiveInfo({...executiveInfo, monthly_target: parseFloat(e.target.value) || 0})}
                          className="border-emerald-200"
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">Quarterly Target</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={executiveInfo.quarterly_target || ""}
                          onChange={(e) => setExecutiveInfo({...executiveInfo, quarterly_target: parseFloat(e.target.value) || 0})}
                          className="border-emerald-200"
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">Annual Target</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={executiveInfo.annual_target || ""}
                          onChange={(e) => setExecutiveInfo({...executiveInfo, annual_target: parseFloat(e.target.value) || 0})}
                          className="border-emerald-200"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Current Sales Performance */}
                  <div>
                    <h4 className="font-medium text-slate-800 mb-3">Current Sales Performance</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-lg border border-emerald-200">
                        <div className="text-sm text-emerald-600 font-medium">This Month</div>
                        <div className="text-2xl font-bold text-emerald-700">
                          {formatCurrency(executiveInfo.current_month_sales)}
                        </div>
                        <div className="text-xs text-emerald-600">
                          Target: {formatCurrency(executiveInfo.monthly_target)}
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                        <div className="text-sm text-blue-600 font-medium">This Quarter</div>
                        <div className="text-2xl font-bold text-blue-700">
                          {formatCurrency(executiveInfo.current_quarter_sales)}
                        </div>
                        <div className="text-xs text-blue-600">
                          Target: {formatCurrency(executiveInfo.quarterly_target)}
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                        <div className="text-sm text-purple-600 font-medium">This Year</div>
                        <div className="text-2xl font-bold text-purple-700">
                          {formatCurrency(executiveInfo.current_year_sales)}
                        </div>
                        <div className="text-xs text-purple-600">
                          Target: {formatCurrency(executiveInfo.annual_target)}
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg border border-orange-200">
                        <div className="text-sm text-orange-600 font-medium">Lifetime</div>
                        <div className="text-2xl font-bold text-orange-700">
                          {formatCurrency(executiveInfo.total_lifetime_sales)}
                        </div>
                        <div className="text-xs text-orange-600">
                          Best Month: {formatCurrency(executiveInfo.best_month_sales)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Average Deal Size</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={executiveInfo.average_deal_size || ""}
                        onChange={(e) => setExecutiveInfo({...executiveInfo, average_deal_size: parseFloat(e.target.value) || 0})}
                        className="border-emerald-200"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Best Month Sales</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={executiveInfo.best_month_sales || ""}
                        onChange={(e) => setExecutiveInfo({...executiveInfo, best_month_sales: parseFloat(e.target.value) || 0})}
                        className="border-emerald-200"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Lead Management */}
          <Collapsible open={!collapsedSections.leadManagement} onOpenChange={() => toggleSection("leadManagement")}>
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-emerald-50/50 transition-colors">
                  <CardTitle className="flex items-center justify-between text-emerald-700">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Lead Management & Performance
                    </div>
                    {collapsedSections.leadManagement ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                      <div className="text-sm text-blue-600 font-medium">Total Assigned</div>
                      <div className="text-3xl font-bold text-blue-700">{currentMetrics.totalAssignments}</div>
                      <div className="text-xs text-blue-500 mt-1">All time assignments</div>
                    </div>
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                      <div className="text-sm text-green-600 font-medium">Converted</div>
                      <div className="text-3xl font-bold text-green-700">{currentMetrics.completedAssignments}</div>
                      <div className="text-xs text-green-500 mt-1">Successfully closed</div>
                    </div>
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border border-yellow-200">
                      <div className="text-sm text-yellow-600 font-medium">Active</div>
                      <div className="text-3xl font-bold text-yellow-700">{currentMetrics.activeAssignments}</div>
                      <div className="text-xs text-yellow-500 mt-1">Currently working on</div>
                    </div>
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                      <div className="text-sm text-purple-600 font-medium">Conversion Rate</div>
                      <div className="text-3xl font-bold text-purple-700">{currentMetrics.conversionRate}%</div>
                      <div className="text-xs text-purple-500 mt-1">Success percentage</div>
                    </div>
                  </div>

                  {/* Additional Performance Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-r from-red-50 to-orange-50 p-4 rounded-lg border border-red-200">
                      <div className="text-sm text-red-600 font-medium">High Priority</div>
                      <div className="text-3xl font-bold text-red-700">{currentMetrics.highPriorityLeads}</div>
                      <div className="text-xs text-red-500 mt-1">Urgent leads</div>
                    </div>
                    <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-4 rounded-lg border border-gray-200">
                      <div className="text-sm text-gray-600 font-medium">Cancelled</div>
                      <div className="text-3xl font-bold text-gray-700">{currentMetrics.cancelledAssignments}</div>
                      <div className="text-xs text-gray-500 mt-1">Not proceeded</div>
                    </div>
                    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-4 rounded-lg border border-amber-200">
                      <div className="text-sm text-amber-600 font-medium">Overdue</div>
                      <div className="text-3xl font-bold text-amber-700">{currentMetrics.overdueAssignments}</div>
                      <div className="text-xs text-amber-500 mt-1">Past due date</div>
                    </div>
                    <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-4 rounded-lg border border-teal-200">
                      <div className="text-sm text-teal-600 font-medium">Avg Response</div>
                      <div className="text-3xl font-bold text-teal-700">{currentMetrics.averageResponseTime}h</div>
                      <div className="text-xs text-teal-500 mt-1">Response time</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Average Response Time (Hours)</Label>
                      <Input
                        type="number"
                        value={executiveInfo.average_response_time || currentMetrics.averageResponseTime}
                        onChange={(e) => setExecutiveInfo({...executiveInfo, average_response_time: parseInt(e.target.value) || 0})}
                        className="border-emerald-200"
                        placeholder="24"
                      />
                      <div className="text-xs text-slate-500">Current calculated: {currentMetrics.averageResponseTime} hours</div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Follow-up Efficiency (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={executiveInfo.follow_up_efficiency || currentMetrics.conversionRate}
                        onChange={(e) => setExecutiveInfo({...executiveInfo, follow_up_efficiency: parseFloat(e.target.value) || 0})}
                        className="border-emerald-200"
                        placeholder="0.00"
                      />
                      <div className="text-xs text-slate-500">Current conversion rate: {currentMetrics.conversionRate}%</div>
                    </div>
                  </div>

                  {/* Recent Assignments */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-slate-800">Recent Lead Assignments ({assignments.length} total)</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={refreshAssignments}
                        disabled={assignmentsLoading}
                        className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      >
                        <RefreshCw className={`h-4 w-4 mr-1 ${assignmentsLoading ? 'animate-spin' : ''}`} />
                        {assignmentsLoading ? 'Loading...' : 'Refresh'}
                      </Button>
                    </div>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {assignments.slice(0, 10).map((assignment, index) => (
                        <div key={assignment.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg border hover:shadow-md transition-shadow">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-semibold text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium text-slate-800">{assignment.lead?.name || 'Unknown Lead'}</div>
                              <div className="text-sm text-slate-600">{assignment.lead?.email || 'No email'}</div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={`text-xs ${
                                  assignment.lead?.priority === 'High' ? 'bg-red-100 text-red-700 border-red-200' :
                                  assignment.lead?.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                  'bg-green-100 text-green-700 border-green-200'
                                }`}>
                                  {assignment.lead?.priority || 'Medium'} Priority
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  Lead: {assignment.lead?.status || 'Unknown'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <Badge className={`text-xs mb-2 ${
                              assignment.status === 'completed' ? 'bg-green-100 text-green-700 border-green-200' :
                              assignment.status === 'active' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                              assignment.status === 'cancelled' ? 'bg-red-100 text-red-700 border-red-200' :
                              'bg-gray-100 text-gray-700 border-gray-200'
                            }`}>
                              {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                            </Badge>
                            <div className="text-xs text-slate-500">
                              Assigned: {format(new Date(assignment.assigned_at), 'MMM dd, yyyy')}
                            </div>
                            {assignment.due_date && (
                              <div className="text-xs text-slate-500">
                                Due: {format(new Date(assignment.due_date), 'MMM dd, yyyy')}
                              </div>
                            )}
                            {assignment.completed_at && (
                              <div className="text-xs text-green-600">
                                Completed: {format(new Date(assignment.completed_at), 'MMM dd, yyyy')}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {assignments.length === 0 && (
                        <div className="text-center py-8 text-slate-500">
                          <Target className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                          <p>No lead assignments found</p>
                          <p className="text-sm mt-1">This executive hasn't been assigned any leads yet.</p>
                        </div>
                      )}
                      {assignments.length > 10 && (
                        <div className="text-center py-4">
                          <Badge variant="outline" className="text-slate-600">
                            Showing 10 of {assignments.length} assignments
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Skills & Specializations */}
          <Collapsible open={!collapsedSections.skills} onOpenChange={() => toggleSection("skills")}>
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-emerald-50/50 transition-colors">
                  <CardTitle className="flex items-center justify-between text-emerald-700">
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5" />
                      Skills & Specializations
                    </div>
                    {collapsedSections.skills ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Specializations</Label>
                      <Textarea
                        value={executiveInfo.specializations?.join(', ') || ""}
                        onChange={(e) => setExecutiveInfo({
                          ...executiveInfo, 
                          specializations: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                        })}
                        className="border-emerald-200"
                        placeholder="e.g., B2B Sales, Enterprise Solutions, Lead Generation"
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Skills</Label>
                      <Textarea
                        value={executiveInfo.skills?.join(', ') || ""}
                        onChange={(e) => setExecutiveInfo({
                          ...executiveInfo, 
                          skills: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                        })}
                        className="border-emerald-200"
                        placeholder="e.g., CRM Management, Cold Calling, Negotiation"
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Certifications</Label>
                      <Textarea
                        value={executiveInfo.certifications?.join(', ') || ""}
                        onChange={(e) => setExecutiveInfo({
                          ...executiveInfo, 
                          certifications: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                        })}
                        className="border-emerald-200"
                        placeholder="e.g., Salesforce Certified, HubSpot Certified"
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Languages Spoken</Label>
                      <Textarea
                        value={executiveInfo.languages_spoken?.join(', ') || ""}
                        onChange={(e) => setExecutiveInfo({
                          ...executiveInfo, 
                          languages_spoken: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                        })}
                        className="border-emerald-200"
                        placeholder="e.g., English, Spanish, French"
                        rows={2}
                      />
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Recognition & Achievements */}
          <Collapsible open={!collapsedSections.recognition} onOpenChange={() => toggleSection("recognition")}>
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-emerald-50/50 transition-colors">
                  <CardTitle className="flex items-center justify-between text-emerald-700">
                    <div className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Recognition & Achievements
                    </div>
                    {collapsedSections.recognition ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Performance Rating</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="5"
                          value={executiveInfo.performance_rating || ""}
                          onChange={(e) => setExecutiveInfo({...executiveInfo, performance_rating: parseFloat(e.target.value) || 0})}
                          className="border-emerald-200"
                          placeholder="0.0"
                        />
                        <span className="text-slate-600">/5.0</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Customer Satisfaction</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="5"
                          value={executiveInfo.customer_satisfaction_score || ""}
                          onChange={(e) => setExecutiveInfo({...executiveInfo, customer_satisfaction_score: parseFloat(e.target.value) || 0})}
                          className="border-emerald-200"
                          placeholder="0.0"
                        />
                        <span className="text-slate-600">/5.0</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Team Collaboration</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="5"
                          value={executiveInfo.team_collaboration_score || ""}
                          onChange={(e) => setExecutiveInfo({...executiveInfo, team_collaboration_score: parseFloat(e.target.value) || 0})}
                          className="border-emerald-200"
                          placeholder="0.0"
                        />
                        <span className="text-slate-600">/5.0</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Awards & Recognition</Label>
                    <Textarea
                      value={executiveInfo.awards?.join(', ') || ""}
                      onChange={(e) => setExecutiveInfo({
                        ...executiveInfo, 
                        awards: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                      })}
                      className="border-emerald-200"
                      placeholder="e.g., Employee of the Month, Top Performer Q3 2024"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Achievements</Label>
                    <Textarea
                      value={executiveInfo.achievements || ""}
                      onChange={(e) => setExecutiveInfo({...executiveInfo, achievements: e.target.value})}
                      className="border-emerald-200"
                      placeholder="Describe key achievements and milestones..."
                      rows={4}
                    />
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Administrative Information */}
          <Collapsible open={!collapsedSections.administrative} onOpenChange={() => toggleSection("administrative")}>
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-emerald-50/50 transition-colors">
                  <CardTitle className="flex items-center justify-between text-emerald-700">
                    <div className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Administrative Information
                    </div>
                    {collapsedSections.administrative ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Bank Account Number</Label>
                      <Input
                        value={executiveInfo.bank_account_number || ""}
                        onChange={(e) => setExecutiveInfo({...executiveInfo, bank_account_number: e.target.value})}
                        className="border-emerald-200"
                        placeholder="Enter bank account number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Bank IFSC Code</Label>
                      <Input
                        value={executiveInfo.bank_ifsc_code || ""}
                        onChange={(e) => setExecutiveInfo({...executiveInfo, bank_ifsc_code: e.target.value})}
                        className="border-emerald-200"
                        placeholder="Enter IFSC code"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">PAN Number</Label>
                      <Input
                        value={executiveInfo.pan_number || ""}
                        onChange={(e) => setExecutiveInfo({...executiveInfo, pan_number: e.target.value})}
                        className="border-emerald-200"
                        placeholder="Enter PAN number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Aadhar Number</Label>
                      <Input
                        value={executiveInfo.aadhar_number || ""}
                        onChange={(e) => setExecutiveInfo({...executiveInfo, aadhar_number: e.target.value})}
                        className="border-emerald-200"
                        placeholder="Enter Aadhar number"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Salary Grade</Label>
                    <Input
                      value={executiveInfo.salary_grade || ""}
                      onChange={(e) => setExecutiveInfo({...executiveInfo, salary_grade: e.target.value})}
                      className="border-emerald-200"
                      placeholder="e.g., L1, L2, Senior, Principal"
                    />
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Internal Notes */}
          <Collapsible open={!collapsedSections.notes} onOpenChange={() => toggleSection("notes")}>
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-emerald-50/50 transition-colors">
                  <CardTitle className="flex items-center justify-between text-emerald-700">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Internal Notes & Comments
                    </div>
                    {collapsedSections.notes ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Manager Notes</Label>
                    <Textarea
                      value={executiveInfo.manager_notes || ""}
                      onChange={(e) => setExecutiveInfo({...executiveInfo, manager_notes: e.target.value})}
                      rows={4}
                      className="border-emerald-200 resize-none"
                      placeholder="Notes from reporting manager..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">HR Notes</Label>
                    <Textarea
                      value={executiveInfo.hr_notes || ""}
                      onChange={(e) => setExecutiveInfo({...executiveInfo, hr_notes: e.target.value})}
                      rows={3}
                      className="border-emerald-200 resize-none"
                      placeholder="Notes from HR department..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Performance Notes</Label>
                    <Textarea
                      value={executiveInfo.performance_notes || ""}
                      onChange={(e) => setExecutiveInfo({...executiveInfo, performance_notes: e.target.value})}
                      rows={3}
                      className="border-emerald-200 resize-none"
                      placeholder="Performance review notes and feedback..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Internal Tags</Label>
                    <Textarea
                      value={executiveInfo.internal_tags?.join(', ') || ""}
                      onChange={(e) => setExecutiveInfo({
                        ...executiveInfo, 
                        internal_tags: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                      })}
                      className="border-emerald-200"
                      placeholder="e.g., High Performer, Mentor, Remote Worker"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Button 
              variant="outline"
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              onClick={() => window.location.reload()}
            >
              Reset Changes
            </Button>
            <Button 
              onClick={saveExecutiveInfo}
              disabled={saving}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Executive Information
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}