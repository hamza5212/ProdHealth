import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Initialize Supabase server client using cookies
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

  // Fetch the current user session securely
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const pathname = req.nextUrl.pathname

  // ✅ Protect routes that require authentication
  const protectedRoutes = ["/dashboard", "/analytics"]

  if (protectedRoutes.some((path) => pathname.startsWith(path)) && !session) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ✅ Prevent logged-in users from seeing login or home page
  if ((pathname === "/" || pathname === "/login") && session) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return res
}

export const config = {
  matcher: ["/dashboard/:path*", "/analytics/:path*", "/", "/login"],
}
