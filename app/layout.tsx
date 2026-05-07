import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import Script from "next/script"
import "./globals.css"

import SupabaseProvider from "@/components/SupabaseProvider"
import { getSupabaseServer } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "ProdHealth – Smart Food Scanner",
  description:
    "Scan Indian packaged foods, see ingredients & nutrition, and get a health score out of 100.",
  generator: "v0.app",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = getSupabaseServer()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  return (
    <html lang="en">
      <body
        className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`}
      >
        <SupabaseProvider session={session}>
          <Suspense fallback={null}>{children}</Suspense>
        </SupabaseProvider>

        
{/* Plausible Analytics */}
<Script
  async
  src="https://plausible.io/js/pa-6D0wHujA4_luHO5SDkkHB.js"
/>

<Script id="plausible-init">
  {`
    window.plausible = window.plausible || function() {
      (plausible.q = plausible.q || []).push(arguments)
    };
    plausible.init = plausible.init || function(i) {
      plausible.o = i || {};
    };
    plausible.init();
  `}
</Script>
        {/* Vercel Analytics (optional, can keep both) */}
        <Analytics />
      </body>
    </html>
  )
}
