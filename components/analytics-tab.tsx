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
const conversionAnalytics = {
  sourceWise: [
    { source: "Website", leads: 145, conversions: 67, rate: 46.2, revenue: 167500 },
    { source: "Social Media", leads: 132, conversions: 58, rate: 43.9, revenue: 145000 },
    { source: "Referral", leads: 98, conversions: 52, rate: 53.1, revenue: 156000 },
    { source: "Cold Call", leads: 87, conversions: 28, rate: 32.2, revenue: 84000 },
    { source: "Email Campaign", leads: 76, conversions: 31, rate: 40.8, revenue: 93000 },
  ],
  rmWise: [
    { rm: "Sarah Johnson", leads: 156, conversions: 78, rate: 50.0, revenue: 195000 },
    { rm: "Mike Wilson", leads: 134, conversions: 62, rate: 46.3, revenue: 155000 },
    { rm: "Lisa Brown", leads: 128, conversions: 54, rate: 42.2, revenue: 135000 },
    { rm: "John Davis", leads: 120, conversions: 42, rate: 35.0, revenue: 105000 },
  ],
  monthWise: [
    { month: "Jan", leads: 98, conversions: 42, rate: 42.9, revenue: 105000 },
    { month: "Feb", leads: 112, conversions: 52, rate: 46.4, revenue: 130000 },
    { month: "Mar", leads: 134, conversions: 67, rate: 50.0, revenue: 167500 },
    { month: "Apr", leads: 145, conversions: 71, rate: 49.0, revenue: 177500 },
    { month: "May", leads: 156, conversions: 78, rate: 50.0, revenue: 195000 },
    { month: "Jun", leads: 167, conversions: 86, rate: 51.5, revenue: 215000 },
  ],
}

const renewalAnalytics = {
  sourceWise: [
    { source: "Website", total: 89, renewed: 67, rate: 75.3, revenue: 167500 },
    { source: "Social Media", total: 76, renewed: 54, rate: 71.1, revenue: 135000 },
    { source: "Referral", total: 65, renewed: 52, rate: 80.0, revenue: 156000 },
    { source: "Cold Call", total: 45, renewed: 28, rate: 62.2, revenue: 84000 },
    { source: "Email Campaign", total: 38, renewed: 25, rate: 65.8, revenue: 75000 },
  ],
  coachWise: [
    { coach: "Sarah Johnson", total: 78, renewed: 62, rate: 79.5, revenue: 155000 },
    { coach: "Mike Wilson", total: 67, renewed: 48, rate: 71.6, revenue: 120000 },
    { coach: "Lisa Brown", total: 54, renewed: 38, rate: 70.4, revenue: 95000 },
    { coach: "John Davis", total: 42, renewed: 27, rate: 64.3, revenue: 67500 },
  ],
  monthWise: [
    { month: "Jan", total: 45, renewed: 32, rate: 71.1, revenue: 80000 },
    { month: "Feb", total: 52, renewed: 38, rate: 73.1, revenue: 95000 },
    { month: "Mar", total: 67, renewed: 51, rate: 76.1, revenue: 127500 },
    { month: "Apr", total: 71, renewed: 56, rate: 78.9, revenue: 140000 },
    { month: "May", total: 78, renewed: 62, rate: 79.5, revenue: 155000 },
    { month: "Jun", total: 86, renewed: 69, rate: 80.2, revenue: 172500 },
  ],
}

const salesGraphData = [
  { month: "Jan", basic: 25000, standard: 45000, premium: 67000, enterprise: 85000 },
  { month: "Feb", basic: 28000, standard: 52000, premium: 78000, enterprise: 95000 },
  { month: "Mar", basic: 32000, standard: 58000, premium: 89000, enterprise: 112000 },
  { month: "Apr", basic: 35000, standard: 65000, premium: 95000, enterprise: 125000 },
  { month: "May", basic: 38000, standard: 72000, premium: 108000, enterprise: 142000 },
  { month: "Jun", basic: 42000, standard: 78000, premium: 125000, enterprise: 165000 },
]

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

useEffect(() => {
  if (activeAnalytic !== 'gender') return
  ;(async () => {
    // fetch only the gender column
    const { data, error } = await supabase
      .from('users')
      .select('gender')

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
  })()
}, [activeAnalytic])

useEffect(() => {
  if (activeAnalytic !== "package") return

  ;(async () => {
    // fetch plan & amount from both tables
    const [{ data: manual, error: em }, { data: links, error: el }] = await Promise.all([
      supabase.from("manual_payment").select("plan, amount"),
      supabase.from("payment_links").select("plan, amount"),
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
  })()
}, [activeAnalytic])

useEffect(() => {
  if (activeAnalytic !== "city") return;

  (async () => {
    // 1. Fetch all leads (email, city, id)
    const { data: leads, error: leadsError } = await supabase
      .from("leads")
      .select("id, email, city");

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
  })();
}, [activeAnalytic]);

useEffect(() => {
  if (activeAnalytic !== "sales") return;

  const fetchSales = async () => {
    const formatMonth = (dateStr: string) => {
      const d = new Date(dateStr);
      return d.toLocaleString("default", { month: "short" });
    };

    // 1. Fetch all payments
    const [manualRes, linkRes] = await Promise.all([
      supabase.from("manual_payment").select("amount, plan, payment_date"),
      supabase.from("payment_links").select("amount, plan, payment_date"),
    ]);

    if (manualRes.error || linkRes.error) {
      console.error(manualRes.error || linkRes.error);
      return;
    }

    const allPayments = [...(manualRes.data || []), ...(linkRes.data || [])];

    // 2. Group by month and plan
    const grouped: Record<string, Record<string, number>> = {};

    for (const payment of allPayments) {
      if (!payment.payment_date || !payment.plan) continue;
      const month = formatMonth(payment.payment_date);
      const plan = payment.plan;

      if (!grouped[month]) grouped[month] = {};
      if (!grouped[month][plan]) grouped[month][plan] = 0;

      grouped[month][plan] += payment.amount;
    }

    // 3. Convert to chart-compatible format
    const sortedMonths = Object.keys(grouped).sort(
      (a, b) =>
        new Date(`1 ${a} 2023`).getTime() - new Date(`1 ${b} 2023`).getTime()
    );

    const formatted = sortedMonths.map((month) => ({
      month,
      ...grouped[month],
    }));

    setSalesData(formatted);
  };

  fetchSales();
}, [activeAnalytic]);



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
        return conversionAnalytics
      case "renewals":
        return renewalAnalytics
      case "sales":
        return salesGraphData
      case "package":
        return packageAnalysis
      case "city":
        return cityAnalysis
      case "gender":
        return genderAnalysis
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

      {/* Dynamic Analytics Content */}
      {activeAnalytic === "conversion" && (
        <div className="space-y-6">
          {/* Conversion Analytics Header */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-green-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-emerald-700">Total Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">538</div>
                <p className="text-xs text-slate-600">All sources combined</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-700">Total Conversions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">236</div>
                <p className="text-xs text-slate-600">Successful conversions</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-purple-700">Conversion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">43.9%</div>
                <p className="text-xs text-slate-600">Overall success rate</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-red-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-orange-700">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">$645K</div>
                <p className="text-xs text-slate-600">From conversions</p>
              </CardContent>
            </Card>
          </div>

          {/* Source Wise Conversion */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-emerald-700">Source-wise Conversion</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={conversionAnalytics.sourceWise}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="source" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        border: "1px solid #10b981",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="leads" fill="#10b981" name="Leads" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="conversions" fill="#3b82f6" name="Conversions" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-emerald-700">RM-wise Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={conversionAnalytics.rmWise}>
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

          {/* Month Wise Conversion Trend */}
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-emerald-700">Monthly Conversion Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={conversionAnalytics.monthWise}>
                  <defs>
                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="colorConversions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="leads"
                    stackId="1"
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#colorLeads)"
                    name="Leads"
                  />
                  <Area
                    type="monotone"
                    dataKey="conversions"
                    stackId="2"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorConversions)"
                    name="Conversions"
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
            <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-green-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-emerald-700">Total Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">$2.1M</div>
                <p className="text-xs text-slate-600">Last 6 months</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-700">Growth Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">+18.5%</div>
                <p className="text-xs text-slate-600">Month over month</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-purple-700">Best Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">June</div>
                <p className="text-xs text-slate-600">$410K revenue</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-red-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-orange-700">Avg Deal Size</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">$2,650</div>
                <p className="text-xs text-slate-600">Per customer</p>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Sales Graph */}
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-emerald-700">Monthly Sales by Package</CardTitle>
            </CardHeader>
            <CardContent>
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
                  <Bar dataKey="basic" stackId="a" fill="#10b981" name="Basic" />
                  <Bar dataKey="standard" stackId="a" fill="#3b82f6" name="Standard" />
                  <Bar dataKey="premium" stackId="a" fill="#f59e0b" name="Premium" />
                  <Bar dataKey="enterprise" stackId="a" fill="#ef4444" name="Enterprise" />
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
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={packageAnalysisData}
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
              <Tooltip />
            </PieChart>
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
          {/* Source Analysis */}
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-emerald-700">Source-wise Performance Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={sourceAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="source" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar yAxisId="left" dataKey="count" fill="#10b981" name="Count" />
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
            {sourceAnalysis.map((source, index) => (
              <Card key={index} className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-green-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-emerald-700 flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    {source.source}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Count:</span>
                      <span className="font-semibold">{source.count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Revenue:</span>
                      <span className="font-semibold">${source.revenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Conversion:</span>
                      <Badge className="bg-emerald-100 text-emerald-700">{source.conversion}%</Badge>
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
          {/* Live Members Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-green-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-emerald-700">Total Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">{liveMemberAnalysis.total}</div>
                <p className="text-xs text-slate-600">All registered members</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-700">Active Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{liveMemberAnalysis.active}</div>
                <p className="text-xs text-slate-600">
                  {((liveMemberAnalysis.active / liveMemberAnalysis.total) * 100).toFixed(1)}% active rate
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-red-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-orange-700">Inactive Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{liveMemberAnalysis.inactive}</div>
                <p className="text-xs text-slate-600">Need attention</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-purple-700">Activity Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {((liveMemberAnalysis.active / liveMemberAnalysis.total) * 100).toFixed(1)}%
                </div>
                <p className="text-xs text-slate-600">Overall engagement</p>
              </CardContent>
            </Card>
          </div>

          {/* Live Members Analysis Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-emerald-700">Location-wise Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={liveMemberAnalysis.locationWise}>
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
                      data={liveMemberAnalysis.packageWise}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ package: pkg, total }) => `${pkg}: ${total}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="total"
                    >
                      {liveMemberAnalysis.packageWise.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Age Category and Profession Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-emerald-700">Age Category Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={liveMemberAnalysis.ageCategoryWise} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis dataKey="category" type="category" tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="active" fill="#10b981" name="Active" />
                    <Bar dataKey="inactive" fill="#ef4444" name="Inactive" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-emerald-700">Profession-wise Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={liveMemberAnalysis.professionWise} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis dataKey="profession" type="category" tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="active" fill="#10b981" name="Active" />
                    <Bar dataKey="inactive" fill="#ef4444" name="Inactive" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
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
