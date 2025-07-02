import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "your-anon-key"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Auth helper functions
export const signInWithOTP = async (email: string) => {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // Remove emailRedirectTo since we're doing OTP verification in the same session
      shouldCreateUser: true, // Allow new user creation if they don't exist
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
  type: 'email'
}) => {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type,
  })
  return { data, error }
}

export const signOut = async () => {
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

// Optional: Get the current session
export const getCurrentSession = async () => {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()
  return { session, error }
}

// Optional: Listen to auth state changes
export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  return supabase.auth.onAuthStateChange(callback)
}

// Optional: Refresh the session
export const refreshSession = async () => {
  const { data, error } = await supabase.auth.refreshSession()
  return { data, error }
}