// app/api/cron/auto-assign-leads/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export const dynamic = 'force-dynamic'      // ensure it runs on demand
export const runtime = 'nodejs'              // avoid Edge for supabase-js service key

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET || '12345'

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('🔄 Starting automated lead assignment cron job...')

    const { data: configs, error: configError } = await supabase
      .from('auto_assignment_config')
      .select('*')
      .eq('is_enabled', true)

    if (configError) {
      console.error('Error fetching configs:', configError)
      return NextResponse.json({ error: 'Failed to fetch configurations' }, { status: 500 })
    }

    if (!configs || configs.length === 0) {
      console.log('No active auto-assignment configurations found')
      return NextResponse.json({ message: 'No active configurations', assignments: 0 }, { status: 200 })
    }

    let totalAssignments = 0

    for (const config of configs) {
      console.log(`Processing config for user: ${config.created_by}`)

      if (config.working_hours_only) {
        const now = new Date()
        const currentTime = now.getHours() * 60 + now.getMinutes()
        const [sh, sm] = config.working_hours_start.split(':').map(Number)
        const [eh, em] = config.working_hours_end.split(':').map(Number)
        const startTime = sh * 60 + sm
        const endTime = eh * 60 + em
        if (currentTime < startTime || currentTime > endTime) {
          console.log(`Outside working hours for config ${config.id}`)
          continue
        }
      }

      const { data: executives, error: execError } = await supabase
        .from('users')
        .select(`
          *,
          lead_assignments!lead_assignments_assigned_to_fkey(
            id,
            status
          )
        `)
        .eq('role_id', '1fe1759c-dc14-4933-947a-c240c046bcde')
        .eq('is_active', true)

      if (execError || !executives) {
        console.error('Error fetching executives:', execError)
        continue
      }

      const executivesWithWorkload = executives.map((exec: any) => ({
        ...exec,
        active_assignments: exec.lead_assignments?.filter((a: any) => a.status === 'active').length || 0
      }))

      const availableExecutives = executivesWithWorkload.filter((exec: any) => {
        const isBlacklisted = (config.blacklisted_executives || []).includes(exec.id)
        const isOverLimit = exec.active_assignments >= config.max_assignments_per_executive
        return !isBlacklisted && !isOverLimit
      })

      if (availableExecutives.length === 0) {
        console.log('No available executives for this config')
        continue
      }

      const { data: assignedLeadIds, error: assignedError } = await supabase
        .from('lead_assignments')
        .select('lead_id')
        .eq('status', 'active')

      if (assignedError) {
        console.error('Error fetching assigned leads:', assignedError)
        continue
      }

      const assignedIds = (assignedLeadIds || []).map((i: any) => i.lead_id)

      let leadQuery = supabase
        .from('leads')
        .select('*')
        .in('status', ['New', 'Hot', 'Warm', 'Cold'])
        .order('created_at', { ascending: false })
        .limit(10)

      if (assignedIds.length > 0) {
        // Supabase `not in` using a CSV string
        leadQuery = leadQuery.not('id', 'in', `(${assignedIds.join(',')})`)
      }

      const { data: pendingLeads, error: leadsError } = await leadQuery

      if (leadsError || !pendingLeads || pendingLeads.length === 0) {
        if (leadsError) console.error('Error fetching pending leads:', leadsError)
        else console.log('No pending leads found')
        continue
      }

      const priorityOrder: Record<string, number> = { High: 1, Medium: 2, Low: 3 }
      const sortedLeads = [...pendingLeads].sort(
        (a: any, b: any) =>
          (priorityOrder[a.priority] ?? 999) - (priorityOrder[b.priority] ?? 999)
      )

      let sortedExecutives = [...availableExecutives]
      switch (config.assignment_strategy) {
        case 'least_workload':
          sortedExecutives.sort((a: any, b: any) => a.active_assignments - b.active_assignments)
          break
        case 'priority_based':
          sortedExecutives.sort((a: any, b: any) => {
            const aIdx = (config.priority_executives || []).indexOf(a.id)
            const bIdx = (config.priority_executives || []).indexOf(b.id)
            if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx
            if (aIdx !== -1) return -1
            if (bIdx !== -1) return 1
            return a.active_assignments - b.active_assignments
          })
          break
        case 'round_robin':
          sortedExecutives.sort(() => Math.random() - 0.5)
          break
      }

      let executiveIndex = 0
      const assignments: any[] = []

      for (let i = 0; i < Math.min(sortedLeads.length, availableExecutives.length * 2); i++) {
        const lead: any = sortedLeads[i]
        const executive: any = sortedExecutives[executiveIndex % sortedExecutives.length]

        if (executive.active_assignments >= config.max_assignments_per_executive) break

        const assignmentData = {
          lead_id: lead.id,
          assigned_to: executive.id,
          assigned_by: config.created_by,
          assigned_at: new Date().toISOString(),
          status: 'active',
          priority: lead.priority,
          notes: `Auto-assigned via ${config.assignment_strategy} strategy (cron job)`,
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          is_auto_assigned: true
        }

        const { data: assignment, error: assignError } = await supabase
          .from('lead_assignments')
          .insert([assignmentData])
          .select()

        if (assignError) {
          console.error('Error creating assignment:', assignError)
          continue
        }

        const { error: leadUpdateError } = await supabase
          .from('leads')
          .update({
            status: 'assigned',
            counselor: `${executive.first_name} ${executive.last_name}`,
            updated_at: new Date().toISOString()
          })
          .eq('id', lead.id)

        if (leadUpdateError) {
          console.error('Error updating lead:', leadUpdateError)
          await supabase.from('lead_assignments').delete().eq('id', assignment?.[0]?.id)
          continue
        }

        assignments.push({ lead: lead.name, executive: `${executive.first_name} ${executive.last_name}` })
        executive.active_assignments++
        executiveIndex++
      }

      console.log(`Processed ${assignments.length} assignments for config ${config.id}`)
      totalAssignments += assignments.length
    }

    console.log(`🎉 Cron job completed. Total assignments: ${totalAssignments}`)
    return NextResponse.json({
      success: true,
      message: 'Auto-assignment completed',
      totalAssignments,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('❌ Cron job error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error?.message ?? 'Unknown error' },
      { status: 500 }
    )
  }
}
