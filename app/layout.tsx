import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"

import SupabaseProvider from "@/components/SupabaseProvider"
import { getSupabaseServer } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "ProdHealth – Smart Food Scanner",
  description: "Scan Indian packaged foods, see ingredients & nutrition, and get a health score out of 100.",
  generator: "v0.app",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const supabase = getSupabaseServer()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <SupabaseProvider session={session}>
          <Suspense fallback={null}>{children}</Suspense>
        </SupabaseProvider>
        <Analytics />
      </body>
    </html>
  )
}
