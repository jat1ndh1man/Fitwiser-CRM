import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "your-anon-key"

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Role IDs as constants - Update these with your actual role IDs from the database
export const ROLE_IDS = {
  SUPERADMIN: "b00060fe-175a-459b-8f72-957055ee8c55",
  ADMIN: "46e786df-0272-4f22-aec2-56d2a517fa9d",
  MANAGER_1: "e032e8eb-f50b-41e1-8d16-52b17fd0903f",
  MANAGER_2: "11b93954-9a56-4ea5-a02c-15b731ee9dfb",
  EXECUTIVE: "1fe1759c-dc14-4933-947a-c240c046bcde",
}

export interface UserProfile {
  id: string
  email: string
  first_name: string
  last_name: string
  role_id: string
  profile_image_url?: string
  created_at: string
  updated_at: string
}

export interface UserSession {
  user: UserProfile
  canViewAllData: boolean
  assignedLeadIds?: string[]
  roleName: string
}

// Enhanced function to get current user session with RBAC
export async function getCurrentUserSession(): Promise<UserSession | null> {
  try {
    // Get authenticated user
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser()
    if (userErr || !user) return null

    // Get user profile with role information
    const { data: profile, error: profileErr } = await supabase
      .from("users")
      .select(`
        id, 
        email, 
        first_name, 
        last_name, 
        role_id, 
        profile_image_url,
        created_at,
        updated_at,
        roles!inner(name)
      `)
      .eq("id", user.id)
      .single()

    if (profileErr || !profile) {
      console.error("Error fetching user profile:", profileErr)
      return null
    }

    // Check if user can view all data (Superadmin, Admin, Managers)
    const canViewAllData = [ROLE_IDS.SUPERADMIN, ROLE_IDS.ADMIN, ROLE_IDS.MANAGER_1, ROLE_IDS.MANAGER_2].includes(
      profile.role_id,
    )

    let assignedLeadIds: string[] = []

    // If user is Executive, get their assigned lead IDs
    if (profile.role_id === ROLE_IDS.EXECUTIVE) {
      const { data: assignments, error: assignmentErr } = await supabase
        .from("lead_assignments")
        .select("lead_id")
        .eq("assigned_to", profile.id)

      if (!assignmentErr && assignments) {
        assignedLeadIds = assignments.map((a) => a.lead_id)
      }
    }

    return {
      user: profile,
      canViewAllData,
      assignedLeadIds: canViewAllData ? undefined : assignedLeadIds,
      roleName: profile.roles?.name || "Unknown",
    }
  } catch (error) {
    console.error("Error getting user session:", error)
    return null
  }
}

// Permission checking functions
export function hasPermission(userSession: UserSession | null, requiredRoles: string[]): boolean {
  if (!userSession) return false
  return requiredRoles.includes(userSession.user.role_id)
}

export function canAccessLead(userSession: UserSession | null, leadId: string): boolean {
  if (!userSession) return false
  if (userSession.canViewAllData) return true
  return userSession.assignedLeadIds?.includes(leadId) || false
}

export function canManageUsers(userSession: UserSession | null): boolean {
  return hasPermission(userSession, [ROLE_IDS.SUPERADMIN, ROLE_IDS.ADMIN])
}

export function canViewReports(userSession: UserSession | null): boolean {
  return hasPermission(userSession, [ROLE_IDS.SUPERADMIN, ROLE_IDS.ADMIN, ROLE_IDS.MANAGER_1, ROLE_IDS.MANAGER_2])
}

export function canEditLeads(userSession: UserSession | null): boolean {
  return hasPermission(userSession, [ROLE_IDS.SUPERADMIN, ROLE_IDS.ADMIN, ROLE_IDS.MANAGER_1, ROLE_IDS.MANAGER_2])
}

// Your existing auth functions (keeping them for compatibility)
export const signInWithOTP = async (email: string) => {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
    },
  })
  return { data, error }
}

export const verifyOTP = async ({
  email,
  token,
  type,
}: {
  email: string
  token: string
  type: "email"
}) => {
  // 1. Verify the OTP
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type,
  })

  if (error) {
    return { data, error }
  }

  // 2. Get the enhanced user session with RBAC
  const userSession = await getCurrentUserSession()

  if (userSession) {
    // 3. Store the enhanced session in localStorage
    localStorage.setItem("userSession", JSON.stringify(userSession))
  }

  return { data, error }
}

export const signOut = async () => {
  // Clear localStorage
  localStorage.removeItem("userSession")
  localStorage.removeItem("userProfile")

  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  return { user, error }
}

export const getCurrentSession = async () => {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()
  return { session, error }
}

export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  return supabase.auth.onAuthStateChange(callback)
}

export const refreshSession = async () => {
  const { data, error } = await supabase.auth.refreshSession()
  return { data, error }
}
