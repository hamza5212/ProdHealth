"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  const supabase = getSupabaseBrowser()
  const router = useRouter()
  const sp = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function signIn(role: "user" | "admin", email: string, password: string) {
    try {
      setLoading(true)
      setError(null)
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
        return
      }
      const redirect = sp.get("redirect") || (role === "admin" ? "/admin" : "/dashboard")
      router.refresh() // ensure session-aware UI updates
      router.push(redirect)
    } catch (e: any) {
      setError(e?.message || "Unable to sign in")
    } finally {
      setLoading(false)
    }
  }

  async function signUp(role: "user" | "admin", email: string, password: string, adminCode?: string) {
    try {
      setLoading(true)
      setError(null)
      if (role === "admin" && adminCode !== "30330034") {
        setError("Invalid admin access code")
        return
      }
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { role },
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
        },
      })
      if (error) {
        setError(error.message)
        return
      }
      router.refresh()
      router.push("/dashboard")
    } catch (e: any) {
      setError(e?.message || "Unable to sign up")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-balance">Sign in to ProdHealth</h1>
        <p className="text-muted-foreground">User login or Admin login with access code.</p>
      </div>
      <Tabs defaultValue="user" className="max-w-xl">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="user">User</TabsTrigger>
          <TabsTrigger value="admin">Admin</TabsTrigger>
        </TabsList>

        <TabsContent value="user" className="mt-6">
          <AuthForm label="User" onSignIn={(e, p) => signIn("user", e, p)} onSignUp={(e, p) => signUp("user", e, p)} />
        </TabsContent>

        <TabsContent value="admin" className="mt-6">
          <AuthForm
            label="Admin"
            requireAdminCode
            onSignIn={(e, p) => signIn("admin", e, p)}
            onSignUp={(e, p, code) => signUp("admin", e, p, code)}
          />
        </TabsContent>
      </Tabs>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </main>
  )
}

function AuthForm({
  label,
  requireAdminCode,
  onSignIn,
  onSignUp,
}: {
  label: string
  requireAdminCode?: boolean
  onSignIn: (email: string, password: string) => void
  onSignUp: (email: string, password: string, adminCode?: string) => void
}) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [adminCode, setAdminCode] = useState("")
  const [loading, setLoading] = useState(false) // Declare loading variable here

  return (
    <div className="rounded-xl border p-6">
      <p className="mb-4 text-lg font-medium">{label} Login</p>
      <div className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        {requireAdminCode && (
          <div className="space-y-1">
            <Label htmlFor="code">Admin Access Code</Label>
            <Input
              id="code"
              value={adminCode}
              onChange={(e) => setAdminCode(e.target.value)}
              placeholder="Enter access code"
            />
          </div>
        )}
        <div className="flex items-center gap-2 pt-2">
          <Button
            className="bg-primary text-primary-foreground hover:bg-accent"
            onClick={() => onSignIn(email, password)}
            disabled={!email || !password || loading}
            aria-busy={loading}
          >
            Sign In
          </Button>
          <Button
            variant="secondary"
            onClick={() => onSignUp(email, password, adminCode)}
            disabled={!email || !password || (requireAdminCode && !adminCode) || loading}
            aria-busy={loading}
          >
            Sign Up
          </Button>
        </div>
      </div>
    </div>
  )
}
