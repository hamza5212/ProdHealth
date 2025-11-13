"use client"

import { useState } from "react"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { computeHealthScore, computePersonalizedScore } from "@/lib/health"
import { BackButton } from "@/components/back-button"
import { BarcodeScanner } from "@/components/barcode-scanner"
import Link from "next/link"
import { QrCode, Info } from "lucide-react"

export default function ScanPage() {
  const [barcode, setBarcode] = useState("")
  const [result, setResult] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = getSupabaseBrowser()

  async function analyze(bc: string) {
    if (!bc) return
    setLoading(true)
    try {
      const res = await fetch("/api/openfoodfacts?barcode=" + encodeURIComponent(bc), { cache: "no-store" })
      const json = await res.json()
      const product = json?.product
      if (!product) {
        setResult({ error: "Not found" })
        setLoading(false)
        return
      }

      const baseScore = computeHealthScore({
        nutrition_grade: product.nutrition_grade_fr || product.nutriscore_grade,
        nutriments: {
          energy_kcal_100g: product.nutriments?.["energy-kcal_100g"] ?? product.nutriments?.energy_kcal_100g,
          sugars_100g: product.nutriments?.sugars_100g,
          saturated_fat_100g: product.nutriments?.saturated_fat_100g,
          salt_100g: product.nutriments?.salt_100g,
          fiber_100g: product.nutriments?.fiber_100g,
          proteins_100g: product.nutriments?.proteins_100g,
        },
        nova_group: product.nova_group,
        additives_n: product.additives_n,
      })

      const { data: auth } = await supabase.auth.getUser()
      let finalScore = baseScore
      if (auth.user) {
        const prefsRow = await supabase.from("profiles").select("preferences").eq("id", auth.user.id).maybeSingle()
        const prefs = (prefsRow as any)?.data?.preferences ?? null
        finalScore = computePersonalizedScore(baseScore, product, prefs)
      }

      setResult({ product, score: finalScore })

      if (auth.user) {
        await supabase.from("scans").insert({
          user_id: auth.user.id,
          barcode: bc,
          product_name: product.product_name,
          brand: product.brands,
          image_url: product.image_url,
          nutrition_grade: product.nutriscore_grade || product.nutrition_grade_fr,
          nova_group: product.nova_group,
          score: finalScore,
        })
      }
    } catch (e: any) {
      setResult({ error: e?.message || "Error" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-2 flex items-center justify-between">
        <BackButton />
        <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
          <QrCode className="h-3 w-3" /> Scan Product
        </div>
      </div>
      <h1 className="mb-4 text-2xl font-semibold">Scan Product</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <BarcodeScanner
          onDetected={(code) => {
            setBarcode(code)
            analyze(code)
          }}
        />
        <div className="rounded-xl border p-6">
          <label className="mb-2 block text-sm font-medium">Manual Entry</label>
          <div className="flex items-end gap-2">
            <Input
              placeholder="Enter barcode number (e.g., 890...)"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
            />
            <Button
              className="bg-primary text-primary-foreground hover:bg-accent"
              disabled={loading}
              onClick={() => analyze(barcode)}
            >
              {loading ? "Scanning…" : "Analyze"}
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Tip: use the camera scanner for quicker results.</p>
        </div>
      </div>

      {result && (
        <div className="mt-6 rounded-xl border p-6 shadow-sm">
          {"error" in result ? (
            <p className="text-red-600">{result.error}</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              <img
                src={result.product.image_url || "/placeholder.svg?height=200&width=200&query=product"}
                alt="product"
                className="h-44 w-44 rounded-md object-cover"
              />
              <div className="md:col-span-2">
                <p className="text-lg font-semibold">{result.product.product_name}</p>
                <p className="text-sm text-muted-foreground">{result.product.brands}</p>
                <div className="mt-3">
                  <p className="text-sm font-medium">Health Score</p>
                  <div className="flex items-baseline gap-3">
                    <p className="text-3xl font-semibold">{result.score}/100</p>
                    <span className="text-xs text-muted-foreground">Computed from nutrition + processing</span>
                  </div>
                </div>
                <Link
                  href={`/products/${result.product.code || barcode}`}
                  className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-primary-foreground"
                >
                  <Info className="h-4 w-4" />
                  View Full Analysis
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  )
}
