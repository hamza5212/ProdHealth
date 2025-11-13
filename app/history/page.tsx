import { getSupabaseServer } from "@/lib/supabase/server"
import { TopNav } from "@/components/top-nav"
import Link from "next/link"
import { BackButton } from "@/components/back-button"
import { Package } from "lucide-react"

export default async function HistoryPage() {
  const supabase = getSupabaseServer()
  const { data: auth } = await supabase.auth.getUser()
  let scans: any[] = []
  if (auth.user) {
    try {
      const { data, error } = await supabase
        .from("scans")
        .select("*")
        .eq("user_id", auth.user.id)
        .order("created_at", { ascending: false })
        .limit(25)
      if (error) throw error
      scans = data || []
    } catch (err: any) {
      if (err?.code !== "PGRST205") {
        console.log("[v0] HistoryPage scans fetch error:", err?.message || err)
      }
      // if table is missing, fall back to empty list without crashing
      scans = []
    }
  }

  return (
    <div>
      <TopNav />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-2">
          <BackButton />
        </div>
        <h1 className="text-2xl font-semibold">Scan History</h1>
        {scans.length === 0 ? (
          <div className="mt-6 rounded-xl border p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
              <Package className="h-7 w-7" />
            </div>
            <p className="text-lg font-medium">No scans yet</p>
            <p className="text-muted-foreground">Start scanning products to see your history here</p>
            <Link href="/scan" className="mt-4 inline-flex rounded-md bg-primary px-4 py-2 text-primary-foreground">
              Scan Your First Product
            </Link>
          </div>
        ) : (
          <ul className="mt-6 divide-y rounded-xl border">
            {scans.map((s) => (
              <li key={s.id} className="flex items-center gap-3 p-4">
                {s.image_url && (
                  <img src={s.image_url || "/placeholder.svg"} alt="" className="h-12 w-12 rounded-md object-cover" />
                )}
                <div className="flex-1">
                  <p className="font-medium">{s.product_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.brand} • {s.barcode}
                  </p>
                </div>
                <div className="text-sm font-semibold">{s.score}/100</div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
