'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import { createBrowserClient, Session } from '@supabase/ssr'

type SupabaseContextType = {
  supabase: ReturnType<typeof createBrowserClient>
  session: Session | null
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined)

export default function SupabaseProvider({
  children,
  session,
}: {
  children: React.ReactNode
  session: Session | null
}) {
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  )

  const [currentSession, setCurrentSession] = useState<Session | null>(session)

  // 🔁 Always recheck session on mount
  useEffect(() => {
    async function recoverSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session) {
        setCurrentSession(session)
      }
    }

    recoverSession()

    // ✅ Listen to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentSession(session)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  return (
    <SupabaseContext.Provider value={{ supabase, session: currentSession }}>
      {children}
    </SupabaseContext.Provider>
  )
}

export function useSupabase() {
  const context = useContext(SupabaseContext)
  if (!context) {
    throw new Error('useSupabase must be used inside SupabaseProvider')
  }
  return context
}

