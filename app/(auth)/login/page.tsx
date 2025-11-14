"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Scan, Shield, User, Mail, Lock, Key, Leaf, Apple, Activity } from "lucide-react"

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
      router.refresh()
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-200/30 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding */}
        <div className="hidden md:block space-y-6 px-8">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-2xl shadow-lg">
              <Scan className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              ProdHealth
            </h1>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-3xl font-semibold text-gray-800 leading-tight">
              Smart Food Analysis at Your Fingertips
            </h2>
            <p className="text-gray-600 text-lg">
              Scan any food package and get instant nutritional insights to make healthier choices.
            </p>
          </div>

          <div className="space-y-4 pt-4">
            <FeatureItem 
              icon={<Scan className="w-5 h-5" />}
              text="Instant barcode & label scanning"
            />
            <FeatureItem 
              icon={<Apple className="w-5 h-5" />}
              text="Detailed nutritional breakdown"
            />
            <FeatureItem 
              icon={<Activity className="w-5 h-5" />}
              text="Health score & recommendations"
            />
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20">
          {/* Mobile logo */}
          <div className="md:hidden flex items-center justify-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2 rounded-xl">
              <Scan className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              ProdHealth
            </h1>
          </div>

          <div className="text-center mb-8">
            <h3 className="text-2xl font-semibold text-gray-800 mb-2">Welcome Back</h3>
            <p className="text-gray-600">Sign in to continue your health journey</p>
          </div>

          <Tabs defaultValue="user" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1.5 h-auto rounded-2xl">
              <TabsTrigger 
                value="user" 
                className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-md py-3 flex items-center justify-center gap-2"
              >
                <User className="w-4 h-4" />
                User
              </TabsTrigger>
              <TabsTrigger 
                value="admin"
                className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-md py-3 flex items-center justify-center gap-2"
              >
                <Shield className="w-4 h-4" />
                Admin
              </TabsTrigger>
            </TabsList>

            <TabsContent value="user" className="mt-6">
              <AuthForm 
                label="User" 
                onSignIn={(e, p) => signIn("user", e, p)} 
                onSignUp={(e, p) => signUp("user", e, p)}
                loading={loading}
              />
            </TabsContent>

            <TabsContent value="admin" className="mt-6">
              <AuthForm
                label="Admin"
                requireAdminCode
                onSignIn={(e, p) => signIn("admin", e, p)}
                onSignUp={(e, p, code) => signUp("admin", e, p, code)}
                loading={loading}
              />
            </TabsContent>
          </Tabs>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AuthForm({
  label,
  requireAdminCode,
  onSignIn,
  onSignUp,
  loading
}: {
  label: string
  requireAdminCode?: boolean
  onSignIn: (email: string, password: string) => void
  onSignUp: (email: string, password: string, adminCode?: string) => void
  loading: boolean
}) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [adminCode, setAdminCode] = useState("")

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Mail className="w-4 h-4 text-emerald-600" />
          Email
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="h-12 rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-200"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-600" />
          Password
        </Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="h-12 rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-200"
        />
      </div>

      {requireAdminCode && (
        <div className="space-y-2">
          <Label htmlFor="code" className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Key className="w-4 h-4 text-emerald-600" />
            Admin Access Code
          </Label>
          <Input
            id="code"
            value={adminCode}
            onChange={(e) => setAdminCode(e.target.value)}
            placeholder="Enter access code"
            className="h-12 rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-200"
          />
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button
          onClick={() => onSignIn(email, password)}
          disabled={!email || !password || loading}
          className="flex-1 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all"
        >
          {loading ? "Loading..." : "Sign In"}
        </Button>
        <Button
          variant="secondary"
          onClick={() => onSignUp(email, password, adminCode)}
          disabled={!email || !password || (requireAdminCode && !adminCode) || loading}
          className="flex-1 h-12 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all"
        >
          {loading ? "Loading..." : "Sign Up"}
        </Button>
      </div>

      <div className="text-center pt-4">
        <a href="#" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
          Forgot password?
        </a>
      </div>
    </div>
  )
}

function FeatureItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 text-gray-700">
      <div className="bg-emerald-100 text-emerald-600 p-2 rounded-lg">
        {icon}
      </div>
      <span className="text-base">{text}</span>
    </div>
  )
}