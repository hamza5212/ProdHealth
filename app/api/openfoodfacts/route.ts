import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const barcode = searchParams.get("barcode")
  const q = searchParams.get("q")
  try {
    const UA = "ProdHealth/1.0 (health scanner replica)"
    if (barcode) {
      const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`
      const res = await fetch(url, { headers: { "User-Agent": UA } })
      const data = await res.json()
      return NextResponse.json(data)
    }
    if (q) {
      const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&countries_tags_en=india&page_size=20`
      const res = await fetch(url, { headers: { "User-Agent": UA } })
      const data = await res.json()
      return NextResponse.json(data)
    }
    return NextResponse.json({ error: "Provide ?barcode or ?q" }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Fetch error" }, { status: 500 })
  }
}
