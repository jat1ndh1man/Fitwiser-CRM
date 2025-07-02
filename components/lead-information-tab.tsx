"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Calendar as CalendarIcon,
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
  Receipt,
  Plus,
  Download,
  Eye,
  ChevronDown,
  ChevronRight,
  Save,
  Loader2,
  AlertCircle,
  Trash2,
  Edit3
} from "lucide-react"
import { format } from "date-fns"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { createClient } from '@supabase/supabase-js'
import { toast } from "sonner"

// Types
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
  conversion_probability: string
  follow_up_date: string
  last_activity_date: string
  budget: string
  timezone: string
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
  profile_image_url?: string
}

interface LeadInfo {
  id?: string
  lead_id: string
  user_id?: string
  alternate_phone?: string
  pincode?: string
  emergency_contact?: string
  preferred_language?: string
  timezone?: string
  best_time_to_connect?: string
  engagement_level?: string
  total_interactions?: number
  current_weight?: string
  target_weight?: string
  weight_to_lose?: string
  want_to_lose?: boolean
  fitness_goals?: string[]
  dietary_restrictions?: string
  medical_conditions?: string
  previous_experience?: string
  motivation_level?: string
  commitment_level?: string
  investment_confidence?: string
  budget_range?: string
  investment_amount?: string
  payment_preference?: string
  how_did_you_hear?: string
  referred_by?: string
  specific_concerns?: string
  availability_schedule?: string
  social_media_handle?: string
  interaction_history?: InteractionHistory[]
  comments?: string
  internal_notes?: string
  tags?: string[]
}

interface InteractionHistory {
  id?: string
  date: string
  type: string
  notes: string
}

interface PaymentHistory {
  id: string
  amount: number
  currency: string
  description: string
  status: string
  created_at: string
  payment_method?: string
  type: 'payment_link' | 'manual_payment'
}

interface Bill {
  id: string
  bill_number: string
  package_name: string
  description: string
  base_amount: number
  bill_type: 'gst' | 'non-gst'
  gst_number?: string
  gst_rate?: number
  gst_amount?: number
  total_amount: number
  place_of_supply?: string
  payment_method?: string
  due_date: string
  payment_status: string
  status: string
  bill_date: string
  created_at: string
}

export default function LeadInformationTab() {
  const supabase = createClient(
   process.env.NEXT_PUBLIC_SUPABASE_URL!,
   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
 )
  
  // State management
  const [leads, setLeads] = useState<Lead[]>([])
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [leadInfo, setLeadInfo] = useState<LeadInfo | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([])
  const [bills, setBills] = useState<Bill[]>([])
  
  // UI State
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sourceFilter, setSourceFilter] = useState("all")
  const [showBillGenerator, setShowBillGenerator] = useState(false)
  const [showInteractionForm, setShowInteractionForm] = useState(false)
  
  // Form states
  const [newBill, setNewBill] = useState({
    package_name: "",
    base_amount: "",
    description: "",
    due_date: "",
    payment_method: "Credit Card",
    bill_type: "non-gst" as 'gst' | 'non-gst',
    gst_number: "",
    gst_rate: "18",
    place_of_supply: ""
  })
  
  const [newInteraction, setNewInteraction] = useState({
    date: new Date().toISOString().split('T')[0],
    type: "",
    notes: ""
  })
  
  const [collapsedSections, setCollapsedSections] = useState({
    contact: false,
    leadManagement: false,
    fitnessGoals: false,
    investment: false,
    additionalInfo: false,
    interactionHistory: false,
    comments: false,
    billing: false,
  })

  // Fetch all leads
  const fetchLeads = async () => {
     setLoading(true)
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setLeads(data || [])
    } catch (error) {
      console.error('Error fetching leads:', error)
      toast.error('Failed to fetch leads')
    }finally {
     setLoading(false)
    }
  }

  // Find user by lead phone/email
  const findUserByLead = async (lead: Lead) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`phone.eq.${lead.phone_number},email.eq.${lead.email}`)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      return data
    } catch (error) {
      console.error('Error finding user:', error)
      return null
    }
  }

  // Fetch lead info
  const fetchLeadInfo = async (leadId: string) => {
    try {
      const { data, error } = await supabase
        .from('lead_info')
        .select('*')
        .eq('lead_id', leadId)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      return data
    } catch (error) {
      console.error('Error fetching lead info:', error)
      return null
    }
  }

  // Fetch payment history
  const fetchPaymentHistory = async (userId: string) => {
    try {
      const [paymentLinksResult, manualPaymentsResult] = await Promise.all([
        supabase
          .from('payment_links')
          .select('id, amount, currency, description, status, created_at')
          .eq('user_id', userId),
        supabase
          .from('manual_payment')
          .select('id, amount, currency, description, payment_method, status, created_at')
          .eq('user_id', userId)
      ])

      const paymentLinks = (paymentLinksResult.data || []).map(p => ({
        ...p,
        type: 'payment_link' as const
      }))
      
      const manualPayments = (manualPaymentsResult.data || []).map(p => ({
        ...p,
        type: 'manual_payment' as const
      }))

      return [...paymentLinks, ...manualPayments]
    } catch (error) {
      console.error('Error fetching payment history:', error)
      return []
    }
  }

  // Fetch bills
  const fetchBills = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('bills')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching bills:', error)
      return []
    }
  }

  // Handle lead selection
  const handleLeadSelection = async (leadId: string) => {
    setLoading(true)
    try {
      const lead = leads.find(l => l.id === leadId)
      if (!lead) return

      setSelectedLead(lead)
      
      // Find associated user
      const userData = await findUserByLead(lead)
      setUser(userData)
      
      // Fetch lead info
      const leadInfoData = await fetchLeadInfo(leadId)
      setLeadInfo(leadInfoData || {
        lead_id: leadId,
        user_id: userData?.id,
        interaction_history: [],
        tags: [],
        fitness_goals: []
      })
      
      // Fetch payment history and bills if user exists
      if (userData) {
        const [paymentHistoryData, billsData] = await Promise.all([
          fetchPaymentHistory(userData.id),
          fetchBills(userData.id)
        ])
        setPaymentHistory(paymentHistoryData)
        setBills(billsData)
      } else {
        setPaymentHistory([])
        setBills([])
      }
    } catch (error) {
      console.error('Error selecting lead:', error)
      toast.error('Failed to load lead information')
    } finally {
      setLoading(false)
    }
  }

  // Save lead info
  const saveLeadInfo = async () => {
    if (!leadInfo || !selectedLead) return
    
    setSaving(true)
    try {
      const dataToSave = {
        ...leadInfo,
        updated_at: new Date().toISOString()
      }

      if (leadInfo.id) {
        // Update existing
        const { error } = await supabase
          .from('lead_info')
          .update(dataToSave)
          .eq('id', leadInfo.id)
        
        if (error) throw error
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('lead_info')
          .insert([dataToSave])
          .select()
          .single()
        
        if (error) throw error
        setLeadInfo({ ...leadInfo, id: data.id })
      }
      
      toast.success('Lead information saved successfully')
    } catch (error) {
      console.error('Error saving lead info:', error)
      toast.error('Failed to save lead information')
    } finally {
      setSaving(false)
    }
  }

  // Add interaction
  const addInteraction = async () => {
    if (!leadInfo || !newInteraction.type || !newInteraction.notes) {
      toast.error('Please fill in all interaction fields')
      return
    }

    const updatedHistory = [
      ...(leadInfo.interaction_history || []),
      {
        id: Date.now().toString(),
        ...newInteraction
      }
    ]

    const updatedLeadInfo = {
      ...leadInfo,
      interaction_history: updatedHistory,
      total_interactions: updatedHistory.length
    }

    setLeadInfo(updatedLeadInfo)
    setNewInteraction({
      date: new Date().toISOString().split('T')[0],
      type: "",
      notes: ""
    })
    setShowInteractionForm(false)
    
    // Auto-save
    await saveLeadInfo()
  }

  // Generate bill
  const generateBill = async () => {
    if (!user || !selectedLead || !newBill.package_name || !newBill.base_amount) {
      toast.error('Please fill in all required bill fields')
      return
    }

    setSaving(true)
    try {
      const baseAmount = parseFloat(newBill.base_amount)
      const gstRate = newBill.bill_type === 'gst' ? parseFloat(newBill.gst_rate) : 0
      const gstAmount = newBill.bill_type === 'gst' ? (baseAmount * gstRate) / 100 : 0
      const totalAmount = baseAmount + gstAmount

      const billData = {
        user_id: user.id,
        lead_id: selectedLead.id,
        package_name: newBill.package_name,
        description: newBill.description,
        base_amount: baseAmount,
        bill_type: newBill.bill_type,
        gst_number: newBill.bill_type === 'gst' ? newBill.gst_number : null,
        gst_rate: newBill.bill_type === 'gst' ? gstRate : null,
        gst_amount: gstAmount > 0 ? gstAmount : null,
        total_amount: totalAmount,
        place_of_supply: newBill.bill_type === 'gst' ? newBill.place_of_supply : null,
        payment_method: newBill.payment_method,
        due_date: newBill.due_date,
        currency: 'USD'
      }

      const { data, error } = await supabase
        .from('bills')
        .insert([billData])
        .select()
        .single()

      if (error) throw error

      setBills(prev => [data, ...prev])
      setShowBillGenerator(false)
      setNewBill({
        package_name: "",
        base_amount: "",
        description: "",
        due_date: "",
        payment_method: "Credit Card",
        bill_type: "non-gst",
        gst_number: "",
        gst_rate: "18",
        place_of_supply: ""
      })
      
      toast.success('Bill generated successfully')
    } catch (error) {
      console.error('Error generating bill:', error)
      toast.error('Failed to generate bill')
    } finally {
      setSaving(false)
    }
  }

  // Initialize data
  useEffect(() => {
    fetchLeads()
  }, [])

  // Utility functions
  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section as keyof typeof prev]
    }))
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'hot': return "bg-red-100 text-red-700 border-red-200"
      case 'warm': return "bg-orange-100 text-orange-700 border-orange-200"
      case 'cold': return "bg-blue-100 text-blue-700 border-blue-200"
      case 'new': return "bg-emerald-100 text-emerald-700 border-emerald-200"
      default: return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'hot': return "🔥"
      case 'warm': return "🌡️"
      case 'cold': return "❄️"
      case 'new': return "✨"
      default: return "📋"
    }
  }

  // Filter leads
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone_number.includes(searchTerm)
    const matchesStatus = statusFilter === "all" || lead.status.toLowerCase() === statusFilter
    const matchesSource = sourceFilter === "all" || lead.source.toLowerCase().replace(" ", "") === sourceFilter

    return matchesSearch && matchesStatus && matchesSource
  })

  if (loading && !selectedLead) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <span className="ml-2 text-emerald-600">Loading leads...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Lead Selection */}
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-700">
            <Filter className="h-5 w-5" />
            Lead Selection & Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Search Leads</Label>
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
              <Label className="text-sm font-medium text-slate-700">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-emerald-200 hover:border-emerald-300">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="hot">Hot</SelectItem>
                  <SelectItem value="warm">Warm</SelectItem>
                  <SelectItem value="cold">Cold</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Source</Label>
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

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Select Lead</Label>
              <Select 
                value={selectedLead?.id || ""} 
                onValueChange={handleLeadSelection}
              >
                <SelectTrigger className="border-emerald-200 hover:border-emerald-300">
                  <SelectValue placeholder="Select a lead" />
                </SelectTrigger>
                <SelectContent>
                  {filteredLeads.map((lead) => (
                    <SelectItem key={lead.id} value={lead.id}>
                      <div className="flex items-center gap-2">
                        <span>{getStatusIcon(lead.status)}</span>
                        <span>{lead.name}</span>
                        <Badge className={`text-xs ${getStatusColor(lead.status)}`}>
                          {lead.status}
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

      {selectedLead && leadInfo && (
        <>
          {/* Lead Profile Header */}
          <Card className="border-0 shadow-xl bg-gradient-to-b from-emerald-100 to-emerald-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20 border-4 border-emerald-200">
                  <AvatarImage src={user?.profile_image_url} alt={selectedLead.name} />
                  <AvatarFallback className="text-xl font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                    {selectedLead.name.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-slate-800">{selectedLead.name}</h2>
                  <p className="text-slate-600 text-lg">
                    {selectedLead.profession} • {selectedLead.city}
                  </p>
                  <div className="flex items-center gap-3 mt-3">
                    <Badge className={`text-sm ${getStatusColor(selectedLead.status)}`}>
                      {getStatusIcon(selectedLead.status)} {selectedLead.status.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                      {selectedLead.source}
                    </Badge>
                    <Badge variant="outline" className="border-blue-200 text-blue-700">
                      Score: {selectedLead.lead_score}/100
                    </Badge>
                    {user && (
                      <Badge variant="outline" className="border-green-200 text-green-700">
                        User Linked
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-500">Lead Date</div>
                  <div className="font-semibold text-lg">
                    {new Date(selectedLead.created_at).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-slate-500 mt-2">Conversion Probability</div>
                  <div className="font-semibold text-emerald-600">
                    {selectedLead.conversion_probability}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact & Basic Information */}
          <Collapsible open={!collapsedSections.contact} onOpenChange={() => toggleSection("contact")}>
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-emerald-50/50 transition-colors">
                  <CardTitle className="flex items-center justify-between text-emerald-700">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Contact & Basic Information
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
                        value={selectedLead.name} 
                        readOnly 
                        className="bg-slate-50" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Email</Label>
                      <Input 
                        value={selectedLead.email} 
                        readOnly 
                        className="bg-slate-50" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Primary Phone</Label>
                      <Input 
                        value={selectedLead.phone_number} 
                        readOnly 
                        className="bg-slate-50" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Alternate Phone</Label>
                      <Input
                        value={leadInfo.alternate_phone || ""}
                        onChange={(e) => setLeadInfo({...leadInfo, alternate_phone: e.target.value})}
                        className="border-emerald-200"
                        placeholder="Enter alternate phone"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">City</Label>
                      <Input 
                        value={selectedLead.city} 
                        readOnly 
                        className="bg-slate-50" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Pincode</Label>
                      <Input
                        value={leadInfo.pincode || ""}
                        onChange={(e) => setLeadInfo({...leadInfo, pincode: e.target.value})}
                        className="border-emerald-200"
                        placeholder="Enter pincode"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Profession</Label>
                      <Input 
                        value={selectedLead.profession} 
                        readOnly 
                        className="bg-slate-50" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Emergency Contact</Label>
                      <Input
                        value={leadInfo.emergency_contact || ""}
                        onChange={(e) => setLeadInfo({...leadInfo, emergency_contact: e.target.value})}
                        className="border-emerald-200"
                        placeholder="Enter emergency contact"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Preferred Language</Label>
                      <Select 
                        value={leadInfo.preferred_language || "English"}
                        onValueChange={(value) => setLeadInfo({...leadInfo, preferred_language: value})}
                      >
                        <SelectTrigger className="border-emerald-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="English">English</SelectItem>
                          <SelectItem value="Spanish">Spanish</SelectItem>
                          <SelectItem value="French">French</SelectItem>
                          <SelectItem value="German">German</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Timezone</Label>
                      <Input
                        value={leadInfo.timezone || selectedLead.timezone}
                        onChange={(e) => setLeadInfo({...leadInfo, timezone: e.target.value})}
                        className="border-emerald-200"
                        placeholder="Enter timezone"
                      />
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Lead Management & Status */}
          <Collapsible open={!collapsedSections.leadManagement} onOpenChange={() => toggleSection("leadManagement")}>
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-emerald-50/50 transition-colors">
                  <CardTitle className="flex items-center justify-between text-emerald-700">
                    <div className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Lead Management & Status
                    </div>
                    {collapsedSections.leadManagement ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Current Status</Label>
                      <Input 
                        value={selectedLead.status} 
                        readOnly 
                        className="bg-slate-50" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Lead Source</Label>
                      <Input 
                        value={selectedLead.source} 
                        readOnly 
                        className="bg-slate-50" 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Assigned Counselor</Label>
                    <Input 
                      value={selectedLead.counselor} 
                      readOnly 
                      className="bg-slate-50" 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Best Time to Connect</Label>
                    <Input
                      value={leadInfo.best_time_to_connect || ""}
                      onChange={(e) => setLeadInfo({...leadInfo, best_time_to_connect: e.target.value})}
                      className="border-emerald-200"
                      placeholder="e.g., Evening (6-8 PM)"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Engagement Level</Label>
                    <Select 
                      value={leadInfo.engagement_level || "Medium"}
                      onValueChange={(value) => setLeadInfo({...leadInfo, engagement_level: value})}
                    >
                      <SelectTrigger className="border-emerald-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Lead Score</Label>
                      <div className="text-2xl font-bold text-emerald-600">
                        {selectedLead.lead_score}/100
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Engagement</Label>
                      <Badge className={`${
                        leadInfo.engagement_level === "High" ? "bg-emerald-100 text-emerald-700" :
                        leadInfo.engagement_level === "Medium" ? "bg-yellow-100 text-yellow-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {leadInfo.engagement_level || "Medium"}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Interactions</Label>
                      <div className="text-2xl font-bold text-blue-600">
                        {leadInfo.total_interactions || 0}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Fitness Goals & Health Information */}
          <Collapsible open={!collapsedSections.fitnessGoals} onOpenChange={() => toggleSection("fitnessGoals")}>
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-emerald-50/50 transition-colors">
                  <CardTitle className="flex items-center justify-between text-emerald-700">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Fitness Goals & Health Information
                    </div>
                    {collapsedSections.fitnessGoals ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Current Weight</Label>
                      <Input
                        value={leadInfo.current_weight || ""}
                        onChange={(e) => setLeadInfo({...leadInfo, current_weight: e.target.value})}
                        className="border-emerald-200"
                        placeholder="e.g., 75 kg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Target Weight</Label>
                      <Input
                        value={leadInfo.target_weight || ""}
                        onChange={(e) => setLeadInfo({...leadInfo, target_weight: e.target.value})}
                        className="border-emerald-200"
                        placeholder="e.g., 65 kg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Weight to Lose</Label>
                      <Input
                        value={leadInfo.weight_to_lose || ""}
                        onChange={(e) => setLeadInfo({...leadInfo, weight_to_lose: e.target.value})}
                        className="border-emerald-200"
                        placeholder="e.g., 10 kg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Want to Lose Weight?</Label>
                      <Select 
                        value={leadInfo.want_to_lose ? "yes" : "no"}
                        onValueChange={(value) => setLeadInfo({...leadInfo, want_to_lose: value === "yes"})}
                      >
                        <SelectTrigger className="border-emerald-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Motivation Level</Label>
                      <Select 
                        value={leadInfo.motivation_level || ""}
                        onValueChange={(value) => setLeadInfo({...leadInfo, motivation_level: value})}
                      >
                        <SelectTrigger className="border-emerald-200">
                          <SelectValue placeholder="Select motivation level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Very High">Very High</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="Low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Dietary Restrictions</Label>
                      <Input
                        value={leadInfo.dietary_restrictions || ""}
                        onChange={(e) => setLeadInfo({...leadInfo, dietary_restrictions: e.target.value})}
                        className="border-emerald-200"
                        placeholder="e.g., Vegetarian, Vegan, None"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Medical Conditions</Label>
                      <Input
                        value={leadInfo.medical_conditions || ""}
                        onChange={(e) => setLeadInfo({...leadInfo, medical_conditions: e.target.value})}
                        className="border-emerald-200"
                        placeholder="e.g., Diabetes, None"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Previous Fitness Experience</Label>
                    <Textarea
                      value={leadInfo.previous_experience || ""}
                      onChange={(e) => setLeadInfo({...leadInfo, previous_experience: e.target.value})}
                      className="border-emerald-200"
                      placeholder="Describe previous fitness experience..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Investment & Budget Information */}
          <Collapsible open={!collapsedSections.investment} onOpenChange={() => toggleSection("investment")}>
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-emerald-50/50 transition-colors">
                  <CardTitle className="flex items-center justify-between text-emerald-700">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Investment & Budget Information
                    </div>
                    {collapsedSections.investment ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Investment Confidence</Label>
                      <Select 
                        value={leadInfo.investment_confidence || ""}
                        onValueChange={(value) => setLeadInfo({...leadInfo, investment_confidence: value})}
                      >
                        <SelectTrigger className="border-emerald-200">
                          <SelectValue placeholder="Select confidence level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Very Low">Very Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Budget Range</Label>
                      <Input
                        value={leadInfo.budget_range || ""}
                        onChange={(e) => setLeadInfo({...leadInfo, budget_range: e.target.value})}
                        className="border-emerald-200"
                        placeholder="e.g., $1000-2000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Investment Amount</Label>
                      <Input
                        value={leadInfo.investment_amount || ""}
                        onChange={(e) => setLeadInfo({...leadInfo, investment_amount: e.target.value})}
                        className="border-emerald-200"
                        placeholder="e.g., $1500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Payment Preference</Label>
                      <Select 
                        value={leadInfo.payment_preference || ""}
                        onValueChange={(value) => setLeadInfo({...leadInfo, payment_preference: value})}
                      >
                        <SelectTrigger className="border-emerald-200">
                          <SelectValue placeholder="Select payment preference" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Monthly">Monthly</SelectItem>
                          <SelectItem value="Quarterly">Quarterly</SelectItem>
                          <SelectItem value="Annually">Annually</SelectItem>
                          <SelectItem value="One-time">One-time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Commitment Level</Label>
                      <Input
                        value={leadInfo.commitment_level || ""}
                        onChange={(e) => setLeadInfo({...leadInfo, commitment_level: e.target.value})}
                        className="border-emerald-200"
                        placeholder="e.g., 6 months, 1 year"
                      />
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Additional Form Information */}
          <Collapsible open={!collapsedSections.additionalInfo} onOpenChange={() => toggleSection("additionalInfo")}>
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-emerald-50/50 transition-colors">
                  <CardTitle className="flex items-center justify-between text-emerald-700">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Additional Form Information
                    </div>
                    {collapsedSections.additionalInfo ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">How Did You Hear About Us?</Label>
                      <Input
                        value={leadInfo.how_did_you_hear || ""}
                        onChange={(e) => setLeadInfo({...leadInfo, how_did_you_hear: e.target.value})}
                        className="border-emerald-200"
                        placeholder="e.g., Google Search, Social Media"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Referred By</Label>
                      <Input
                        value={leadInfo.referred_by || ""}
                        onChange={(e) => setLeadInfo({...leadInfo, referred_by: e.target.value})}
                        className="border-emerald-200"
                        placeholder="Name of referrer"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Specific Concerns</Label>
                    <Textarea
                      value={leadInfo.specific_concerns || ""}
                      onChange={(e) => setLeadInfo({...leadInfo, specific_concerns: e.target.value})}
                      className="border-emerald-200"
                      placeholder="Any specific concerns or goals..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Availability Schedule</Label>
                    <Textarea
                      value={leadInfo.availability_schedule || ""}
                      onChange={(e) => setLeadInfo({...leadInfo, availability_schedule: e.target.value})}
                      className="border-emerald-200"
                      placeholder="e.g., Weekday evenings, Weekend mornings"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Social Media Handle</Label>
                    <Input
                      value={leadInfo.social_media_handle || ""}
                      onChange={(e) => setLeadInfo({...leadInfo, social_media_handle: e.target.value})}
                      className="border-emerald-200"
                      placeholder="@username"
                    />
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Interaction History */}
          <Collapsible open={!collapsedSections.interactionHistory} onOpenChange={() => toggleSection("interactionHistory")}>
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-emerald-50/50 transition-colors">
                  <CardTitle className="flex items-center justify-between text-emerald-700">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Interaction History
                    </div>
                    {collapsedSections.interactionHistory ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  <div className="flex justify-between items-center mb-4">
                    <div></div>
                    <Button
                      onClick={() => setShowInteractionForm(!showInteractionForm)}
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Interaction
                    </Button>
                  </div>

                  {showInteractionForm && (
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-lg border border-emerald-200 mb-4">
                      <h4 className="font-medium text-emerald-700 mb-3">Add New Interaction</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700">Date</Label>
                          <Input
                            type="date"
                            value={newInteraction.date}
                            onChange={(e) => setNewInteraction({...newInteraction, date: e.target.value})}
                            className="border-emerald-200"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700">Type</Label>
                          <Select
                            value={newInteraction.type}
                            onValueChange={(value) => setNewInteraction({...newInteraction, type: value})}
                          >
                            <SelectTrigger className="border-emerald-200">
                              <SelectValue placeholder="Select interaction type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Phone Call">Phone Call</SelectItem>
                              <SelectItem value="Email">Email</SelectItem>
                              <SelectItem value="Meeting">Meeting</SelectItem>
                              <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                              <SelectItem value="Social Media">Social Media</SelectItem>
                              <SelectItem value="Follow-up">Follow-up</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="md:col-span-1 space-y-2">
                          <Label className="text-sm font-medium text-slate-700">Notes</Label>
                          <Textarea
                            value={newInteraction.notes}
                            onChange={(e) => setNewInteraction({...newInteraction, notes: e.target.value})}
                            className="border-emerald-200"
                            placeholder="Interaction details..."
                            rows={2}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 mt-3">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowInteractionForm(false)
                            setNewInteraction({
                              date: new Date().toISOString().split('T')[0],
                              type: "",
                              notes: ""
                            })
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={addInteraction}
                          className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                        >
                          Add Interaction
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {leadInfo.interaction_history && leadInfo.interaction_history.length > 0 ? (
                      leadInfo.interaction_history.map((interaction, index) => (
                        <div
                          key={interaction.id || index}
                          className="flex items-start gap-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-100"
                        >
                          <div className="w-3 h-3 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-slate-800">{interaction.type}</h4>
                              <span className="text-sm text-slate-500">
                                {new Date(interaction.date).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-slate-600">{interaction.notes}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <MessageSquare className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                        <p>No interactions recorded yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Comments & Notes */}
          <Collapsible open={!collapsedSections.comments} onOpenChange={() => toggleSection("comments")}>
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-emerald-50/50 transition-colors">
                  <CardTitle className="flex items-center justify-between text-emerald-700">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Comments & Notes
                    </div>
                    {collapsedSections.comments ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Public Comments</Label>
                    <Textarea
                      value={leadInfo.comments || ""}
                      onChange={(e) => setLeadInfo({...leadInfo, comments: e.target.value})}
                      rows={4}
                      className="border-emerald-200 resize-none"
                      placeholder="Add detailed notes about the lead..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Internal Notes</Label>
                    <Textarea
                      value={leadInfo.internal_notes || ""}
                      onChange={(e) => setLeadInfo({...leadInfo, internal_notes: e.target.value})}
                      rows={3}
                      className="border-emerald-200 resize-none"
                      placeholder="Internal notes for team members..."
                    />
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Billing & Invoice Management */}
          <Collapsible open={!collapsedSections.billing} onOpenChange={() => toggleSection("billing")}>
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-emerald-50/50 transition-colors">
                  <CardTitle className="flex items-center justify-between text-emerald-700">
                    <div className="flex items-center gap-2">
                      <Receipt className="h-5 w-5" />
                      Billing & Invoice Management
                    </div>
                    {collapsedSections.billing ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div></div>
                    <Button
                      onClick={() => setShowBillGenerator(!showBillGenerator)}
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Generate New Bill
                    </Button>
                  </div>

                  {/* Payment History Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-lg border border-emerald-100">
                      <div className="text-sm text-emerald-600 font-medium">Total Payments</div>
                      <div className="text-2xl font-bold text-emerald-700">
                        {paymentHistory.length}
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-100">
                      <div className="text-sm text-green-600 font-medium">Total Amount</div>
                      <div className="text-2xl font-bold text-green-700">
                        ${paymentHistory.reduce((sum, p) => sum + p.amount, 0)}
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
                      <div className="text-sm text-blue-600 font-medium">Bills Generated</div>
                      <div className="text-2xl font-bold text-blue-700">{bills.length}</div>
                    </div>
                  </div>

                  {/* Bill Generator */}
                  {showBillGenerator && (
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-lg border border-emerald-200">
                      <h3 className="text-lg font-semibold text-emerald-700 mb-4">Generate New Bill</h3>

                      <div className="mb-6">
                        <Label className="text-sm font-medium text-slate-700 mb-3 block">Bill Type</Label>
                        <div className="flex gap-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="non-gst"
                              name="billType"
                              value="non-gst"
                              checked={newBill.bill_type === "non-gst"}
                              onChange={(e) => setNewBill({ ...newBill, bill_type: e.target.value as 'gst' | 'non-gst' })}
                              className="text-emerald-600 focus:ring-emerald-500"
                            />
                            <Label htmlFor="non-gst" className="text-sm font-medium text-slate-700 cursor-pointer">
                              Non-GST Bill
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="gst"
                              name="billType"
                              value="gst"
                              checked={newBill.bill_type === "gst"}
                              onChange={(e) => setNewBill({ ...newBill, bill_type: e.target.value as 'gst' | 'non-gst' })}
                              className="text-emerald-600 focus:ring-emerald-500"
                            />
                            <Label htmlFor="gst" className="text-sm font-medium text-slate-700 cursor-pointer">
                              GST Bill
                            </Label>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700">Package/Service</Label>
                          <Select
                            value={newBill.package_name}
                            onValueChange={(value) => setNewBill({ ...newBill, package_name: value })}
                          >
                            <SelectTrigger className="border-emerald-200">
                              <SelectValue placeholder="Select package" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Basic Package">Basic Package</SelectItem>
                              <SelectItem value="Standard Package">Standard Package</SelectItem>
                              <SelectItem value="Premium Package">Premium Package</SelectItem>
                              <SelectItem value="Enterprise Package">Enterprise Package</SelectItem>
                              <SelectItem value="Consultation">Consultation</SelectItem>
                              <SelectItem value="Custom Service">Custom Service</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700">Base Amount ($)</Label>
                          <Input
                            value={newBill.base_amount}
                            onChange={(e) => setNewBill({ ...newBill, base_amount: e.target.value })}
                            placeholder="Enter base amount"
                            className="border-emerald-200"
                            type="number"
                          />
                        </div>

                        {newBill.bill_type === "gst" && (
                          <>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-slate-700">GST Number</Label>
                              <Input
                                value={newBill.gst_number}
                                onChange={(e) => setNewBill({ ...newBill, gst_number: e.target.value })}
                                placeholder="Enter GST number"
                                className="border-emerald-200"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-slate-700">GST Rate (%)</Label>
                              <Select
                                value={newBill.gst_rate}
                                onValueChange={(value) => setNewBill({ ...newBill, gst_rate: value })}
                              >
                                <SelectTrigger className="border-emerald-200">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="5">5%</SelectItem>
                                  <SelectItem value="12">12%</SelectItem>
                                  <SelectItem value="18">18%</SelectItem>
                                  <SelectItem value="28">28%</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-slate-700">Place of Supply</Label>
                              <Select
                                value={newBill.place_of_supply}
                                onValueChange={(value) => setNewBill({ ...newBill, place_of_supply: value })}
                              >
                                <SelectTrigger className="border-emerald-200">
                                  <SelectValue placeholder="Select state" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Maharashtra">Maharashtra</SelectItem>
                                  <SelectItem value="Delhi">Delhi</SelectItem>
                                  <SelectItem value="Karnataka">Karnataka</SelectItem>
                                  <SelectItem value="Tamil Nadu">Tamil Nadu</SelectItem>
                                  <SelectItem value="Gujarat">Gujarat</SelectItem>
                                  <SelectItem value="Rajasthan">Rajasthan</SelectItem>
                                  <SelectItem value="West Bengal">West Bengal</SelectItem>
                                  <SelectItem value="Uttar Pradesh">Uttar Pradesh</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {newBill.base_amount && (
                              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                                <h4 className="font-medium text-blue-700 mb-2">GST Calculation</h4>
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-slate-600">Base Amount:</span>
                                    <span className="font-medium">${newBill.base_amount}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-600">GST ({newBill.gst_rate}%):</span>
                                    <span className="font-medium">
                                      $
                                      {(
                                        ((parseFloat(newBill.base_amount) || 0) *
                                          (parseFloat(newBill.gst_rate) || 0)) /
                                        100
                                      ).toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between border-t border-blue-200 pt-1">
                                    <span className="font-medium text-blue-700">Total Amount:</span>
                                    <span className="font-bold text-blue-700">
                                      $
                                      {(
                                        (parseFloat(newBill.base_amount) || 0) *
                                        (1 + (parseFloat(newBill.gst_rate) || 0) / 100)
                                      ).toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        )}

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700">Due Date</Label>
                          <Input
                            type="date"
                            value={newBill.due_date}
                            onChange={(e) => setNewBill({ ...newBill, due_date: e.target.value })}
                            className="border-emerald-200"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700">Payment Method</Label>
                          <Select
                            value={newBill.payment_method}
                            onValueChange={(value) => setNewBill({ ...newBill, payment_method: value })}
                          >
                            <SelectTrigger className="border-emerald-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Credit Card">Credit Card</SelectItem>
                              <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                              <SelectItem value="Cash">Cash</SelectItem>
                              <SelectItem value="Check">Check</SelectItem>
                              <SelectItem value="UPI">UPI</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <Label className="text-sm font-medium text-slate-700">Description</Label>
                          <Textarea
                            value={newBill.description}
                            onChange={(e) => setNewBill({ ...newBill, description: e.target.value })}
                            placeholder="Enter bill description..."
                            className="border-emerald-200"
                            rows={3}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-3 mt-4">
                        <Button
                          variant="outline"
                          onClick={() => setShowBillGenerator(false)}
                          className="border-emerald-200 text-emerald-700"
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={generateBill}
                          disabled={saving}
                          className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                        >
                          {saving ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Receipt className="h-4 w-4 mr-2" />
                              Generate {newBill.bill_type === "gst" ? "GST" : "Non-GST"} Bill
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Payment History */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Payment History</h3>
                    <div className="space-y-3">
                      {paymentHistory.length > 0 ? (
                        paymentHistory.map((payment, index) => (
                          <div
                            key={payment.id}
                            className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg border border-slate-200"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-500">
                                <DollarSign className="h-6 w-6 text-white" />
                              </div>
                              <div>
                                <div className="font-semibold text-slate-800">{payment.description}</div>
                                <div className="text-sm text-slate-600">
                                  {payment.type === 'payment_link' ? 'Payment Link' : 'Manual Payment'}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {new Date(payment.created_at).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-lg text-slate-800">
                                ${payment.amount} {payment.currency}
                              </div>
                              <Badge className={`text-xs ${
                                payment.status === 'Completed' || payment.status === 'Paid' 
                                  ? "bg-green-100 text-green-700 border-green-200"
                                  : payment.status === 'Pending' 
                                    ? "bg-orange-100 text-orange-700 border-orange-200"
                                    : "bg-red-100 text-red-700 border-red-200"
                              }`}>
                                {payment.status}
                              </Badge>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-slate-500">
                          <DollarSign className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                          <p>No payment history found for this lead</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bills History */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Generated Bills</h3>
                    <div className="space-y-3">
                      {bills.length > 0 ? (
                        bills.map((bill) => (
                          <div
                            key={bill.id}
                            className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg border border-slate-200 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                bill.bill_type === "gst"
                                  ? "bg-gradient-to-r from-blue-500 to-indigo-500"
                                  : "bg-gradient-to-r from-emerald-500 to-teal-500"
                              }`}>
                                <FileText className="h-6 w-6 text-white" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-slate-800">{bill.bill_number}</span>
                                  <Badge className={`text-xs ${
                                    bill.bill_type === "gst"
                                      ? "bg-blue-100 text-blue-700 border-blue-200"
                                      : "bg-gray-100 text-gray-700 border-gray-200"
                                  }`}>
                                    {bill.bill_type === "gst" ? "GST" : "Non-GST"}
                                  </Badge>
                                </div>
                                <div className="text-sm text-slate-600">{bill.package_name}</div>
                                <div className="text-xs text-slate-500">{bill.description}</div>
                                {bill.bill_type === "gst" && (
                                  <div className="text-xs text-blue-600 mt-1">
                                    GST: {bill.gst_rate}% • {bill.place_of_supply}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-lg text-slate-800">
                                ${bill.total_amount}
                              </div>
                              {bill.bill_type === "gst" && (
                                <div className="text-xs text-slate-500">
                                  Base: ${bill.base_amount} + GST: ${bill.gst_amount}
                                </div>
                              )}
                              <div className="text-sm text-slate-600">
                                {new Date(bill.bill_date).toLocaleDateString()}
                              </div>
                              <Badge className={`text-xs ${
                                bill.payment_status === "Paid"
                                  ? "bg-green-100 text-green-700 border-green-200"
                                  : bill.payment_status === "Pending"
                                    ? "bg-orange-100 text-orange-700 border-orange-200"
                                    : "bg-red-100 text-red-700 border-red-200"
                              }`}>
                                {bill.payment_status}
                              </Badge>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="border-emerald-200 text-emerald-700">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" className="border-blue-200 text-blue-700">
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-slate-500">
                          <Receipt className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                          <p>No bills generated yet for this lead</p>
                        </div>
                      )}
                    </div>
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
            >
              Reset Changes
            </Button>
            <Button 
              onClick={saveLeadInfo}
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
                  Update Lead Information
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}