import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "your-anon-key"

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Updated Role IDs with all new roles
export const ROLE_IDS = {
  SUPERADMIN: "b00060fe-175a-459b-8f72-957055ee8c55",
  ADMIN: "46e786df-0272-4722-acc2-56d2a517fa9d",
  SALES_MANAGER: "11b93954-9a56-4ea5-a02c-15b731ee9dfb",
  WELLNESS_MANAGER: "5be42c54-a492-4604-90fa-57bced414143",
  RELATIONSHIP_MANAGER: "e032e8eb-f50b-41e1-8d16-52b17fd0903f",
  COUNSELOR: "7c9ade9a-31f8-4b7b-90a2-fb76362a5300",
  BDE: "37388da6-80d6-4b55-8b74-dd291ba1daf1",
  CUSTOMER_SUPPORT: "4bf4b01a-a6cb-4cb7-aaac-70de1e9b859e",
  COACH: "874c7518-4b6f-421e-90f6-c57236dcee62",
  EXECUTIVE: "1fe1759c-dc14-4933-947a-c240c046bcde",
  TRAINING_MANAGER: "affa537b-beba-4a7c-a4e8-4a75d61a6486",
  DIETITIAN: "e86ba6af-bbf5-4ce5-9ce3-eb41d4ce3b45"
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
  canManageTeam: boolean
  isManager: boolean
  assignedLeadIds?: string[]
  roleName: string
  roleKey: string
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
        user_roles!inner(name)
      `)
      .eq("id", user.id)
      .single()

    if (profileErr || !profile) {
      console.error("Error fetching user profile:", profileErr)
      return null
    }

    // Get role name and create role key
    const roleName = profile.user_roles?.name || "Unknown"
    const roleKey = roleName.toLowerCase().replace(/\s+/g, '_')

    // Define which roles can view all data (Superadmin, Admin, Managers)
    const canViewAllData = [
      ROLE_IDS.SUPERADMIN,
      ROLE_IDS.ADMIN,
      ROLE_IDS.SALES_MANAGER,
      ROLE_IDS.WELLNESS_MANAGER,
      ROLE_IDS.RELATIONSHIP_MANAGER,
      ROLE_IDS.TRAINING_MANAGER
    ].includes(profile.role_id)

    // Define which roles can manage teams (Managers only)
    const canManageTeam = [
      ROLE_IDS.SALES_MANAGER,
      ROLE_IDS.WELLNESS_MANAGER,
      ROLE_IDS.RELATIONSHIP_MANAGER,
      ROLE_IDS.TRAINING_MANAGER
    ].includes(profile.role_id)

    // Define manager roles
    const isManager = [
      ROLE_IDS.SALES_MANAGER,
      ROLE_IDS.WELLNESS_MANAGER,
      ROLE_IDS.RELATIONSHIP_MANAGER,
      ROLE_IDS.TRAINING_MANAGER
    ].includes(profile.role_id)

    let assignedLeadIds: string[] = []

    // If user is Executive, BDE, or Counselor, get their assigned lead IDs
    if ([ROLE_IDS.EXECUTIVE, ROLE_IDS.BDE, ROLE_IDS.COUNSELOR].includes(profile.role_id)) {
      const { data: assignments, error: assignmentErr } = await supabase
        .from("lead_assignments")
        .select("lead_id")
        .eq("assigned_to", profile.id)

      if (!assignmentErr && assignments) {
        assignedLeadIds = assignments.map((a: any) => a.lead_id)
      }
    }

    return {
      user: profile,
      canViewAllData,
      canManageTeam,
      isManager,
      assignedLeadIds: canViewAllData ? undefined : assignedLeadIds,
      roleName,
      roleKey
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
  // Allow Superadmin, Admin, and all Managers to view reports
  return hasPermission(userSession, [
    ROLE_IDS.SUPERADMIN,
    ROLE_IDS.ADMIN,
    ROLE_IDS.SALES_MANAGER,
    ROLE_IDS.WELLNESS_MANAGER,
    ROLE_IDS.RELATIONSHIP_MANAGER,
    ROLE_IDS.TRAINING_MANAGER
  ])
}

export function canEditLeads(userSession: UserSession | null): boolean {
  // Allow Superadmin, Admin, Managers, and Executive to edit leads
  return hasPermission(userSession, [
    ROLE_IDS.SUPERADMIN,
    ROLE_IDS.ADMIN,
    ROLE_IDS.SALES_MANAGER,
    ROLE_IDS.WELLNESS_MANAGER,
    ROLE_IDS.RELATIONSHIP_MANAGER,
    ROLE_IDS.TRAINING_MANAGER,
    ROLE_IDS.EXECUTIVE
  ])
}

export function canViewAnalytics(userSession: UserSession | null): boolean {
  // Allow Superadmin, Admin, and Managers to view analytics
  return hasPermission(userSession, [
    ROLE_IDS.SUPERADMIN,
    ROLE_IDS.ADMIN,
    ROLE_IDS.SALES_MANAGER,
    ROLE_IDS.WELLNESS_MANAGER,
    ROLE_IDS.RELATIONSHIP_MANAGER,
    ROLE_IDS.TRAINING_MANAGER
  ])
}

export function canAccessSettings(userSession: UserSession | null): boolean {
  // Allow only Superadmin and Admin to access settings
  return hasPermission(userSession, [ROLE_IDS.SUPERADMIN, ROLE_IDS.ADMIN])
}

export function canAccessUserManagement(userSession: UserSession | null): boolean {
  // Allow only Superadmin and Admin to access user management
  return hasPermission(userSession, [ROLE_IDS.SUPERADMIN, ROLE_IDS.ADMIN])
}

export function getRolePermissions(userSession: UserSession | null) {
  if (!userSession) return {}
  
  return {
    canManageUsers: canManageUsers(userSession),
    canViewReports: canViewReports(userSession),
    canEditLeads: canEditLeads(userSession),
    canViewAnalytics: canViewAnalytics(userSession),
    canAccessSettings: canAccessSettings(userSession),
    canAccessUserManagement: canAccessUserManagement(userSession),
    canViewAllData: userSession.canViewAllData,
    canManageTeam: userSession.canManageTeam,
    isManager: userSession.isManager
  }
}

// Your existing auth functions (keeping them for compatibility)
export const signInWithOTP = async (email: string) => {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
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
    localStorage.setItem("userProfile", JSON.stringify(userSession.user))
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