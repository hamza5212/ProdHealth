import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export async function GET() {
  const supabase = getSupabaseServer()

  // Total scans
  const { data: totalRow } = await supabase
    .from("scans")
    .select("id", { count: "exact", head: true })

  // Recent scans (last 7 days)
  const { data: recent } = await supabase
    .from("scans")
    .select("score, nutrition_grade, nova_group, category, created_at")
    .gte("created_at", new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString())

  // Average score
  const avg =
    recent && recent.length
      ? recent.reduce((a, b) => a + (b.score ?? 0), 0) / recent.length
      : 0

  // ---- Last 7 days data ----
  const dayKey = (d: Date) => d.toISOString().slice(5, 10) // MM-DD
  const map = new Map<string, { day: string; count: number }>()
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const k = dayKey(d)
    map.set(k, { day: k, count: 0 })
  }
  recent?.forEach((r) => {
    const k = dayKey(new Date(r.created_at))
    if (map.has(k)) map.get(k)!.count++
  })
  const last7 = Array.from(map.values())

  // ---- Nutrition grade distribution ----
  const gradesMap: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0, "N/A": 0 }
  recent?.forEach((r) => {
    const g = ((r.nutrition_grade as string) || "").toUpperCase()
    if (gradesMap[g] !== undefined) gradesMap[g]++
    else gradesMap["N/A"]++
  })
  const grades = Object.entries(gradesMap).map(([name, value]) => ({ name, value }))

  // ---- Nova group distribution ----
  const novaMap: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "N/A": 0 }
  recent?.forEach((r) => {
    const k = r.nova_group ? String(r.nova_group) : "N/A"
    novaMap[k] = (novaMap[k] ?? 0) + 1
  })
  const nova = Object.entries(novaMap).map(([name, value]) => ({ name, value }))

  // ---- Category-wise distribution (new) ----
  const categoryMap: Record<string, number> = {}
  recent?.forEach((r) => {
    const cat = (r.category as string) || "Unknown"
    categoryMap[cat] = (categoryMap[cat] ?? 0) + 1
  })
  const categories = Object.entries(categoryMap).map(([name, value]) => ({ name, value }))

  // ---- Weekly progress ----
  const weeklyPct = Math.min(100, Math.round(((recent?.length || 0) / 25) * 100))

  // ---- Return response ----
  return NextResponse.json({
    total: totalRow?.length ?? 0,
    avg_score: avg,
    weekly: weeklyPct,
    last7,
    grades,
    nova,
    categories, // 👈 added new field
  })
}

