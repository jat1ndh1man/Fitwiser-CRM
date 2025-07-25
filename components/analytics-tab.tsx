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

// Supabase client setup - replace with your actual URL and anon key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,     
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!  
)
// Enhanced data with comprehensive analytics

const packageAnalysis = [
  { package: "Basic", count: 145, revenue: 217500, avgValue: 1500, retention: 68.5 },
  { package: "Standard", count: 132, revenue: 264000, avgValue: 2000, retention: 72.3 },
  { package: "Premium", count: 98, revenue: 294000, avgValue: 3000, retention: 78.6 },
  { package: "Enterprise", count: 45, revenue: 225000, avgValue: 5000, retention: 85.2 },
]

const cityAnalysis = [
  { city: "Mumbai", clients: 156, revenue: 390000, avgValue: 2500, growth: 15.2 },
  { city: "Delhi", clients: 134, revenue: 335000, avgValue: 2500, growth: 12.8 },
  { city: "Bangalore", clients: 128, revenue: 320000, avgValue: 2500, growth: 18.5 },
  { city: "Chennai", clients: 98, revenue: 245000, avgValue: 2500, growth: 10.3 },
  { city: "Pune", clients: 87, revenue: 217500, avgValue: 2500, growth: 22.1 },
  { city: "Hyderabad", clients: 76, revenue: 190000, avgValue: 2500, growth: 16.7 },
]


const sourceAnalysis = [
  { source: "Website", count: 145, percentage: 27.1, revenue: 362500, conversion: 46.2 },
  { source: "Social Media", count: 132, percentage: 24.6, revenue: 330000, conversion: 43.9 },
  { source: "Referral", count: 98, percentage: 18.3, revenue: 245000, conversion: 53.1 },
  { source: "Cold Call", count: 87, percentage: 16.2, revenue: 217500, conversion: 32.2 },
  { source: "Email Campaign", count: 74, percentage: 13.8, revenue: 185000, conversion: 40.8 },
]

const missedFollowUpAnalysis = [
  { counselor: "Sarah Johnson", total: 45, missed: 8, rate: 17.8, impact: "Low" },
  { counselor: "Mike Wilson", total: 52, missed: 12, rate: 23.1, impact: "Medium" },
  { counselor: "Lisa Brown", total: 38, missed: 15, rate: 39.5, impact: "High" },
  { counselor: "John Davis", total: 42, missed: 18, rate: 42.9, impact: "High" },
]

const liveMemberAnalysis = {
  total: 536,
  active: 456,
  inactive: 80,
  locationWise: [
    { location: "Mumbai", active: 89, inactive: 12, total: 101 },
    { location: "Delhi", active: 78, inactive: 15, total: 93 },
    { location: "Bangalore", active: 82, inactive: 8, total: 90 },
    { location: "Chennai", active: 67, inactive: 11, total: 78 },
    { location: "Pune", active: 71, inactive: 9, total: 80 },
    { location: "Hyderabad", active: 69, inactive: 25, total: 94 },
  ],
  genderWise: [
    { gender: "Male", active: 267, inactive: 45, total: 312 },
    { gender: "Female", active: 189, inactive: 35, total: 224 },
  ],
  packageWise: [
    { package: "Basic", active: 125, inactive: 20, total: 145 },
    { package: "Standard", active: 118, inactive: 14, total: 132 },
    { package: "Premium", active: 89, inactive: 9, total: 98 },
    { package: "Enterprise", active: 124, inactive: 37, total: 161 },
  ],
  sourceWise: [
    { source: "Website", active: 125, inactive: 20, total: 145 },
    { source: "Social Media", active: 115, inactive: 17, total: 132 },
    { source: "Referral", active: 89, inactive: 9, total: 98 },
    { source: "Cold Call", active: 75, inactive: 12, total: 87 },
    { source: "Email Campaign", active: 52, inactive: 22, total: 74 },
  ],
  ageCategoryWise: [
    { category: "18-25", active: 89, inactive: 15, total: 104 },
    { category: "26-35", active: 156, inactive: 24, total: 180 },
    { category: "36-45", active: 134, inactive: 18, total: 152 },
    { category: "46-55", active: 67, inactive: 15, total: 82 },
    { category: "55+", active: 10, inactive: 8, total: 18 },
  ],
  professionWise: [
    { profession: "IT Professional", active: 145, inactive: 18, total: 163 },
    { profession: "Business Owner", active: 89, inactive: 12, total: 101 },
    { profession: "Doctor", active: 67, inactive: 8, total: 75 },
    { profession: "Teacher", active: 54, inactive: 15, total: 69 },
    { profession: "Engineer", active: 78, inactive: 12, total: 90 },
    { profession: "Other", active: 23, inactive: 15, total: 38 },
  ],
}

const renewalTrends = [
  { month: "Jan", renewals: 32, revenue: 80000, rate: 71.1 },
  { month: "Feb", renewals: 38, revenue: 95000, rate: 73.1 },
  { month: "Mar", renewals: 51, revenue: 127500, rate: 76.1 },
  { month: "Apr", renewals: 56, revenue: 140000, rate: 78.9 },
  { month: "May", renewals: 62, revenue: 155000, rate: 79.5 },
  { month: "Jun", renewals: 69, revenue: 172500, rate: 80.2 },
]

export function AnalyticsTab() {
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
  
  // Role constants
  const EXECUTIVE_ROLE = '1fe1759c-dc14-4933-947a-c240c046bcde'
  const SALES_MANAGER_ROLE = '11b93954-9a56-4ea5-a02c-15b731ee9dfb'
  const ADMIN_ROLE = '46e786df-0272-4f22-aec2-56d2a517fa9d'
  const SUPERADMIN_ROLE = 'b00060fe-175a-459b-8f72-957055ee8c55'
  
  // Initialize user role and assignments
  useEffect(() => {
    const initializeUserAccess = async () => {
      try {
        // Get user profile from localStorage
        const userProfile = localStorage.getItem('userProfile')
        if (!userProfile) return
        
        const { id: userId, role_id: roleId } = JSON.parse(userProfile)
        setCurrentUserId(userId)
        setCurrentUserRole(roleId)
        
        // If user is executive, fetch their assigned lead IDs
        if (roleId === EXECUTIVE_ROLE) {
          const { data: assignments, error } = await supabase
            .from('lead_assignments')
            .select('lead_id')
            .eq('assigned_to', userId)
          
          if (error) {
            console.error('Error fetching lead assignments:', error)
            return
          }
          
          const leadIds = assignments.map(a => a.lead_id)
          setAssignedLeadIds(leadIds)
        }
      } catch (error) {
        console.error('Error initializing user access:', error)
      }
    }
    
    initializeUserAccess()
  }, [])
  
  const [genderAnalysisData, setGenderAnalysisData] = useState<
  { gender: string; count: number; percentage: number }[]
>([])
  const [packageAnalysisData, setPackageAnalysisData] = useState<
  { plan: string; count: number; revenue: number; avgValue: number }[]
>([])
  const [cityAnalysisData, setCityAnalysisData] = useState<
  { city: string; clients: number; revenue: number; growth: number }[]
>([])
  const [salesData, setSalesData] = useState<
  { month: string; [plan: string]: number }[]
>([])
const totalCount = packageAnalysisData.reduce(
    (sum, pkg) => sum + pkg.count,
    0
  );

  const [salesOverview, setSalesOverview] = useState<{
  totalSales: number
  growthRate: number
  bestMonth: string
  bestMonthRevenue: number
  avgDealSize: number
}>({
  totalSales: 0,
  growthRate: 0,
  bestMonth: "",
  bestMonthRevenue: 0,
  avgDealSize: 0,
})

  const [liveMembers, setLiveMembers] = useState<{
  total: number
  active: number
  inactive: number
  locationWise: Array<{ location: string; active: number; inactive: number; total: number }>
  packageDistribution: Array<{ package: string; total: number }>
  ageCategoryWise: Array<{ category: string; active: number; inactive: number; total: number }>
  professionWise: Array<{ profession: string; active: number; inactive: number; total: number }>
}>({
  total: 0,
  active: 0,
  inactive: 0,
  locationWise: [],
  packageDistribution: [],
  ageCategoryWise: [],
  professionWise: [],
})

const [conversionData, setConversionData] = useState<{
  sourceWise: Array<{
    source: string
    leads: number
    conversions: number
    rate: number
    revenue: number
  }>
  rmWise: Array<{
    rm: string
    leads: number
    conversions: number
    rate: number
    revenue: number
  }>
}>({
  sourceWise: [],
  rmWise: [],
  monthWise: [],

})

const [renewalAnalytics, setRenewalAnalytics] = useState({
  sourceWise: [],
  coachWise: [],
});


const [sourceAnalysisData, setSourceAnalysisData] = useState<
  { source: string; count: number; revenue: number; conversion: number }[]
>([])



useEffect(() => {
  if (activeAnalytic !== 'gender') return
  ;(async () => {
    try {
      let query = supabase.from('users').select('gender, email')
      
      // Apply role-based filtering for executives
      if (currentUserRole === EXECUTIVE_ROLE && assignedLeadIds.length > 0) {
        // Get emails of assigned leads
        const { data: leads, error: leadsError } = await supabase
          .from('leads')
          .select('email')
          .in('id', assignedLeadIds)
        
        if (leadsError) {
          console.error('Error fetching assigned leads:', leadsError)
          return
        }
        
        const assignedEmails = leads.map(l => l.email)
        if (assignedEmails.length === 0) {
          setGenderAnalysisData([])
          return
        }
        
        query = query.in('email', assignedEmails)
      }
      
      const { data, error } = await query
      
      if (error) {
        console.error('Supabase error:', error.message)
        return
      }

      const total = data!.length
      const counts = data!.reduce((acc, { gender }) => {
        const g = gender || 'Unknown'
        acc[g] = (acc[g] ?? 0) + 1
        return acc
      }, {} as Record<string, number>)

      setGenderAnalysisData(
        Object.entries(counts).map(([gender, count]) => ({
          gender,
          count,
          percentage: parseFloat(((count / total) * 100).toFixed(1)),
        }))
      )
    } catch (error) {
      console.error('Error in gender analysis:', error)
    }
  })()
}, [activeAnalytic, currentUserRole, assignedLeadIds])

useEffect(() => {
  if (activeAnalytic !== "package") return

  ;(async () => {
    try {
      let manualQuery = supabase.from("manual_payment").select("plan, amount, lead_id")
      let linksQuery = supabase.from("payment_links").select("plan, amount, lead_id")
      
      // Apply role-based filtering for executives
      if (currentUserRole === EXECUTIVE_ROLE && assignedLeadIds.length > 0) {
        manualQuery = manualQuery.in('lead_id', assignedLeadIds)
        linksQuery = linksQuery.in('lead_id', assignedLeadIds)
      }
      
      const [{ data: manual, error: em }, { data: links, error: el }] = await Promise.all([
        manualQuery,
        linksQuery,
      ])

      if (em || el) {
        console.error(em ?? el)
        return
      }

      const all = [...(manual || []), ...(links || [])]
      const agg: Record<string, { count: number; revenue: number }> = {}

      all.forEach(({ plan, amount }) => {
        const p = plan || "Unknown"
        if (!agg[p]) agg[p] = { count: 0, revenue: 0 }
        agg[p].count += 1
        agg[p].revenue += amount
      })

      const result = Object.entries(agg).map(([plan, { count, revenue }]) => ({
        plan,
        count,
        revenue,
        avgValue: Math.round(revenue / count),
      }))

      setPackageAnalysisData(result)
    } catch (error) {
      console.error('Error in package analysis:', error)
    }
  })()
}, [activeAnalytic, currentUserRole, assignedLeadIds])

useEffect(() => {
  if (activeAnalytic !== "city") return;

  (async () => {
    try {
      // 1. Fetch leads with role-based filtering
      let leadsQuery = supabase.from("leads").select("id, email, city")
      
      // Apply role-based filtering for executives
      if (currentUserRole === EXECUTIVE_ROLE && assignedLeadIds.length > 0) {
        leadsQuery = leadsQuery.in('id', assignedLeadIds)
      }
      
      const { data: leads, error: leadsError } = await leadsQuery

      if (leadsError) {
        console.error("Leads fetch error:", leadsError);
        return;
      }

    // 2. Fetch all manual payments
    const { data: manualPayments, error: manualError } = await supabase
      .from("manual_payment")
      .select("amount, payment_date, lead_id");

    if (manualError) {
      console.error("Manual payments fetch error:", manualError);
      return;
    }

    // 3. Fetch all payment links
    const { data: paymentLinks, error: linkError } = await supabase
      .from("payment_links")
      .select("amount, payment_date, lead_id");

    if (linkError) {
      console.error("Payment links fetch error:", linkError);
      return;
    }

    const allPayments = [...(manualPayments || []), ...(paymentLinks || [])];

    // 4. Create a lookup: lead_id → city
    const leadCityMap: Record<string, string> = {};
    for (const lead of leads || []) {
      leadCityMap[lead.id] = lead.city || "Unknown";
    }

    // 5. Group payments by city
    type Payment = { amount: number; date: string };
    const cityMap: Record<
      string,
      { revenue: number; clients: Set<string>; payments: Payment[] }
    > = {};

    for (const payment of allPayments) {
      const city = leadCityMap[payment.lead_id] || "Unknown";
      if (!cityMap[city]) {
        cityMap[city] = { revenue: 0, clients: new Set(), payments: [] };
      }

      cityMap[city].revenue += payment.amount;
      cityMap[city].clients.add(payment.lead_id);
      if (payment.payment_date) {
        cityMap[city].payments.push({
          amount: payment.amount,
          date: payment.payment_date,
        });
      }
    }

    // 6. Calculate growth: current month vs last month revenue
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const lastMonthDate = new Date(now);
    lastMonthDate.setMonth(thisMonth - 1);
    const lastMonth = lastMonthDate.getMonth();
    const lastYear = lastMonthDate.getFullYear();

    const cityData = Object.entries(cityMap).map(
      ([city, { revenue, clients, payments }]) => {
        const currentMonthRevenue = payments
          .filter((p) => {
            const d = new Date(p.date);
            return d.getFullYear() === thisYear && d.getMonth() === thisMonth;
          })
          .reduce((sum, p) => sum + p.amount, 0);

        const lastMonthRevenue = payments
          .filter((p) => {
            const d = new Date(p.date);
            return d.getFullYear() === lastYear && d.getMonth() === lastMonth;
          })
          .reduce((sum, p) => sum + p.amount, 0);

        const growth =
          lastMonthRevenue > 0
            ? +(((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1)
            : currentMonthRevenue > 0
            ? 100
            : 0;

        return {
          city,
          clients: clients.size,
          revenue,
          growth,
        };
      }
    );

    setCityAnalysisData(cityData);
    } catch (error) {
      console.error('Error in city analysis:', error)
    }
  })();
}, [activeAnalytic, currentUserRole, assignedLeadIds]);

useEffect(() => {
  if (activeAnalytic !== "sales") return;

  ;(async () => {
    try {
      // fetch payments with role-based filtering
      let manualQuery = supabase.from("manual_payment").select("plan, amount, payment_date, lead_id")
      let linksQuery = supabase.from("payment_links").select("plan, amount, payment_date, lead_id")
      
      // Apply role-based filtering for executives
      if (currentUserRole === EXECUTIVE_ROLE && assignedLeadIds.length > 0) {
        manualQuery = manualQuery.in('lead_id', assignedLeadIds)
        linksQuery = linksQuery.in('lead_id', assignedLeadIds)
      }
      
      const [manualRes, linkRes] = await Promise.all([
        manualQuery,
        linksQuery,
      ]);
    if (manualRes.error || linkRes.error) {
      console.error(manualRes.error ?? linkRes.error);
      return;
    }
    const all = [...(manualRes.data ?? []), ...(linkRes.data ?? [])];

    // group by month & plan
    const monthOrder = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const grouped: Record<string, Record<string, number>> = {};
    all.forEach(({ plan = "Unknown", amount, payment_date }) => {
      const m = new Date(payment_date).toLocaleString("default", { month: "short" });
      grouped[m] ??= {};
      grouped[m][plan] = (grouped[m][plan] || 0) + amount;
    });

    // sort months
    const sorted = Object.keys(grouped).sort(
      (a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b)
    );

    // build chart data
    const formatted = sorted.map((m) => ({ month: m, ...grouped[m] }));
    setSalesData(formatted);

    // --- now compute overview metrics ---
    const totalSales = all.reduce((sum, p) => sum + p.amount, 0);

    // revenue per month
    const monthRevenues = sorted.map((m) =>
      Object.values(grouped[m]).reduce((s, v) => s + v, 0)
    );
    const lastIdx = monthRevenues.length - 1;
    const prevIdx = lastIdx > 0 ? lastIdx - 1 : lastIdx;

    const growthRate =
      prevIdx >= 0
        ? parseFloat(
            (
              ((monthRevenues[lastIdx] - monthRevenues[prevIdx]) /
                (monthRevenues[prevIdx] || 1)) *
              100
            ).toFixed(1)
          )
        : 0;

    const bestIdx = monthRevenues.indexOf(Math.max(...monthRevenues));
    const bestMonth = sorted[bestIdx] || "";
    const bestMonthRevenue = monthRevenues[bestIdx] || 0;

    const avgDealSize =
      all.length > 0 ? parseFloat((totalSales / all.length).toFixed(0)) : 0;

    setSalesOverview({
      totalSales,
      growthRate,
      bestMonth,
      bestMonthRevenue,
      avgDealSize,
    });
    } catch (error) {
      console.error('Error in sales analysis:', error)
    }
  })();
}, [activeAnalytic, currentUserRole, assignedLeadIds]);


useEffect(() => {
  if (activeAnalytic !== "livemembers") return

  ;(async () => {
    try {
      // 1) Pull users with role-based filtering
      let usersQuery = supabase.from("users").select("email, is_active, date_of_birth")
      
      // 2) Pull leads with role-based filtering
      let leadsQuery = supabase.from("leads").select("email, city, profession")
      
      // Apply role-based filtering for executives
      if (currentUserRole === EXECUTIVE_ROLE && assignedLeadIds.length > 0) {
        // Get emails of assigned leads first
        const { data: assignedLeads, error: assignedError } = await supabase
          .from('leads')
          .select('email')
          .in('id', assignedLeadIds)
        
        if (assignedError) {
          console.error('Error fetching assigned leads:', assignedError)
          return
        }
        
        const assignedEmails = assignedLeads.map(l => l.email)
        if (assignedEmails.length === 0) {
          setLiveMembers({
            total: 0,
            active: 0,
            inactive: 0,
            locationWise: [],
            packageDistribution: [],
            ageCategoryWise: [],
            professionWise: [],
          })
          return
        }
        
        usersQuery = usersQuery.in('email', assignedEmails)
        leadsQuery = leadsQuery.in('id', assignedLeadIds)
      }
      
      const { data: users, error: uErr } = await usersQuery
      if (uErr) return console.error(uErr)

      const { data: leads, error: lErr } = await leadsQuery
      if (lErr) return console.error(lErr)

    // 3) Pull plans
    const [mRes, pRes] = await Promise.all([
      supabase.from("manual_payment").select("plan"),
      supabase.from("payment_links").select("plan"),
    ])
    if (mRes.error || pRes.error) return console.error(mRes.error || pRes.error)

    // Build a lookup from lead-email → { city, profession }
    const leadMap = Object.fromEntries(
      (leads || []).map((r) => [r.email, { city: r.city || "Unknown", profession: r.profession || "Unknown" }])
    )

    // 4) Package distribution (just total count per plan)
    const allPlans = [...(mRes.data || []), ...(pRes.data || [])].map((r) => r.plan || "Unknown")
    const pkgCounts = allPlans.reduce<Record<string, number>>((acc, pkg) => {
      acc[pkg] = (acc[pkg] ?? 0) + 1
      return acc
    }, {})
    const packageDistribution = Object.entries(pkgCounts).map(([pkg, total]) => ({ package: pkg, total }))

    // 5) Build member array with computed fields
    type Member = {
      email: string
      is_active: boolean
      age: number
      city: string
      profession: string
    }
    const members: Member[] = (users || []).map((u) => {
      const dob = new Date(u.date_of_birth!)
      const age = Math.floor((Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25))
      const info = leadMap[u.email] || { city: "Unknown", profession: "Unknown" }
      return { email: u.email, is_active: u.is_active, age, city: info.city, profession: info.profession }
    })

    // 6) Totals
    const total = members.length
    const active = members.filter((m) => m.is_active).length
    const inactive = total - active

    // 7) Location-wise aggregation
    const locAgg = members.reduce<
      Record<string, { active: number; inactive: number; total: number }>
    >((acc, m) => {
      acc[m.city] = acc[m.city] || { active: 0, inactive: 0, total: 0 }
      acc[m.city].total++
      m.is_active ? acc[m.city].active++ : acc[m.city].inactive++
      return acc
    }, {})
    const locationWise = Object.entries(locAgg).map(([location, stats]) => ({
      location,
      ...stats,
    }))

    // 8) Age-category aggregation
    const bins: Record<string, [number, number]> = {
      "18-25": [18, 25],
      "26-35": [26, 35],
      "36-45": [36, 45],
      "46-55": [46, 55],
      "55+": [56, 200],
    }
    const ageAgg: Record<string, { active: number; inactive: number; total: number }> = {}
    members.forEach((m) => {
      const cat =
        Object.entries(bins).find(([_, [min, max]]) => m.age >= min && m.age <= max)?.[0] || "Unknown"
      ageAgg[cat] = ageAgg[cat] || { active: 0, inactive: 0, total: 0 }
      ageAgg[cat].total++
      m.is_active ? ageAgg[cat].active++ : ageAgg[cat].inactive++
    })
    const ageCategoryWise = Object.entries(ageAgg).map(([category, stats]) => ({
      category,
      ...stats,
    }))

    // 9) Profession-wise aggregation
    const profAgg: Record<string, { active: number; inactive: number; total: number }> = {}
    members.forEach((m) => {
      profAgg[m.profession] = profAgg[m.profession] || { active: 0, inactive: 0, total: 0 }
      profAgg[m.profession].total++
      m.is_active ? profAgg[m.profession].active++ : profAgg[m.profession].inactive++
    })
    const professionWise = Object.entries(profAgg).map(([profession, stats]) => ({
      profession,
      ...stats,
    }))

    // 10) Update state
    setLiveMembers({
      total,
      active,
      inactive,
      locationWise,
      packageDistribution,
      ageCategoryWise,
      professionWise,
    })
    } catch (error) {
      console.error('Error in live members analysis:', error)
    }
  })()
}, [activeAnalytic, currentUserRole, assignedLeadIds])

useEffect(() => {
  if (activeAnalytic !== "conversion") return;

  (async () => {
    try {
      // 1) Fetch leads with role-based filtering
      let leadsQuery = supabase.from("leads").select("id, email, source")
      
      // Apply role-based filtering for executives
      if (currentUserRole === EXECUTIVE_ROLE && assignedLeadIds.length > 0) {
        leadsQuery = leadsQuery.in('id', assignedLeadIds)
      }
      
      const { data: leads, error: leadsErr } = await leadsQuery
      if (leadsErr) {
        console.error("Leads error:", leadsErr);
        return;
      }

    // 2) Fetch all lead assignments
    const { data: assignments, error: assignErr } = await supabase
      .from("lead_assignments")
      .select("lead_id, assigned_to");
    if (assignErr) {
      console.error("Assignments error:", assignErr);
      return;
    }

    // 3) Map each lead → RM user ID
    const leadToRmId: Record<string, string> = {};
    assignments.forEach(({ lead_id, assigned_to }) => {
      leadToRmId[lead_id] = assigned_to;
    });

    // 4) Fetch RM user details (first+last name)
    const rmIds = Array.from(new Set(assignments.map(a => a.assigned_to))).filter(Boolean);
    const userMap: Record<string, string> = {};
    if (rmIds.length) {
      const { data: rms, error: rmsErr } = await supabase
        .from("users")
        .select("id, first_name, last_name")
        .in("id", rmIds);
      if (rmsErr) console.error("RM fetch error:", rmsErr);
      else rms.forEach(u => {
        userMap[u.id] = `${u.first_name} ${u.last_name}`;
      });
    }

    // 5) Fetch converted users (by email)
    const { data: users, error: usersErr } = await supabase
      .from("users")
      .select("email");
    if (usersErr) {
      console.error("Users error:", usersErr);
      return;
    }
    const convertedEmails = new Set(users.map(u => u.email));

    // 6) Fetch payments
    const [mRes, lRes] = await Promise.all([
      supabase.from("manual_payment").select("amount, lead_id"),
      supabase.from("payment_links").select("amount, lead_id"),
    ]);
    if (mRes.error || lRes.error) {
      console.error("Payments error:", mRes.error ?? lRes.error);
      return;
    }
    const allPayments = [...(mRes.data ?? []), ...(lRes.data ?? [])];

    // 7) Build revenue‐by‐lead map
    const revByLead: Record<string, number> = {};
    allPayments.forEach(p => {
      revByLead[p.lead_id] = (revByLead[p.lead_id] ?? 0) + p.amount;
    });

    // 8) Aggregate by source & by RM
    const srcAgg: Record<string, { leads: number; conversions: number; revenue: number }> = {};
    const rmAgg: Record<string, { leads: number; conversions: number; revenue: number }> = {};
    const monthWiseAgg: Record<string, { leads: number; conversions: number; revenue: number }> = {}; // For monthly aggregation

    leads.forEach(lead => {
      const { id, email, source = "Unknown" } = lead;
      const leadMonth = new Date().getMonth(); // Assuming you get the month of the lead creation or data
      const monthKey = new Date().toLocaleString("default", { month: "short" }); // e.g., "Jan"

      // Source-wise aggregation
      srcAgg[source] ??= { leads: 0, conversions: 0, revenue: 0 };
      srcAgg[source].leads++;
      if (convertedEmails.has(email)) {
        srcAgg[source].conversions++;
        srcAgg[source].revenue += revByLead[id] ?? 0;
      }

      // RM-wise aggregation
      const rmId = leadToRmId[id];
      const rmName = userMap[rmId] || "Unassigned";
      rmAgg[rmName] ??= { leads: 0, conversions: 0, revenue: 0 };
      rmAgg[rmName].leads++;
      if (convertedEmails.has(email)) {
        rmAgg[rmName].conversions++;
        rmAgg[rmName].revenue += revByLead[id] ?? 0;
      }

      // Monthly aggregation
      monthWiseAgg[monthKey] ??= { leads: 0, conversions: 0, revenue: 0 };
      monthWiseAgg[monthKey].leads++;
      if (convertedEmails.has(email)) {
        monthWiseAgg[monthKey].conversions++;
        monthWiseAgg[monthKey].revenue += revByLead[id] ?? 0;
      }
    });

    // 9) Format the aggregated data
    const sourceWise = Object.entries(srcAgg).map(([source, v]) => ({
      source,
      leads: v.leads,
      conversions: v.conversions,
      rate: parseFloat(((v.conversions / v.leads) * 100).toFixed(1)),
      revenue: v.revenue,
    }));

    const rmWise = Object.entries(rmAgg).map(([rm, v]) => ({
      rm,
      leads: v.leads,
      conversions: v.conversions,
      rate: parseFloat(((v.conversions / v.leads) * 100).toFixed(1)),
      revenue: v.revenue,
    }));

    const monthWise = Object.entries(monthWiseAgg).map(([month, v]) => ({
      month,
      leads: v.leads,
      conversions: v.conversions,
      rate: parseFloat(((v.conversions / v.leads) * 100).toFixed(1)),
      revenue: v.revenue,
    }));

    // 10) Update the state
    setConversionData({ sourceWise, rmWise, monthWise });
    } catch (error) {
      console.error('Error in conversion analysis:', error)
    }
  })();
}, [activeAnalytic, currentUserRole, assignedLeadIds]);



useEffect(() => {
  if (activeAnalytic !== "source") return;

  (async () => {
    try {
      // 1) Fetch leads with role-based filtering
      let leadsQuery = supabase.from("leads").select("id, email, source")
      
      // Apply role-based filtering for executives
      if (currentUserRole === EXECUTIVE_ROLE && assignedLeadIds.length > 0) {
        leadsQuery = leadsQuery.in('id', assignedLeadIds)
      }
      
      const { data: leads, error: leadsErr } = await leadsQuery
      if (leadsErr) {
        console.error("Leads error:", leadsErr);
        return;
      }

    // 2) Fetch all user emails (converted leads)
    const { data: users, error: usersErr } = await supabase
      .from("users")
      .select("email");
    if (usersErr) {
      console.error("Users error:", usersErr);
      return;
    }
    const converted = new Set(users.map((u) => u.email));

    // 3) Fetch payments from both tables
    const [mRes, lRes] = await Promise.all([
      supabase.from("manual_payment").select("amount, lead_id"),
      supabase.from("payment_links").select("amount, lead_id"),
    ]);
    if (mRes.error || lRes.error) {
      console.error("Payments error:", mRes.error ?? lRes.error);
      return;
    }
    const payments = [...(mRes.data || []), ...(lRes.data || [])];

    // 4) Build revenue-by-lead map
    const revByLead: Record<string, number> = {};
    payments.forEach((p) => {
      revByLead[p.lead_id] = (revByLead[p.lead_id] || 0) + p.amount;
    });

    // 5) Aggregate per source
    const agg: Record<
      string,
      { count: number; revenue: number; conversions: number }
    > = {};
    leads.forEach((lead) => {
      const src = lead.source || "Unknown";
      if (!agg[src]) agg[src] = { count: 0, revenue: 0, conversions: 0 };
      agg[src].count++;
      if (converted.has(lead.email)) {
        agg[src].conversions++;
        agg[src].revenue += revByLead[lead.id] || 0;
      }
    });

    // 6) Build array with conversion % 
    const result = Object.entries(agg).map(
      ([source, { count, revenue, conversions }]) => ({
        source,
        count,
        revenue,
        conversion: parseFloat(((conversions / count) * 100).toFixed(1)),
      })
    );

    setSourceAnalysisData(result);
    } catch (error) {
      console.error('Error in source analysis:', error)
    }
  })();
}, [activeAnalytic, currentUserRole, assignedLeadIds]);

useEffect(() => {
  if (activeAnalytic !== "renewals") return;

  (async () => {
    try {
      // 1. Fetch payments with role-based filtering
      let manualQuery = supabase.from("manual_payment").select("amount, payment_date, lead_id")
      let linksQuery = supabase.from("payment_links").select("amount, payment_date, lead_id")
      
      // Apply role-based filtering for executives
      if (currentUserRole === EXECUTIVE_ROLE && assignedLeadIds.length > 0) {
        manualQuery = manualQuery.in('lead_id', assignedLeadIds)
        linksQuery = linksQuery.in('lead_id', assignedLeadIds)
      }
      
      const [{ data: manualPayments, error: manualError }, { data: paymentLinks, error: linkError }] = await Promise.all([
        manualQuery,
        linksQuery,
      ]);

      if (manualError || linkError) {
        console.error("Payments fetch error:", manualError ?? linkError);
        return;
      }

      // 2. Fetch leads with role-based filtering
      let leadsQuery = supabase.from("leads").select("id, email, source")
      
      // Apply role-based filtering for executives
      if (currentUserRole === EXECUTIVE_ROLE && assignedLeadIds.length > 0) {
        leadsQuery = leadsQuery.in('id', assignedLeadIds)
      }
      
      const { data: leads, error: leadsError } = await leadsQuery

      if (leadsError) {
        console.error("Leads fetch error:", leadsError);
        return;
      }

    // 3. Create a map to associate each lead with its source
    const leadSourceMap: Record<string, string> = {};
    leads.forEach((lead) => {
      leadSourceMap[lead.id] = lead.source || "Unknown";
    });

    // 4. Aggregate payments by user, track total and renewed payments
    const userPaymentsMap: Record<string, { total: number; renewed: number; lastPaymentDate: Date }> = {};

    const allPayments = [...(manualPayments || []), ...(paymentLinks || [])];

    allPayments.forEach((payment) => {
      const { lead_id, payment_date, amount } = payment;
      const paymentDate = new Date(payment_date);
      const userPayments = userPaymentsMap[lead_id] || { total: 0, renewed: 0, lastPaymentDate: new Date(0) };

      // Update total payment amount for the user
      userPayments.total += amount;

      // Check if this payment is a renewal (based on date)
      const isRenewal = paymentDate > userPayments.lastPaymentDate;

      if (isRenewal) {
        userPayments.renewed += 1;  // Increment the renewal count
        userPayments.lastPaymentDate = paymentDate;  // Update the last payment date
      }

      userPaymentsMap[lead_id] = userPayments;
    });

    // 5. Aggregate renewals by source and coach (if available)
    const renewalBySource: Record<string, { total: number; renewed: number; rate: number }> = {};
    const renewalByCoach: Record<string, { total: number; renewed: number; rate: number }> = {};

    Object.keys(userPaymentsMap).forEach((lead_id) => {
      const { total, renewed } = userPaymentsMap[lead_id];
      const source = leadSourceMap[lead_id] || "Unknown";
      const coach = "Default Coach"; // Replace this with actual coach data if available

      if (!renewalBySource[source]) renewalBySource[source] = { total: 0, renewed: 0, rate: 0 };
      if (!renewalByCoach[coach]) renewalByCoach[coach] = { total: 0, renewed: 0, rate: 0 };

      renewalBySource[source].total += total;
      renewalBySource[source].renewed += renewed;

      renewalByCoach[coach].total += total;
      renewalByCoach[coach].renewed += renewed;
    });

    // 6. Calculate the renewal rate
    const calculateRate = (renewed: number, total: number) => (total > 0 ? ((renewed / total) * 100).toFixed(1) : "0.0");

    const sourceWise = Object.entries(renewalBySource).map(([source, { total, renewed }]) => ({
      source,
      total,
      renewed,
      rate: calculateRate(renewed, total),
    }));

    const coachWise = Object.entries(renewalByCoach).map(([coach, { total, renewed }]) => ({
      coach,
      total,
      renewed,
      rate: calculateRate(renewed, total),
    }));

    // 7. Set the state with the aggregated data
    setRenewalAnalytics({
      sourceWise,
      coachWise,
    });
    } catch (error) {
      console.error('Error in renewals analysis:', error)
    }
  })();
}, [activeAnalytic, currentUserRole, assignedLeadIds]);



  const clearFilters = () => {
    setSearchTerm("")
    setSourceFilter("all")
    setCityFilter("all")
    setPackageFilter("all")
    setGenderFilter("all")
    setCoachFilter("all")
    setDateRange(undefined)
  }

  const getAnalyticsData = () => {
    switch (activeAnalytic) {
      case "conversion":
        return conversionData
      case "renewals":
        return renewalAnalytics
      case "sales":
        return salesData
      case "package":
        return packageAnalysis
      case "city":
        return cityAnalysis
      case "gender":
        return genderAnalysisData
      case "source":
        return sourceAnalysis
      case "followup":
        return missedFollowUpAnalysis
      case "livemembers":
        return liveMemberAnalysis
      case "renewaltrends":
        return renewalTrends
      default:
        return {}
    }
  }

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
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="social">Social Media</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="coldcall">Cold Call</SelectItem>
                  <SelectItem value="email">Email Campaign</SelectItem>
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
                  <SelectItem value="mumbai">Mumbai</SelectItem>
                  <SelectItem value="delhi">Delhi</SelectItem>
                  <SelectItem value="bangalore">Bangalore</SelectItem>
                  <SelectItem value="chennai">Chennai</SelectItem>
                  <SelectItem value="pune">Pune</SelectItem>
                  <SelectItem value="hyderabad">Hyderabad</SelectItem>
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
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
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
                  <SelectItem value="sarah">Sarah Johnson</SelectItem>
                  <SelectItem value="mike">Mike Wilson</SelectItem>
                  <SelectItem value="lisa">Lisa Brown</SelectItem>
                  <SelectItem value="john">John Davis</SelectItem>
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
    {/* Header Cards */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Total Leads */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-green-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-emerald-700">
            Total Leads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-600">
            {conversionData.sourceWise.reduce((sum, x) => sum + x.leads, 0)}
          </div>
          <p className="text-xs text-slate-600">All sources combined</p>
        </CardContent>
      </Card>

      {/* Total Conversions */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-blue-700">
            Total Conversions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {conversionData.sourceWise.reduce((sum, x) => sum + x.conversions, 0)}
          </div>
          <p className="text-xs text-slate-600">Successful conversions</p>
        </CardContent>
      </Card>

      {/* Conversion Rate */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-purple-700">
            Conversion Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">
            {(() => {
              const leads = conversionData.sourceWise.reduce((s, i) => s + i.leads, 0)
              const conv = conversionData.sourceWise.reduce(
                (s, i) => s + i.conversions,
                0
              )
              return leads ? `${((conv / leads) * 100).toFixed(1)}%` : "0%"
            })()}
          </div>
          <p className="text-xs text-slate-600">Overall success rate</p>
        </CardContent>
      </Card>

      {/* Total Revenue */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-red-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-orange-700">
            Total Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {`$${conversionData.sourceWise
              .reduce((sum, x) => sum + x.revenue, 0)
              .toLocaleString()}`}
          </div>
          <p className="text-xs text-slate-600">From conversions</p>
        </CardContent>
      </Card>
    </div>

    {/* Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Source-wise Conversion */}
      <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-emerald-700">Source-wise Conversion</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={conversionData.sourceWise}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="source" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255,255,255,0.95)",
                  border: "1px solid #10b981",
                  borderRadius: 8,
                }}
              />
              <Bar dataKey="leads" fill="#10b981" name="Leads" radius={[4, 4, 0, 0]} />
              <Bar
                dataKey="conversions"
                fill="#3b82f6"
                name="Conversions"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* RM-wise Performance */}
      <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-emerald-700">RM-wise Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={conversionData.rmWise}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="rm" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar yAxisId="left" dataKey="conversions" fill="#10b981" name="Conversions" />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="rate"
                stroke="#f59e0b"
                strokeWidth={3}
                name="Conversion Rate %"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>

    {/* (Optional) Monthly trends — you can leave your existing static AreaChart here */}
    <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-emerald-700">Monthly Conversion Trends</CardTitle>
      </CardHeader>
      <CardContent>
          <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={conversionData.monthWise}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="conversions"
            stroke="#10b981"
            fill="#10b981"
            name="Conversions"
            dot={{ fill: "#10b981", strokeWidth: 2, r: 6 }}
          />
          <Area
            type="monotone"
            dataKey="rate"
            stroke="#f59e0b"
            fill="#f59e0b"
            name="Conversion Rate %"
            dot={{ fill: "#f59e0b", strokeWidth: 2, r: 6 }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#3b82f6"
            fill="#3b82f6"
            name="Revenue"
            dot={{ fill: "#3b82f6", strokeWidth: 2, r: 6 }}
          />
        </AreaChart>
      </ResponsiveContainer>
      </CardContent>
    </Card>
  </div>
)}
  


{activeAnalytic === "renewals" && (
        <div className="space-y-6">
          {/* Renewal Analytics Header */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-green-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-emerald-700">Total Due</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">313</div>
                <p className="text-xs text-slate-600">Memberships due for renewal</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-700">Renewed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">234</div>
                <p className="text-xs text-slate-600">Successfully renewed</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-purple-700">Renewal Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">74.8%</div>
                <p className="text-xs text-slate-600">Overall renewal rate</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-red-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-orange-700">Renewal Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">$617K</div>
                <p className="text-xs text-slate-600">From renewals</p>
              </CardContent>
            </Card>
          </div>

          {/* Renewal Analytics Charts */}
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
                  <BarChart data={renewalAnalytics.coachWise} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis dataKey="coach" type="category" tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="renewed" fill="#10b981" name="Renewed" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Renewal Trends */}
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
          {/* Sales Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
  {/* Total Sales */}
  <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-green-50">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium text-emerald-700">
        Total Sales
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-emerald-600">
        ${salesOverview.totalSales.toLocaleString()}
      </div>
      <p className="text-xs text-slate-600">All time</p>
    </CardContent>
  </Card>

  {/* Growth Rate */}
  <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium text-blue-700">
        Growth Rate
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-blue-600">
        {salesOverview.growthRate > 0 ? "+" : ""}
        {salesOverview.growthRate}%
      </div>
      <p className="text-xs text-slate-600">Month over month</p>
    </CardContent>
  </Card>

  {/* Best Month */}
  <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium text-purple-700">
        Best Month
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-purple-600">
        {salesOverview.bestMonth}
      </div>
      <p className="text-xs text-slate-600">
        ${salesOverview.bestMonthRevenue.toLocaleString()} revenue
      </p>
    </CardContent>
  </Card>

  {/* Avg Deal Size */}
  <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-red-50">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium text-orange-700">
        Avg Deal Size
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-orange-600">
        ${salesOverview.avgDealSize.toLocaleString()}
      </div>
      <p className="text-xs text-slate-600">Per transaction</p>
    </CardContent>
  </Card>
</div>

          {/* Monthly Sales Graph */}
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-emerald-700">Monthly Sales by Package</CardTitle>
            </CardHeader>
            <CardContent >
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value) => [`$${value.toLocaleString()}`, ""]}
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      border: "1px solid #10b981",
                      borderRadius: "8px",
                    }}
                  />
                 {(
                     Object.keys(salesData[0] || {})
                       .filter((k) => k !== "month")
                   ).map((plan, idx) => (
                     <Bar
                       key={plan}
                       dataKey={plan}
                       stackId="a"
                       fill={COLORS[idx % COLORS.length]}
                       name={plan}
                     />
                   ))}
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
)}

{activeAnalytic === "package" && (
  <div className="space-y-6">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Dynamic Package Distribution */}
      <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-emerald-700">Package Distribution</CardTitle>
        </CardHeader>
        <CardContent className=" flex items-center justify-center ">
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
                `${((value / totalCount) * 100).toFixed(2)}%`,
                name
              ]}
            />            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Dynamic Package Performance Metrics */}
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
                    <div className="font-semibold">${pkg.revenue.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-slate-600">Avg Value:</span>
                    <div className="font-semibold">${pkg.avgValue}</div>
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
    {/* Chart */}
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

    {/* Top-3 City Cards */}
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
                <span className="font-semibold">${revenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Growth:</span>
                <Badge className="bg-emerald-100 text-emerald-700">+{growth}%</Badge>
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
      {/* — the dynamic pie chart — */}
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

      {/* — the dynamic metric cards — */}
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
                  <span className="text-slate-600">Count:</span>{' '}
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
    {/* Source Analysis Chart */}
    <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-emerald-700">
          Source-wise Performance Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={sourceAnalysisData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="source" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12 }}
            />
            <Tooltip />
            <Bar
              yAxisId="left"
              dataKey="count"
              fill="#10b981"
              name="Count"
            />
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

    {/* Source Performance Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sourceAnalysisData.map((src, i) => (
        <Card
          key={i}
          className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-green-50"
        >
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
                <span className="font-semibold">
                  ${src.revenue.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Conversion:</span>
                <Badge className="bg-emerald-100 text-emerald-700">
                  {src.conversion}%
                </Badge>
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
          {/* Missed Follow-up Analysis */}
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-emerald-700">Missed Follow-up Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={missedFollowUpAnalysis}>
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

          {/* Follow-up Performance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {missedFollowUpAnalysis.map((counselor, index) => (
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
    {/* Overview Cards */}
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
            {((liveMembers.active / liveMembers.total) * 100).toFixed(1)}% active rate
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
            {((liveMembers.active / liveMembers.total) * 100).toFixed(1)}%
          </div>
          <p className="text-xs text-slate-600">Overall engagement</p>
        </CardContent>
      </Card>
    </div>

    {/* Location & Package Charts */}
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
            label={({ name, percent }) =>
              `${name}: ${(percent * 100).toFixed(1)}%`
            }
            outerRadius={80}
          >
            {liveMembers.packageDistribution.map((_, idx) => (
              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => {
              const total = liveMembers.packageDistribution
                .reduce((sum, entry) => sum + entry.total, 0)
              const pct = ((value / total) * 100).toFixed(1)
              return [`${pct}%`, name]
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
    </div>

{/* Age Category Distribution */}
<Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
  <CardHeader>
    <CardTitle className="text-emerald-700">Age Category Distribution</CardTitle>
  </CardHeader>
  <CardContent>
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={liveMembers.ageCategoryWise}
        layout="vertical"              // ← here!
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis type="number" tick={{ fontSize: 12 }} />
        <YAxis
          dataKey="category"
          type="category"
          tick={{ fontSize: 12 }}
        />
        <Tooltip />
        <Bar dataKey="active" fill="#10b981" name="Active" />
        <Bar dataKey="inactive" fill="#ef4444" name="Inactive" />
      </BarChart>
    </ResponsiveContainer>
  </CardContent>
  </Card>

{/* Profession-wise Distribution */}
<Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
  <CardHeader>
    <CardTitle className="text-emerald-700">Profession-wise Distribution</CardTitle>
  </CardHeader>
  <CardContent>
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={liveMembers.professionWise}
        layout="vertical"              // ← and here!
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis type="number" tick={{ fontSize: 10 }} />
        <YAxis
          dataKey="profession"
          type="category"
          tick={{ fontSize: 12 }}
        />
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
          {/* Renewal Trends Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-green-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-emerald-700">Total Renewals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">308</div>
                <p className="text-xs text-slate-600">Last 6 months</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-700">Renewal Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">$770K</div>
                <p className="text-xs text-slate-600">From renewals</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-purple-700">Avg Renewal Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">76.4%</div>
                <p className="text-xs text-slate-600">6-month average</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-red-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-orange-700">Growth Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">+13.2%</div>
                <p className="text-xs text-slate-600">Month over month</p>
              </CardContent>
            </Card>
          </div>

          {/* Renewal Trends Chart */}
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-emerald-700">Monthly Renewal Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={renewalTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value, name) => [
                      name === "revenue" ? `$${value.toLocaleString()}` : value,
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
