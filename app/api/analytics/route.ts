import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

type DayCount = { day: string; count: number }

export async function GET() {
  const supabase = getSupabaseServer()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ ok: false, error: "Unauthenticated" }, { status: 401 })
  }

  const { data, error } = await supabase.from("scans").select("created_at").eq("user_id", user.id)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

  const map = new Map<string, number>()
  for (const row of data ?? []) {
    const d = new Date(row.created_at as any)
    const key = isNaN(d.getTime()) ? "unknown" : d.toISOString().slice(0, 10)
    map.set(key, (map.get(key) ?? 0) + 1)
  }
  const series: DayCount[] = Array.from(map.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([day, count]) => ({ day, count }))

  return NextResponse.json({ ok: true, series })
}
