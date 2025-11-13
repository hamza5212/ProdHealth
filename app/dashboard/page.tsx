import type React from "react"
import Link from "next/link"
import { TopNav } from "@/components/top-nav"
import { getSupabaseServer } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { BackButton } from "@/components/back-button"
import { QrCode, Search, History, Activity, SlidersHorizontal } from "lucide-react"

export default async function DashboardPage() {
  const supabase = getSupabaseServer()
  const { data } = await supabase.auth.getUser()
  const isAuthed = !!data.user

  return (
    <div>
      <TopNav />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-2">
          <BackButton />
        </div>
        <section className="rounded-xl border p-6 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-balance">Complete Your Profile</h1>
              <p className="text-muted-foreground">Add health info to personalize recommendations</p>
            </div>
            <Link href="/preferences">
              <Button variant="secondary" className="gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Set up now
              </Button>
            </Link>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <CardLink
            href="/scan"
            title="Scan Product"
            desc="Scan barcode for instant analysis"
            icon={<QrCode className="h-5 w-5" />}
          />
          <CardLink
            href="/products"
            title="Search Products"
            desc="Browse our product database"
            icon={<Search className="h-5 w-5" />}
          />
          <CardLink
            href="/history"
            title="Scan History"
            desc="View your previous scans"
            icon={<History className="h-5 w-5" />}
          />
          <CardLink
            href="/analytics"
            title="Health Analytics"
            desc="Track your nutrition trends"
            icon={<Activity className="h-5 w-5" />}
          />
        </section>

        {!isAuthed && (
          <p className="mt-6 text-sm text-muted-foreground">
            You are not signed in.{" "}
            <Link href="/login" className="underline">
              Sign in
            </Link>{" "}
            to save your scans.
          </p>
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
}: {
  href: string
  title: string
  desc: string
  icon: React.ReactNode
}) {
  return (
    <Link href={href} className="rounded-2xl border p-6 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-foreground">
        {icon}
      </div>
      <p className="text-lg font-semibold">{title}</p>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </Link>
  )
}
