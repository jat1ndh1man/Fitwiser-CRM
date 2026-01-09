"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Alert, AlertDescription } from "../ui/alert"
import { Loader2, Mail, Shield, CheckCircle, ArrowRight, KeyRound } from "lucide-react"
import { signInWithOTP, verifyOTP } from "../../lib/supabase"
import { supabase } from "../../lib/supabase"

// Updated allowed role IDs with all new roles
const ALLOWED_ROLES = [
  'b00060fe-175a-459b-8f72-957055ee8c55', // Superadmin
  '46e786df-0272-4f22-aec2-56d2a517fa9d', // Admin
  '11b93954-9a56-4ea5-a02c-15b731ee9dfb', // Sales Manager
  '5be42c54-a492-4604-90fa-57bced414143', // Wellness Manager
  'e032e8eb-f50b-41e1-8d16-52b17fd0903f', // Relationship Manager
  '7c9ade9a-31f8-4b7b-90a2-fb76362a5300', // Counselor
  '37388da6-80d6-4b55-8b74-dd291ba1daf1', // BDE
  '4bf4b01a-a6cb-4cb7-aaac-70de1e9b859e', // Customer Support
  '874c7518-4b6f-421e-90f6-c57236dcee62', // Coach
  '1fe1759c-dc14-4933-947a-c240c046bcde'  // Executive
]

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const router = useRouter()

  // Function to check if user exists and has valid role
  const checkUserAccess = async (email: string) => {
    try {
      console.log('🔍 Checking access for email:', email)
      
      // Use ilike for case-insensitive email matching
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, role_id, is_active')
        .ilike('email', email) // Changed from eq to ilike for case-insensitive
        .single()

      console.log('📊 User data response:', userData)
      console.log('❌ User error (if any):', userError)
      
      if (userError) {
        console.log('Error code:', userError.code)
        if (userError.code === 'PGRST116') {
          // No user found
          console.log('🚫 No user found with email:', email)
          return { 
            isValid: false, 
            error: "Access denied. You are not authorized to use this system." 
          }
        }
        throw userError
      }

      console.log('✅ User found:', userData.email)
      console.log('📝 User role_id:', userData.role_id)
      console.log('🔒 Is user active?:', userData.is_active)
      console.log('📋 Allowed roles:', ALLOWED_ROLES)
      console.log('🔍 Checking if role is in allowed list:', ALLOWED_ROLES.includes(userData.role_id))

      // Check if user is active
      if (!userData.is_active) {
        console.log('🚫 User account is inactive')
        return { 
          isValid: false, 
          error: "Your account has been deactivated. Please contact your administrator." 
        }
      }

      // Check if user has a valid role
      if (!userData.role_id) {
        console.log('🚫 User has no role assigned')
        return { 
          isValid: false, 
          error: "Access denied. No role assigned to your account. Please contact your administrator." 
        }
      }

      if (!ALLOWED_ROLES.includes(userData.role_id)) {
        console.log('🚫 User role not in allowed list')
        console.log('User role_id:', userData.role_id)
        console.log('Is UUID?', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userData.role_id))
        return { 
          isValid: false, 
          error: `Access denied. You don't have sufficient permissions to access this system. (Role ID: ${userData.role_id})` 
        }
      }

      console.log('🎉 User access granted!')
      return { 
        isValid: true, 
        userData 
      }
    } catch (error) {
      console.error('🔥 Error checking user access:', error)
      return { 
        isValid: false, 
        error: "An error occurred while verifying your access. Please try again." 
      }
    }
  }

  // Debug function to test database connection
  const debugDatabase = async () => {
    console.log('🔧 Running database debug...')
    
    // Test 1: Check if we can query users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('email, role_id, is_active')
      .limit(5)
    
    console.log('📋 First 5 users in database:', users)
    console.log('❌ Users query error:', usersError)
    
    // Test 2: Check roles table structure
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('id, name')
      .order('name')
    
    console.log('📋 Roles in database:', roles)
    console.log('❌ Roles query error:', rolesError)
    
    // Test 3: Check specific user
    const testEmail = 'test@example.com' // Replace with actual test email
    const { data: testUser } = await supabase
      .from('users')
      .select('*')
      .ilike('email', testEmail)
      .single()
    
    console.log('🔍 Test user data:', testUser)
  }

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setMessage("")

    try {
      // First check if user exists and has valid role
      console.log('📤 Starting OTP send process for:', email)
      const accessCheck = await checkUserAccess(email)
      
      console.log('📝 Access check result:', accessCheck)
      
      if (!accessCheck.isValid) {
        console.log('🚫 Access check failed:', accessCheck.error)
        setError(accessCheck.error!)
        setLoading(false)
        return
      }

      // If user is valid, send OTP
      console.log('✅ User has valid access, sending OTP...')
      const { error } = await signInWithOTP(email)

      if (error) {
        console.log('❌ OTP send error:', error)
        setError(error.message)
      } else {
        console.log('✅ OTP sent successfully')
        setOtpSent(true)
        setMessage("OTP sent to your email successfully!")
      }
    } catch (error) {
      console.error('🔥 Unexpected error in handleSendOTP:', error)
      setError("An unexpected error occurred while sending OTP")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setMessage("")

    try {
      // Verify OTP first
      console.log('🔐 Verifying OTP for:', email)
      const { data, error } = await verifyOTP({
        email,
        token: otp,
        type: "email",
      })

      console.log('📊 OTP verification response:', { data, error })

      if (error) {
        console.log('❌ OTP verification error:', error)
        setError(error.message)
      } else if (data?.user) {
        // Double-check user access after successful OTP verification
        console.log('✅ OTP verified, checking user access again...')
        const accessCheck = await checkUserAccess(email)
        
        console.log('📝 Post-OTP access check:', accessCheck)
        
        if (!accessCheck.isValid) {
          console.log('🚫 Post-OTP access check failed:', accessCheck.error)
          setError(accessCheck.error!)
          // Sign out the user since they shouldn't have access
          await supabase.auth.signOut()
          return
        }

        console.log('✅ All checks passed, redirecting to dashboard...')
        setMessage("Login successful! Redirecting...")
        router.push("/dashboard")
      }
    } catch (error) {
      console.error('🔥 Unexpected error in handleVerifyOTP:', error)
      setError("An unexpected error occurred during verification")
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setLoading(true)
    setError("")
    setMessage("")

    try {
      // Check user access again before resending
      console.log('🔄 Resending OTP for:', email)
      const accessCheck = await checkUserAccess(email)
      
      if (!accessCheck.isValid) {
        setError(accessCheck.error!)
        setLoading(false)
        return
      }

      const { error } = await signInWithOTP(email)

      if (error) {
        setError(error.message)
      } else {
        setMessage("New OTP sent to your email!")
      }
    } catch {
      setError("Failed to resend OTP")
    } finally {
      setLoading(false)
    }
  }

  const handleBackToEmail = () => {
    setOtpSent(false)
    setOtp("")
    setEmail("")
    setMessage("")
    setError("")
  }

  // Add debug button for testing (remove in production)
  const handleDebug = async () => {
    console.log('=== DEBUG MODE ===')
    await debugDatabase()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-emerald-50 p-4">
      <div className="w-full max-w-md">
        {/* Debug button (remove in production) */}
        <button 
          onClick={handleDebug}
          className="fixed top-4 right-4 bg-gray-800 text-white px-3 py-1 rounded text-xs opacity-50 hover:opacity-100"
          style={{ zIndex: 1000 }}
        >
          Debug DB
        </button>

        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center">
            <img
              src="FitwiserLogo.png"
              alt="FitWiser Logo"
              className="h-28 w-28 object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Fitwiser CMS Dashboard
          </h1>
          <p className="text-slate-600 mt-2">
            Secure access to your customer management system
          </p>
        </div>

        <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center text-slate-800">
              {otpSent ? "Enter Verification Code" : "Welcome Back"}
            </CardTitle>
            <CardDescription className="text-center text-slate-600">
              {otpSent
                ? `Enter the 6-digit code sent to ${email}`
                : "Enter your email to receive a verification code"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {otpSent ? (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
                    <KeyRound className="h-8 w-8 text-emerald-600" />
                  </div>
                  <p className="text-sm text-slate-600">
                    We've sent a 6-digit verification code to your email
                  </p>
                </div>

                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="otp"
                      className="text-sm font-medium text-slate-700"
                    >
                      Verification Code
                    </Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="otp"
                        type="text"
                        placeholder="Enter 6-digit code"
                        value={otp}
                        onChange={(e) =>
                          setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                        }
                        required
                        disabled={loading}
                        maxLength={6}
                        className="pl-10 border-emerald-200 focus:border-emerald-300 focus:ring-emerald-200 text-center text-lg tracking-widest"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Verify & Sign In
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>

                <div className="space-y-2">
                  <Button
                    variant="outline"
                    onClick={handleResendOTP}
                    disabled={loading}
                    className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Resending...
                      </>
                    ) : (
                      "Resend Code"
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={handleBackToEmail}
                    disabled={loading}
                    className="w-full text-slate-600 hover:text-slate-800"
                  >
                    ← Use Different Email
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-slate-700"
                  >
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="pl-10 border-emerald-200 focus:border-emerald-300 focus:ring-emerald-200"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending Code...
                    </>
                  ) : (
                    <>
                      Send Verification Code
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            )}

            {message && (
              <Alert className="border-emerald-200 bg-emerald-50">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <AlertDescription className="text-emerald-700">
                  {message}
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Security Features */}
            <div className="pt-4 border-t border-slate-200">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="space-y-2">
                  <div className="inline-flex items-center justify-center w-8 h-8 bg-emerald-100 rounded-full">
                    <Shield className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-slate-700">Secure</h4>
                    <p className="text-xs text-slate-500">OTP Authentication</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                    <KeyRound className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-slate-700">
                      Time-Limited
                    </h4>
                    <p className="text-xs text-slate-500">6-Digit Code</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-slate-500">
          <p>
            By signing in, you agree to our{" "}
            <a
              href="#"
              className="text-emerald-600 hover:text-emerald-700 underline"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="#"
              className="text-emerald-600 hover:text-emerald-700 underline"
            >
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}