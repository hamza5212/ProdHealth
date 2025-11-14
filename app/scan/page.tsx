"use client"

import { useState } from "react"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { computeHealthScore, computePersonalizedScore } from "@/lib/health"
import { BackButton } from "@/components/back-button"
import { BarcodeScanner } from "@/components/barcode-scanner"
import Link from "next/link"
import { QrCode, Info, Camera, Keyboard, Sparkles } from "lucide-react"

export default function ScanPage() {
  const [barcode, setBarcode] = useState("")
  const [result, setResult] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = getSupabaseBrowser()

  async function analyze(bc: string) {
    if (!bc) return
    setLoading(true)

    try {
      console.log("📦 Barcode value before fetch:", bc)

      const res = await fetch("/api/openfoodfacts?barcode=" + encodeURIComponent(bc), { cache: "no-store" })
      const json = await res.json()
      const product = json?.product

      if (!product) {
        setResult({ error: "Not found" })
        setLoading(false)
        return
      }

      // ✅ Save scan in your API
      try {
        await fetch("/api/save-scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            barcode: bc,
            product_name: product.product_name,
            brand: product.brands,
            image_url: product.image_url,
          }),
        })
      } catch (e) {
        console.error("Error saving scan:", e)
      }

      // ✅ Compute base score
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

      // ✅ Apply personalization if user logged in
      const { data: auth } = await supabase.auth.getUser()
      let finalScore = baseScore

      if (auth?.user) {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("preferences")
          .eq("id", auth.user.id)
          .maybeSingle()

        if (error) console.error("Error fetching preferences:", error.message)
        const prefs = profile?.preferences ?? null

        if (prefs && Object.keys(prefs).length > 0) {
          console.log("✅ Personalized scoring applied")
          finalScore = computePersonalizedScore(baseScore, product, prefs)
        } else {
          console.log("⚠️ No preferences found, using base score.")
        }
      }

      setResult({ product, score: finalScore })

      // ✅ Save scan in Supabase (for logged-in users)
      if (auth?.user) {
        const { error } = await supabase.from("scans").insert({
          user_id: auth.user.id,
          barcode: bc,
          product_name: product.product_name,
          brand: product.brands,
          image_url: product.image_url,
          nutrition_grade: product.nutriscore_grade || product.nutrition_grade_fr,
          nova_group: product.nova_group,
          score: finalScore,
        })

        if (error) console.error("❌ Error inserting scan:", error.message)
        else console.log("✅ Scan inserted successfully!")
      }

    } catch (e: any) {
      console.error(e)
      setResult({ error: e?.message || "Error occurred" })
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "from-emerald-500 to-green-500"
    if (score >= 60) return "from-yellow-500 to-orange-500"
    return "from-orange-500 to-red-500"
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent"
    if (score >= 60) return "Good"
    if (score >= 40) return "Fair"
    return "Poor"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6">
          <BackButton />
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
              <QrCode className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              Scan Product
            </h1>
          </div>
          <p className="text-muted-foreground ml-13">
            Get instant health insights from any product barcode
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* 📷 Barcode Scanner */}
          <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-primary/30">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Camera className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <label className="text-sm font-medium">Camera Scanner</label>
              </div>
              <BarcodeScanner
                onDetected={(code) => {
                  setBarcode(code)
                  analyze(code)
                }}
              />
            </div>
          </div>

          {/* 🖊️ Manual Entry */}
          <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-primary/30">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Keyboard className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <label className="text-sm font-medium">Manual Entry</label>
              </div>
              <div className="flex items-end gap-2">
                <Input
                  placeholder="Enter barcode number (e.g., 890...)"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && analyze(barcode)}
                  className="h-11"
                />
                <Button
                  size="lg"
                  className="h-11 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                  disabled={loading}
                  onClick={() => analyze(barcode)}
                >
                  {loading ? "Scanning…" : "Analyze"}
                </Button>
              </div>
              <p className="mt-3 text-xs text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Tip: use the camera scanner for quicker results
              </p>
            </div>
          </div>
        </div>

        {/* 📊 Result Display */}
        {result && (
          <div className="mt-8 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-8 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
            {"error" in result ? (
              <div className="text-center py-8">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 mb-4">
                  <Info className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
                <p className="text-red-600 dark:text-red-400 font-medium">{result.error}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Please try scanning again or check the barcode number
                </p>
              </div>
            ) : (
              <div className="grid gap-8 md:grid-cols-3">
                <div className="flex justify-center md:justify-start">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <img
                      src={
                        result.product.image_url ||
                        "/placeholder.svg?height=200&width=200&query=product"
                      }
                      alt="product"
                      className="relative h-48 w-48 rounded-xl object-cover shadow-lg border border-border/50"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-6">
                  <div>
                    <p className="text-2xl font-bold mb-1">
                      {result.product.product_name}
                    </p>
                    <p className="text-muted-foreground">{result.product.brands}</p>
                  </div>

                  <div className="relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-6">
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${getScoreColor(
                        result.score
                      )} opacity-5`}
                    />
                    <div className="relative">
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        Health Score
                      </p>
                      <div className="flex items-baseline gap-4">
                        <p
                          className={`text-5xl font-bold bg-gradient-to-r ${getScoreColor(
                            result.score
                          )} bg-clip-text text-transparent`}
                        >
                          {result.score}
                        </p>
                        <div>
                          <p className="text-2xl font-semibold text-muted-foreground">
                            /100
                          </p>
                          <p
                            className={`text-sm font-medium bg-gradient-to-r ${getScoreColor(
                              result.score
                            )} bg-clip-text text-transparent`}
                          >
                            {getScoreLabel(result.score)}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        Computed from nutrition grade, processing level & additives
                      </p>
                    </div>
                  </div>

                  {/* ✅ Correct navigation */}
                  <Link
                    href={`/products/${result.product.code || barcode}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-primary-foreground font-medium shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
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
    </div>
  )
}
