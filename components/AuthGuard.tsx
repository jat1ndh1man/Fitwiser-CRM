// components/AuthGuard.tsx
'use client'

import { ReactNode, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter()
  const path = usePathname()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Skip guarding the public auth routes:
    if (path.startsWith('/(auth)')) {
      setLoading(false)
      return
    }

    // Try to restore session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/login')
      } else {
        setLoading(false)
      }
    })

    // Listen for sign‑out
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.replace('/(auth)/login')
      }
    })
    return () => {
      sub.subscription.unsubscribe()
    }
  }, [path, router])

  if (loading) return  
  
  <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
  </div>
  return <>{children}</>
}
