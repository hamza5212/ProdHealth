"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { getSupabaseBrowser } from "@/lib/supabase/client"

export function TopNav() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = getSupabaseBrowser()
  const [signedIn, setSignedIn] = useState<boolean>(false)

  useEffect(() => {
    let mounted = true
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return
      setSignedIn(!!data.user)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(!!session?.user)
    })
    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [supabase])

  const items = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/scan", label: "Scan" },
    { href: "/products", label: "Search" },
    { href: "/history", label: "History" },
    { href: "/analytics", label: "Analytics" },
  ]
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-primary" aria-hidden />
          <div className="text-pretty">
            <p className="font-semibold tracking-tight">ProdHealth</p>
            <p className="text-xs text-muted-foreground">Smart Food Scanner</p>
          </div>
        </Link>
        <nav className="hidden gap-4 md:flex">
          {items.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm transition-colors",
                pathname === it.href ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {it.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {signedIn ? (
            <Button
              variant="secondary"
              onClick={async () => {
                await supabase.auth.signOut()
                router.refresh()
                router.push("/login")
              }}
            >
              Sign out
            </Button>
          ) : (
            <Link href="/login">
              <Button variant="secondary">Sign in</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
