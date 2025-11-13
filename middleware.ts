import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => req.cookies.get(name)?.value,
        set: (name: string, value: string, options: any) => res.cookies.set({ name, value, ...options }),
        remove: (name: string, options: any) => res.cookies.set({ name, value: "", ...options }),
      },
    },
  )

  const { data } = await supabase.auth.getUser()
  const isAdminPath = req.nextUrl.pathname.startsWith("/admin")

  if (isAdminPath) {
    if (!data.user || data.user.user_metadata?.role !== "admin") {
      const url = new URL("/login", req.url)
      url.searchParams.set("redirect", req.nextUrl.pathname)
      return NextResponse.redirect(url)
    }
  }
  return res
}

export const config = {
  matcher: ["/admin/:path*"],
}
