import type React from "react"
import Link from "next/link"
import { TopNav } from "@/components/top-nav"
import { getSupabaseServer } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { BackButton } from "@/components/back-button"
import { QrCode, Search, History, Activity, SlidersHorizontal, Sparkles } from "lucide-react"

export default async function DashboardPage() {
  const supabase = getSupabaseServer()
  const { data } = await supabase.auth.getUser()
  const isAuthed = !!data.user

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
      <TopNav />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <BackButton />
        </div>

        <div className="mb-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent mb-2">
            Your Health, Simplified
          </h2>
          <p className="text-muted-foreground text-lg">
            Make smarter choices with every scan
          </p>
        </div>

        <section className="group relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-primary/5 via-background to-secondary/10 p-8 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:border-primary/30">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="relative flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  Complete Your Profile
                </h1>
              </div>
              <p className="text-muted-foreground text-lg">
                Add health info to personalize recommendations
              </p>
            </div>
            <Link href="/preferences">
              <Button 
                size="lg"
                className="gap-2 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Set up now
              </Button>
            </Link>
          </div>
        </section>

        <section className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <CardLink
            href="/scan"
            title="Scan Product"
            desc="Scan barcode for instant analysis"
            icon={<QrCode className="h-6 w-6" />}
            gradient="from-emerald-500/10 to-teal-500/10"
            hoverGradient="from-emerald-500/20 to-teal-500/20"
          />
          <CardLink
            href="/products"
            title="Search Products"
            desc="Browse our product database"
            icon={<Search className="h-6 w-6" />}
            gradient="from-blue-500/10 to-cyan-500/10"
            hoverGradient="from-blue-500/20 to-cyan-500/20"
          />
          <CardLink
            href="/history"
            title="Scan History"
            desc="View your previous scans"
            icon={<History className="h-6 w-6" />}
            gradient="from-violet-500/10 to-purple-500/10"
            hoverGradient="from-violet-500/20 to-purple-500/20"
          />
          <CardLink
            href="/analytics"
            title="Health Analytics"
            desc="Track your nutrition trends"
            icon={<Activity className="h-6 w-6" />}
            gradient="from-orange-500/10 to-rose-500/10"
            hoverGradient="from-orange-500/20 to-rose-500/20"
          />
        </section>

        {!isAuthed && (
          <div className="mt-8 rounded-xl border border-border/50 bg-muted/30 p-4 backdrop-blur-sm">
            <p className="text-sm text-muted-foreground text-center">
              You are not signed in.{" "}
              <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline transition-colors">
                Sign in
              </Link>{" "}
              to save your scans.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

function CardLink({
  href,
  title,
  desc,
  icon,
  gradient,
  hoverGradient,
}: {
  href: string
  title: string
  desc: string
  icon: React.ReactNode
  gradient: string
  hoverGradient: string
}) {
  return (
    <Link 
      href={href} 
      className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-primary/30"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} transition-opacity duration-300`} />
      <div className={`absolute inset-0 bg-gradient-to-br ${hoverGradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
      
      <div className="relative">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-md group-hover:bg-primary/20">
          {icon}
        </div>
        <p className="text-xl font-semibold mb-1 transition-colors duration-300 group-hover:text-primary">
          {title}
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {desc}
        </p>
      </div>
    </Link>
  )
}