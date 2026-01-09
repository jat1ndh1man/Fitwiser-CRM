"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Textarea } from "./ui/textarea"
import { Badge } from "./ui/badge"
import { useRouter } from "next/navigation"
import { useSearchParams } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
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
  Receipt,
  Plus,
  Download,
  Eye,
  ChevronDown,
  ChevronRight,
  Save,
  Loader2,
  CalendarDays,
  Scale,
  Heart,
  TargetIcon,
  Wallet,
  MessageCircle,
  FileEdit,
  BarChart3
} from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible"
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
  
  // New fields
  discount_type?: 'percentage' | 'fixed'
  discount_value?: number
  paid_amount: number
  balance: number
  
  // Existing fields
  bill_type: 'gst' | 'non-gst'
  gst_number?: string
  gst_rate?: number
  gst_amount?: number
  total_amount: number
  place_of_supply?: string
  payment_method?: string
  
  // New follow-up date
  due_date: string
  follow_up_date?: string
  
  // Status fields
  payment_status: string
  status: string
  bill_date: string
  
  // New comments field
  payment_comments?: string
  
  created_at: string
}

export default function LeadInformationTab() {
  const router = useRouter()
  const searchParams = useSearchParams()
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
  const totalPaidAmount = bills.reduce((sum, bill) => sum + bill.paid_amount, 0);
const totalBalance = bills.reduce((sum, bill) => sum + bill.balance, 0);
  const SUPERADMIN_ROLE    = 'b00060fe-175a-459b-8f72-957055ee8c55'
  const ADMIN_ROLE         = '46e786df-0272-4f22-aec2-56d2a517fa9d'
  const SALES_MANAGER_ROLE = '11b93954-9a56-4ea5-a02c-15b731ee9dfb'
  const EXECUTIVE_ROLE     = '1fe1759c-dc14-4933-947a-c240c046bcde'
  
  // Form states
const [newBill, setNewBill] = useState({
  package_name: "",
  base_amount: "",
  description: "",
  
  // Discount fields
  discount_type: "percentage" as 'percentage' | 'fixed',
  discount_value: "",
  
  // Payment tracking
  paid_amount: "0",
  
  // GST and due date
  due_date: "",
  follow_up_date: "",
  payment_method: "Credit Card",
  bill_type: "non-gst" as 'gst' | 'non-gst',
  gst_number: "",
  gst_rate: "5", // Fixed to 5%
  place_of_supply: "",
  
  // Comments
  payment_comments: ""
})
  
  const [newInteraction, setNewInteraction] = useState({
    date: new Date().toISOString().split('T')[0],
    type: "",
    notes: ""
  })
  
  const [collapsedSections, setCollapsedSections] = useState({
    leadDetails: true,
    additionalInfo: true,
    interactionAndNotes: true,
    billing: true,
  })

  // Fetch all leads (with role‑based filter)
const fetchLeads = async () => {
  setLoading(true)
  try {
    console.log('Fetching leads...')
    
    const {
      data: { user: authUser },
      error: authError
    } = await supabase.auth.getUser()
    
    if (authError || !authUser) {
      console.error('Auth error:', authError)
      throw authError ?? new Error('No user session')
    }

    const raw = localStorage.getItem('userProfile')
    const roleId = raw ? JSON.parse(raw).role_id : null
    console.log('User role ID:', roleId)

    // Build query
    let query = supabase.from('leads').select('*')

    if (roleId === EXECUTIVE_ROLE) {
      console.log('Filtering leads for executive')
      const { data: assignments, error: assignErr } = await supabase
        .from('lead_assignments')
        .select('lead_id')
        .eq('assigned_to', authUser.id)
      
      if (assignErr) {
        console.error('Assignment error:', assignErr)
        throw assignErr
      }

      const ids = (assignments || []).map(a => a.lead_id)
      console.log('Assigned lead IDs:', ids)
      
      if (ids.length === 0) {
        console.log('No assigned leads for executive')
        setLeads([])
        setLoading(false)
        return
      }
      query = query.in('id', ids)
    }

    const { data, error } = await query.order('created_at', { ascending: false })
    
    if (error) {
      console.error('Query error:', error)
      throw error
    }

    console.log('Fetched leads:', data?.length || 0)
    setLeads(data || [])
    
    // Check if we need to select a lead from URL
    const leadId = searchParams.get('leadId')
    const tab = searchParams.get('tab')
    
    if (tab === 'lead-information' && leadId && data && data.length > 0) {
      const leadExists = data.find(l => l.id === leadId)
      if (leadExists) {
        console.log('Loading lead from URL:', leadId)
        // Use setTimeout to avoid state update conflicts
        setTimeout(() => {
          handleLeadSelection(leadId)
        }, 100)
      }
    } else if (data && data.length > 0 && !selectedLead) {
      // Auto-select first lead
      console.log('Auto-selecting first lead')
      setTimeout(() => {
        handleLeadSelection(data[0].id)
      }, 100)
    }
    
  } catch (err: any) {
    console.error('Error fetching leads:', err)
    toast.error('Failed to fetch leads')
    setLeads([])
  } finally {
    setLoading(false)
  }
}

  // Find user by lead phone/email
const findUserByLead = async (lead: Lead) => {
  try {
    // First try by email
    if (lead.email) {
      const { data: emailData, error: emailError } = await supabase
        .from('users')
        .select('*')
        .eq('email', lead.email)
        .single()
      
      if (!emailError && emailData) {
        return emailData
      }
    }
    
    // Then try by phone
    if (lead.phone_number) {
      const { data: phoneData, error: phoneError } = await supabase
        .from('users')
        .select('*')
        .eq('phone', lead.phone_number)
        .single()
      
      if (!phoneError && phoneData) {
        return phoneData
      }
    }
    
    return null
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
    console.log('Fetching payment history for user:', userId)
    
    const [paymentLinksResult, manualPaymentsResult] = await Promise.all([
      supabase
        .from('payment_links')
        .select('id, amount, currency, description, status, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('manual_payment')
        .select('id, amount, currency, description, payment_method, status, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
    ])

    const paymentLinks = (paymentLinksResult.data || []).map(p => ({
      ...p,
      type: 'payment_link' as const
    }))
    
    const manualPayments = (manualPaymentsResult.data || []).map(p => ({
      ...p,
      type: 'manual_payment' as const
    }))

    console.log('Payment links:', paymentLinks.length, 'Manual payments:', manualPayments.length)
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
  console.log('handleLeadSelection called with:', leadId)
  
  if (!leadId || leadId === selectedLead?.id) {
    console.log('Same lead selected or no leadId')
    return
  }
  
  setLoading(true)
  try {
    // Update URL
    router.replace(`?tab=lead-information&leadId=${leadId}`, { scroll: false })
    
    const lead = leads.find(l => l.id === leadId)
    if (!lead) {
      console.log('Lead not found in leads array')
      toast.error('Lead not found')
      return
    }

    console.log('Setting selected lead:', lead.name)
    setSelectedLead(lead)
    
    // Reset previous data
    setUser(null)
    setPaymentHistory([])
    setBills([])
    
    // Find associated user
    const userData = await findUserByLead(lead)
    console.log('User found:', userData?.email || 'No user found')
    setUser(userData)
    
    // Fetch lead info
    let leadInfoData = await fetchLeadInfo(leadId)
    console.log('Lead info fetched:', leadInfoData ? 'Yes' : 'No')
    
    if (!leadInfoData) {
      // Create default lead info
      leadInfoData = {
        lead_id: leadId,
        user_id: userData?.id,
        interaction_history: [],
        tags: [],
        fitness_goals: [],
        total_interactions: 0
      }
    }
    
    setLeadInfo(leadInfoData)
    
    // Fetch payment history and bills if user exists
    if (userData?.id) {
      console.log('Fetching payment history and bills for user:', userData.id)
      try {
        const [paymentHistoryData, billsData] = await Promise.all([
          fetchPaymentHistory(userData.id),
          fetchBills(userData.id)
        ])
        setPaymentHistory(paymentHistoryData || [])
        setBills(billsData || [])
        console.log('Payment history:', paymentHistoryData?.length || 0, 'items')
        console.log('Bills:', billsData?.length || 0, 'items')
      } catch (error) {
        console.error('Error fetching payment data:', error)
        setPaymentHistory([])
        setBills([])
      }
    } else {
      console.log('No user ID, clearing payment data')
      setPaymentHistory([])
      setBills([])
    }
    
  } catch (error: any) {
    console.error('Error in handleLeadSelection:', error)
    toast.error(`Failed to load lead information: ${error.message || 'Unknown error'}`)
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

  // Helper function to calculate total amount
const calculateTotalAmount = (billData: typeof newBill) => {
  const baseAmount = parseFloat(billData.base_amount) || 0
  let discountedAmount = baseAmount

  // Apply discount
  if (billData.discount_value) {
    const discountValue = parseFloat(billData.discount_value)
    if (billData.discount_type === 'percentage') {
      discountedAmount = baseAmount * (1 - discountValue / 100)
    } else {
      discountedAmount = baseAmount - discountValue
    }
  }

  // Apply GST if applicable
  let totalAmount = discountedAmount
  if (billData.bill_type === 'gst') {
    const gstRate = parseFloat(billData.gst_rate) || 0
    totalAmount = discountedAmount + (discountedAmount * gstRate / 100)
  }

  return Math.max(totalAmount, 0) // Ensure non-negative
}
// Add this helper function before the generateBill function
const calculateBillAmounts = (billData: typeof newBill) => {
  const baseAmount = parseFloat(billData.base_amount) || 0
  
  // Calculate discount
  let discountAmount = 0
  let amountAfterDiscount = baseAmount
  
  if (billData.discount_value) {
    const discountValue = parseFloat(billData.discount_value)
    if (billData.discount_type === 'percentage') {
      discountAmount = baseAmount * (discountValue / 100)
      amountAfterDiscount = baseAmount - discountAmount
    } else {
      discountAmount = discountValue
      amountAfterDiscount = baseAmount - discountAmount
    }
  }
  
  // Calculate GST (fixed 5%)
  const gstRate = billData.bill_type === 'gst' ? 5 : 0
  const gstAmount = billData.bill_type === 'gst' ? (amountAfterDiscount * gstRate) / 100 : 0
  const totalAmount = amountAfterDiscount + gstAmount
  
  // Calculate balance
  const paidAmount = parseFloat(billData.paid_amount) || 0
  const balance = Math.max(totalAmount - paidAmount, 0)
  
  // Determine payment status
  let paymentStatus = 'Pending'
  if (paidAmount >= totalAmount) {
    paymentStatus = 'Paid'
  } else if (paidAmount > 0) {
    paymentStatus = 'Partial'
  }
  
  return {
    baseAmount,
    discountAmount,
    amountAfterDiscount,
    gstRate,
    gstAmount,
    totalAmount,
    paidAmount,
    balance,
    paymentStatus
  }
}

// Updated generateBill function
const generateBill = async () => {
  console.log('generateBill called')
  
  // Validate required fields
  if (!selectedLead) {
    toast.error('Please select a lead first')
    return
  }
  
  if (!newBill.package_name) {
    toast.error('Please select a package')
    return
  }
  
  if (!newBill.base_amount || parseFloat(newBill.base_amount) <= 0) {
    toast.error('Please enter a valid base amount')
    return
  }
  
  if (!newBill.due_date) {
    toast.error('Please select a due date')
    return
  }
  
  setSaving(true)
  try {
    const baseAmount = parseFloat(newBill.base_amount) || 0
    
    // Calculate discount
    let discountAmount = 0
    let amountAfterDiscount = baseAmount
    
    if (newBill.discount_value) {
      const discountValue = parseFloat(newBill.discount_value)
      if (newBill.discount_type === 'percentage') {
        discountAmount = baseAmount * (discountValue / 100)
        amountAfterDiscount = baseAmount - discountAmount
      } else {
        discountAmount = discountValue
        amountAfterDiscount = baseAmount - discountAmount
      }
    }
    
    // Calculate GST (fixed 5%)
    const gstRate = newBill.bill_type === 'gst' ? 5 : 0
    const gstAmount = newBill.bill_type === 'gst' ? (amountAfterDiscount * gstRate) / 100 : 0
    const totalAmount = amountAfterDiscount + gstAmount
    
    // Calculate balance
    const paidAmount = parseFloat(newBill.paid_amount) || 0
    const balance = Math.max(totalAmount - paidAmount, 0)
    
    // Determine payment status (must match table constraint)
    let paymentStatus = 'Pending'
    if (paidAmount >= totalAmount) {
      paymentStatus = 'Paid'
    } else if (paidAmount > 0) {
      // Note: 'Partial' is not allowed in your table, so we use 'Pending'
      paymentStatus = 'Pending'
    }
    
    // Generate bill number
    const billNumber = `BILL-${Date.now().toString().slice(-8)}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`
    
    const billData = {
      bill_number: billNumber,
      user_id: user?.id || null,
      lead_id: selectedLead.id,
      package_name: newBill.package_name,
      description: newBill.description || `Bill for ${newBill.package_name}`,
      base_amount: baseAmount,
      
      // Discount fields
      discount_type: newBill.discount_value ? newBill.discount_type : null,
      discount_value: newBill.discount_value ? parseFloat(newBill.discount_value) : null,
      
      // Payment tracking
      paid_amount: paidAmount,
      balance: balance,
      
      // GST fields
      bill_type: newBill.bill_type,
      gst_number: newBill.bill_type === 'gst' ? (newBill.gst_number || null) : null,
      gst_rate: newBill.bill_type === 'gst' ? gstRate : null,
      gst_amount: gstAmount > 0 ? parseFloat(gstAmount.toFixed(2)) : null,
      total_amount: parseFloat(totalAmount.toFixed(2)),
      place_of_supply: newBill.bill_type === 'gst' ? (newBill.place_of_supply || null) : null,
      payment_method: newBill.payment_method || 'Credit Card',
      
      // Dates
      due_date: newBill.due_date,
      follow_up_date: newBill.follow_up_date || null,
      
      // Status fields (must match table constraints)
      payment_status: paymentStatus,
      status: 'Generated', // Must be one of: 'Generated', 'Sent', 'Viewed', 'Paid', 'Cancelled'
      currency: 'INR',
      bill_date: new Date().toISOString().split('T')[0],
      
      // Comments
      payment_comments: newBill.payment_comments || null,
      
      // These should be null for new bills
      payment_link_id: null,
      manual_payment_id: null,
      paid_date: null
    }

    console.log('Saving bill data:', billData)

    const { data, error } = await supabase
      .from('bills')
      .insert([billData])
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    console.log('Bill created:', data)
    
    // Update local state
    setBills(prev => [data, ...prev])
    
    // Reset form
    setNewBill({
      package_name: "",
      base_amount: "",
      description: "",
      discount_type: "percentage",
      discount_value: "",
      paid_amount: "0",
      due_date: "",
      follow_up_date: "",
      payment_method: "Credit Card",
      bill_type: "non-gst",
      gst_number: "",
      gst_rate: "5",
      place_of_supply: "",
      payment_comments: ""
    })
    
    setShowBillGenerator(false)
    toast.success('Bill generated successfully!')
    
  } catch (error: any) {
    console.error('Error generating bill:', error)
    toast.error(`Failed to generate bill: ${error.message || 'Unknown error'}`)
  } finally {
    setSaving(false)
  }
}
  // Initialize data
  useEffect(() => {
    fetchLeads()
  }, [])

useEffect(() => {
  const leadId = searchParams.get('leadId')
  const tab = searchParams.get('tab')
  
  console.log('useEffect - leadId:', leadId, 'tab:', tab, 'selectedLead:', selectedLead?.id)
  
  // Only handle URL changes if we have leads loaded
  if (tab === 'lead-information' && leadId && leads.length > 0) {
    // Check if we need to load this lead
    if (!selectedLead || selectedLead.id !== leadId) {
      console.log('Loading lead from URL params:', leadId)
      handleLeadSelection(leadId)
    }
  }
}, [searchParams]) // Only depend on searchParams, not leads

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
  onValueChange={(value) => {
    console.log('Dropdown selected:', value)
    if (value && value !== selectedLead?.id) {
      handleLeadSelection(value)
    }
  }}
  disabled={loading || leads.length === 0}
>
  <SelectTrigger className="border-emerald-200 hover:border-emerald-300">
    <SelectValue placeholder={loading ? "Loading leads..." : leads.length === 0 ? "No leads available" : "Select a lead"} />
  </SelectTrigger>
  <SelectContent>
    {filteredLeads.length === 0 ? (
      <div className="p-2 text-sm text-slate-500">
        {loading ? "Loading..." : "No leads found with current filters"}
      </div>
    ) : (
      filteredLeads.map((lead) => (
        <SelectItem key={lead.id} value={lead.id}>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="truncate">{lead.name}</span>
            <Badge className={`text-xs ${getStatusColor(lead.status)}`}>
              {lead.status}
            </Badge>
          </div>
        </SelectItem>
      ))
    )}
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

          {/* Combined Lead Details */}
          <Collapsible open={!collapsedSections.leadDetails} onOpenChange={() => toggleSection("leadDetails")}>
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-emerald-50/50 transition-colors">
                  <CardTitle className="flex items-center justify-between text-emerald-700">
                    <div className="flex items-center gap-2">
                      <FileEdit className="h-5 w-5" />
                      Lead Details
                    </div>
                    {collapsedSections.leadDetails ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-6">
                  {/* Basic Information Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-slate-700 font-medium">
                      <User className="h-4 w-4" />
                      <h3 className="text-lg">Basic Information</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">Profession</Label>
                        <Input 
                          value={selectedLead.profession} 
                          readOnly 
                          className="bg-slate-50" 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Lead Management Section */}
                  <div className="space-y-4 pt-4 border-t border-slate-200">
                    <div className="flex items-center gap-2 text-slate-700 font-medium">
                      <Activity className="h-4 w-4" />
                      <h3 className="text-lg">Lead Management</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-lg border border-emerald-100">
                        <div className="text-sm text-emerald-600 font-medium">Lead Score</div>
                        <div className="text-2xl font-bold text-emerald-700">
                          {selectedLead.lead_score}/100
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
                        <div className="text-sm text-blue-600 font-medium">Interactions</div>
                        <div className="text-2xl font-bold text-blue-700">
                          {leadInfo.total_interactions || 0}
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-lg border border-purple-100">
                        <div className="text-sm text-purple-600 font-medium">Priority</div>
                        <div className="text-2xl font-bold text-purple-700">
                          {selectedLead.priority}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Fitness Goals Section */}
                  <div className="space-y-4 pt-4 border-t border-slate-200">
                    <div className="flex items-center gap-2 text-slate-700 font-medium">
                      <Scale className="h-4 w-4" />
                      <h3 className="text-lg">Fitness Goals & Health</h3>
                    </div>
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
                        <Label className="text-sm font-medium text-slate-700">Medical Conditions</Label>
                        <Input
                          value={leadInfo.medical_conditions || ""}
                          onChange={(e) => setLeadInfo({...leadInfo, medical_conditions: e.target.value})}
                          className="border-emerald-200"
                          placeholder="e.g., Diabetes, None"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Investment & Budget Section */}
                  <div className="space-y-4 pt-4 border-t border-slate-200">
                    <div className="flex items-center gap-2 text-slate-700 font-medium">
                      <Wallet className="h-4 w-4" />
                      <h3 className="text-lg">Investment & Budget</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">Budget Range</Label>
                        <Input
                          value={leadInfo.budget_range || ""}
                          onChange={(e) => setLeadInfo({...leadInfo, budget_range: e.target.value})}
                          className="border-emerald-200"
                          placeholder="e.g., ₹1000-2000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">Investment Amount</Label>
                        <Input
                          value={leadInfo.investment_amount || ""}
                          onChange={(e) => setLeadInfo({...leadInfo, investment_amount: e.target.value})}
                          className="border-emerald-200"
                          placeholder="e.g., ₹1500"
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
                      Additional Information
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
                          <SelectItem value="Hindi">Hindi</SelectItem>
                          <SelectItem value="Spanish">Spanish</SelectItem>
                          <SelectItem value="French">French</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Social Media Handle</Label>
                      <Input
                        value={leadInfo.social_media_handle || ""}
                        onChange={(e) => setLeadInfo({...leadInfo, social_media_handle: e.target.value})}
                        className="border-emerald-200"
                        placeholder="@username"
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
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Combined Interaction History & Notes */}
          <Collapsible open={!collapsedSections.interactionAndNotes} onOpenChange={() => toggleSection("interactionAndNotes")}>
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-emerald-50/50 transition-colors">
                  <CardTitle className="flex items-center justify-between text-emerald-700">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5" />
                      Interaction History & Notes
                    </div>
                    {collapsedSections.interactionAndNotes ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-6">
                  {/* Interaction History Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-emerald-600" />
                        <h3 className="text-lg font-semibold text-slate-800">Interaction History</h3>
                      </div>
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
    // Sort by date in descending order (newest first)
    [...leadInfo.interaction_history]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map((interaction, index) => (
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
      <MessageCircle className="h-12 w-12 mx-auto mb-3 text-slate-300" />
      <p>No interactions recorded yet</p>
    </div>
  )}
</div>
                  </div>

                  {/* Comments & Notes Section */}
                  <div className="space-y-4 pt-6 border-t border-slate-200">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-emerald-600" />
                      <h3 className="text-lg font-semibold text-slate-800">Comments & Notes</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700">Public Comments</Label>
                          <Textarea
                            value={leadInfo.comments || ""}
                            onChange={(e) => setLeadInfo({...leadInfo, comments: e.target.value})}
                            rows={6}
                            className="border-emerald-200 resize-none"
                            placeholder="Add detailed notes about the lead..."
                          />
                        </div>
                        <div className="text-sm text-slate-500">
                          These notes are visible to all team members working with this lead.
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700">Internal Notes</Label>
                          <Textarea
                            value={leadInfo.internal_notes || ""}
                            onChange={(e) => setLeadInfo({...leadInfo, internal_notes: e.target.value})}
                            rows={6}
                            className="border-emerald-200 resize-none"
                            placeholder="Internal notes for team members..."
                          />
                        </div>
                        <div className="text-sm text-slate-500">
                          These notes are private and only visible to you and administrators.
                        </div>
                      </div>
                    </div>
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

                 {/* Billing Summary Section */}
<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-lg border border-emerald-100">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-emerald-100 rounded-lg">
        <Wallet className="h-4 w-4 text-emerald-600" />
      </div>
      <div>
        <div className="text-sm text-emerald-600 font-medium">Total Paid</div>
        <div className="text-2xl font-bold text-emerald-700">
          ₹{totalPaidAmount}
        </div>
      </div>
    </div>
  </div>
  
  <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-lg border border-orange-100">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-orange-100 rounded-lg">
        <Receipt className="h-4 w-4 text-orange-600" />
      </div>
      <div>
        <div className="text-sm text-orange-600 font-medium">Total Balance</div>
        <div className="text-2xl font-bold text-orange-700">
      ₹{totalBalance}
        </div>
      </div>
    </div>
  </div>
  
  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-blue-100 rounded-lg">
        <FileText className="h-4 w-4 text-blue-600" />
      </div>
      <div>
        <div className="text-sm text-blue-600 font-medium">Total Bills</div>
        <div className="text-2xl font-bold text-blue-700">{bills.length}</div>
      </div>
    </div>
  </div>
  
  <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-lg border border-purple-100">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-purple-100 rounded-lg">
        <DollarSign className="h-4 w-4 text-purple-600" />
      </div>
      <div>
        <div className="text-sm text-purple-600 font-medium">Billing Account</div>
        <div className="text-xl font-bold text-purple-700">
          {user ? "Active" : "No Account"}
        </div>
        <div className="text-xs text-purple-500 mt-1">
          {user ? "Linked to user" : "Lead only"}
        </div>
      </div>
    </div>
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
    {/* Package Name */}
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
          {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
            <SelectItem key={`premium-${n}`} value={`Premium Personal Training - ${n} Month${n>1?'s':''}`}>
              Premium Personal Training - {n} Month{n>1?'s':''}
            </SelectItem>
          ))}
          {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
            <SelectItem key={`virtual-${n}`} value={`Virtual Personal Training - ${n} Month${n>1?'s':''}`}>
              Virtual Personal Training - {n} Month{n>1?'s':''}
            </SelectItem>
          ))}
          {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
            <SelectItem key={`in-home-${n}`} value={`In Home Personal Training - ${n} Month${n>1?'s':''}`}>
              In Home Personal Training - {n} Month{n>1?'s':''}
            </SelectItem>
          ))}
          {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
            <SelectItem key={`coach-${n}`} value={`Personal Coaching Plan - ${n} Month${n>1?'s':''}`}>
              Personal Coaching Plan - {n} Month{n>1?'s':''}
            </SelectItem>
          ))}
          {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
            <SelectItem key={`nutri-${n}`} value={`Nutrition Plan - ${n} Month${n>1?'s':''}`}>
              Nutrition Plan - {n} Month{n>1?'s':''}
            </SelectItem>
          ))}
          {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
            <SelectItem key={`master-${n}`} value={`Master Plan - ${n} Month${n>1?'s':''}`}>
              Master Plan - {n} Month{n>1?'s':''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    {/* Base Amount */}
    <div className="space-y-2">
      <Label className="text-sm font-medium text-slate-700">Base Amount (₹)</Label>
      <Input
        value={newBill.base_amount}
        onChange={(e) => setNewBill({ ...newBill, base_amount: e.target.value })}
        placeholder="Enter base amount"
        className="border-emerald-200"
        type="number"
      />
    </div>

    {/* Discount Type */}
    <div className="space-y-2">
      <Label className="text-sm font-medium text-slate-700">Discount Type</Label>
      <Select
        value={newBill.discount_type}
        onValueChange={(value) => setNewBill({ ...newBill, discount_type: value as 'percentage' | 'fixed' })}
      >
        <SelectTrigger className="border-emerald-200">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="percentage">Percentage (%)</SelectItem>
          <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
        </SelectContent>
      </Select>
    </div>

    {/* Discount Value */}
    <div className="space-y-2">
      <Label className="text-sm font-medium text-slate-700">
        {newBill.discount_type === 'percentage' ? 'Discount Percentage (%)' : 'Discount Amount (₹)'}
      </Label>
      <Input
        value={newBill.discount_value}
        onChange={(e) => setNewBill({ ...newBill, discount_value: e.target.value })}
        placeholder={newBill.discount_type === 'percentage' ? 'e.g., 10' : 'e.g., 500'}
        className="border-emerald-200"
        type="number"
      />
    </div>

    {/* Paid Amount */}
    <div className="space-y-2">
      <Label className="text-sm font-medium text-slate-700">Paid Amount (₹)</Label>
      <Input
        value={newBill.paid_amount}
        onChange={(e) => setNewBill({ ...newBill, paid_amount: e.target.value })}
        placeholder="Enter paid amount"
        className="border-emerald-200"
        type="number"
      />
    </div>

    {/* Payment Method */}
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
          <SelectItem value="PayPal">PayPal</SelectItem>
        </SelectContent>
      </Select>
    </div>

    {/* Due Date */}
    <div className="space-y-2">
      <Label className="text-sm font-medium text-slate-700">Due Date</Label>
      <Input
        type="date"
        value={newBill.due_date}
        onChange={(e) => setNewBill({ ...newBill, due_date: e.target.value })}
        className="border-emerald-200"
      />
    </div>

    {/* Follow-up Date */}
    <div className="space-y-2">
      <Label className="text-sm font-medium text-slate-700">Follow-up Date</Label>
      <Input
        type="date"
        value={newBill.follow_up_date}
        onChange={(e) => setNewBill({ ...newBill, follow_up_date: e.target.value })}
        className="border-emerald-200"
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
          <Label className="text-sm font-medium text-slate-700">GST Rate</Label>
          <Input
            value="5%"
            readOnly
            className="border-emerald-200 bg-slate-50 cursor-not-allowed"
          />
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
      </>
    )}

    {/* Description */}
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

    {/* Payment Comments */}
    <div className="md:col-span-2 space-y-2">
      <Label className="text-sm font-medium text-slate-700">Payment Comments</Label>
      <Textarea
        value={newBill.payment_comments}
        onChange={(e) => setNewBill({ ...newBill, payment_comments: e.target.value })}
        placeholder="Add any comments about payment..."
        className="border-emerald-200"
        rows={3}
      />
    </div>

    {/* Calculation Preview */}
    {newBill.base_amount && (
      <div className="md:col-span-2 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
        <h4 className="font-medium text-blue-700 mb-2">Bill Calculation</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Base Amount:</span>
            <span className="font-medium">₹{parseFloat(newBill.base_amount) || 0}</span>
          </div>
          
          {newBill.discount_value && (
            <div className="flex justify-between">
              <span className="text-slate-600">
                Discount ({newBill.discount_type === 'percentage' ? `${newBill.discount_value}%` : `₹${newBill.discount_value}`}):
              </span>
              <span className="font-medium text-red-600">
                -₹
                {newBill.discount_type === 'percentage'
                  ? ((parseFloat(newBill.base_amount) || 0) * (parseFloat(newBill.discount_value) || 0) / 100).toFixed(2)
                  : (parseFloat(newBill.discount_value) || 0).toFixed(2)}
              </span>
            </div>
          )}
          
          {newBill.bill_type === "gst" && (
            <div className="flex justify-between">
              <span className="text-slate-600">GST (5%):</span>
              <span className="font-medium">
                ₹
                {(
                  ((parseFloat(newBill.base_amount) || 0) -
                  (newBill.discount_type === 'percentage'
                    ? ((parseFloat(newBill.base_amount) || 0) * (parseFloat(newBill.discount_value) || 0) / 100)
                    : (parseFloat(newBill.discount_value) || 0))) *
                  0.05
                ).toFixed(2)}
              </span>
            </div>
          )}
          
          <div className="flex justify-between border-t border-blue-200 pt-2">
            <span className="font-medium text-blue-700">Total Amount:</span>
            <span className="font-bold text-blue-700">
              ₹
              {calculateTotalAmount(newBill).toFixed(2)}
            </span>
          </div>
          
          {newBill.paid_amount && (
            <>
              <div className="flex justify-between">
                <span className="text-slate-600">Paid Amount:</span>
                <span className="font-medium text-green-600">₹{parseFloat(newBill.paid_amount) || 0}</span>
              </div>
              <div className="flex justify-between border-t border-blue-200 pt-2">
                <span className="font-medium text-orange-700">Balance:</span>
                <span className="font-bold text-orange-700">
                  ₹{(calculateTotalAmount(newBill) - (parseFloat(newBill.paid_amount) || 0)).toFixed(2)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    )}
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
                                ₹{payment.amount} {payment.currency}
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
        className="p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg border border-slate-200 hover:shadow-md transition-shadow"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Left Column - Package Info */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-3 h-3 rounded-full ${bill.bill_type === "gst" ? "bg-blue-500" : "bg-emerald-500"}`}></div>
              <span className="font-semibold text-slate-800">{bill.package_name}</span>
            </div>
            <div className="text-sm text-slate-600">{bill.description}</div>
            {bill.bill_type === "gst" && (
              <div className="text-xs text-blue-600 mt-1">
                GST: {bill.gst_rate}% • {bill.place_of_supply}
              </div>
            )}
          </div>

          {/* Middle Column - Payment Details */}
          <div className="space-y-1">
            <div className="grid grid-cols-2 gap-1 text-sm">
              <div className="text-slate-600">Base Amount:</div>
              <div className="font-medium">₹{bill.base_amount}</div>
              
              {bill.discount_value && (
                <>
                  <div className="text-slate-600">Discount:</div>
                  <div className="font-medium text-red-600">
                    {bill.discount_type === 'percentage' 
                      ? `${bill.discount_value}%` 
                      : `₹${bill.discount_value}`}
                  </div>
                </>
              )}
              
              <div className="text-slate-600">GST:</div>
              <div className="font-medium">₹{bill.gst_amount || 0}</div>
              
              <div className="text-slate-600 font-medium">Total:</div>
              <div className="font-bold text-blue-700">₹{bill.total_amount}</div>
              
              <div className="text-slate-600">Paid:</div>
              <div className="font-medium text-green-600">₹{bill.paid_amount}</div>
              
              <div className="text-slate-600 font-medium">Balance:</div>
              <div className="font-bold text-orange-700">₹{bill.balance}</div>
            </div>
          </div>

          {/* Right Column - Dates & Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Badge className={`text-xs ${
                bill.payment_status === "Paid"
                  ? "bg-green-100 text-green-700 border-green-200"
                  : bill.payment_status === "Partial"
                    ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                    : "bg-red-100 text-red-700 border-red-200"
              }`}>
                {bill.payment_status}
              </Badge>
              <Badge className={`text-xs ${
                bill.bill_type === "gst"
                  ? "bg-blue-100 text-blue-700 border-blue-200"
                  : "bg-gray-100 text-gray-700 border-gray-200"
              }`}>
                {bill.bill_type === "gst" ? "GST" : "Non-GST"}
              </Badge>
            </div>
            
            <div className="text-sm text-slate-600 space-y-1">
              <div>Due: {new Date(bill.due_date).toLocaleDateString()}</div>
              {bill.follow_up_date && (
                <div>Follow-up: {new Date(bill.follow_up_date).toLocaleDateString()}</div>
              )}
              <div>Method: {bill.payment_method}</div>
            </div>
            
            {bill.payment_comments && (
              <div className="text-xs text-slate-500 mt-2">
                <div className="font-medium">Comments:</div>
                <div>{bill.payment_comments}</div>
              </div>
            )}
{/*             
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="border-emerald-200 text-emerald-700">
                <Eye className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" className="border-blue-200 text-blue-700">
                <Download className="h-4 w-4" />
              </Button>
            </div> */}
          </div>
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