//lib/supabase.ts
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "your-anon-key"

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // makes sure your access + refresh tokens get persisted to localStorage
    persistSession: true,
    // prevents Supabase from automatically reading tokens out of `window.location.hash`
    detectSessionInUrl: false,
  }
})
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
  // 1. Verify the OTP
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type,
  })

  if (error) {
    return { data, error }
  }

  // 2. Get the authenticated user from the session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('Error fetching authenticated user:', userError)
    return { data, error }
  }

  // 3. Load the full user profile from your 'users' table
  const { data: userProfile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error('Error fetching user profile:', profileError)
  } else if (userProfile) {
    // 4. Persist it in localStorage
    localStorage.setItem('userProfile', JSON.stringify(userProfile))
  }

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