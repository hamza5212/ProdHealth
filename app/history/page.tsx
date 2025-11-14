import { getSupabaseServer } from "@/lib/supabase/server"
import { TopNav } from "@/components/top-nav"
import Link from "next/link"
import { BackButton } from "@/components/back-button"
import { Package, TrendingUp, Calendar } from "lucide-react"

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
      scans = []
    }
  }

  // Helper to get score color
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600 bg-green-100'
    if (score >= 50) return 'text-amber-600 bg-amber-100'
    return 'text-red-600 bg-red-100'
  }

  // Calculate stats
  const avgScore = scans.length > 0 
    ? Math.round(scans.reduce((sum, s) => sum + (s.score || 0), 0) / scans.length)
    : 0

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl" />
      </div>

      <TopNav />
      
      <main className="relative mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <BackButton />
        </div>

        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Scan History</h1>
          <p className="text-gray-600">Track your product scanning journey</p>
        </div>

        {scans.length === 0 ? (
          /* Empty State */
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl border border-white/20 shadow-xl p-12 text-center">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
              <Package className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">No scans yet</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Start scanning products to see your history here and track your health journey
            </p>
            <Link 
              href="/scan" 
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-3.5 text-white font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
            >
              <Package className="h-5 w-5" />
              Scan Your First Product
            </Link>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-5 shadow-lg border border-white/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 w-10 h-10 rounded-xl flex items-center justify-center">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-800">{scans.length}</p>
                    <p className="text-sm text-gray-600">Total Scans</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-5 shadow-lg border border-white/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-10 h-10 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-800">{avgScore}</p>
                    <p className="text-sm text-gray-600">Average Score</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Scans List */}
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-lg border border-white/20 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-lg font-semibold text-gray-800">Recent Activity</h2>
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {scans.map((s) => (
                  <div 
                    key={s.id} 
                    className="flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors"
                  >
                    {s.image_url ? (
                      <img 
                        src={s.image_url} 
                        alt={s.product_name || "Product"} 
                        className="h-16 w-16 rounded-xl object-cover shadow-md flex-shrink-0" 
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center flex-shrink-0">
                        <Package className="h-8 w-8 text-gray-500" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 mb-1 truncate">
                        {s.product_name || "Unknown Product"}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        {s.brand && <span>{s.brand}</span>}
                        {s.brand && s.barcode && <span>•</span>}
                        {s.barcode && <span className="font-mono text-xs">{s.barcode}</span>}
                      </div>
                      {s.created_at && (
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(s.created_at)}
                        </p>
                      )}
                    </div>
                    
                    <div className={`${getScoreColor(s.score || 0)} px-4 py-2 rounded-xl text-base font-bold flex-shrink-0`}>
                      {s.score || 0}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {scans.length >= 25 && (
              <p className="text-center text-sm text-gray-500 mt-6">
                Showing your 25 most recent scans
              </p>
            )}
          </>
        )}
      </main>
    </div>
  )
}