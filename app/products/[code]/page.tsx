import { computeHealthScore, computePersonalizedScore, type Preferences, computeWarnings } from "@/lib/health"
import { getSupabaseServer } from "@/lib/supabase/server"

async function getProduct(code: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/openfoodfacts?barcode=${encodeURIComponent(code)}`,
    {
      cache: "no-store",
    },
  )
  return res.json()
}

function gradeBadge(grade?: string) {
  const g = (grade || "").toUpperCase()
  const txt = g || "N/A"
  const color =
    g === "A"
      ? "bg-emerald-100 text-emerald-700"
      : g === "B"
        ? "bg-lime-100 text-lime-700"
        : g === "C"
          ? "bg-yellow-100 text-yellow-700"
          : g === "D"
            ? "bg-orange-100 text-orange-700"
            : g === "E"
              ? "bg-red-100 text-red-700"
              : "bg-muted text-foreground"
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${color}`}>Nutri-Score {txt}</span>
}

export default async function ProductPage({ params }: { params: { code: string } }) {
  const { code } = params
  const data = await getProduct(code)
  const product = data?.product
  const supabase = getSupabaseServer()
  const { data: auth } = await supabase.auth.getUser()
  const prefsRow = auth.user
    ? await supabase.from("profiles").select("preferences").eq("id", auth.user.id).maybeSingle()
    : { data: null }

  const baseScore = computeHealthScore({
    nutrition_grade: product?.nutrition_grade_fr || product?.nutriscore_grade,
    nutriments: product?.nutriments
      ? {
          energy_kcal_100g: product.nutriments["energy-kcal_100g"] ?? product.nutriments.energy_kcal_100g,
          sugars_100g: product.nutriments.sugars_100g,
          saturated_fat_100g: product.nutriments.saturated_fat_100g,
          salt_100g: product.nutriments.salt_100g,
          fiber_100g: product.nutriments.fiber_100g,
          proteins_100g: product.nutriments.proteins_100g,
        }
      : undefined,
    nova_group: product?.nova_group,
    additives_n: product?.additives_n,
  })
  const prefs = (prefsRow as any)?.data?.preferences as Preferences | null
  const score = computePersonalizedScore(baseScore, product, prefs)
  const warnings = computeWarnings(product, prefs)

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <a href="/products" className="mb-2 inline-block text-sm underline">
        Back
      </a>
      <h1 className="text-2xl font-semibold">{product?.product_name || "Product"}</h1>
      <p className="text-muted-foreground">{product?.brands}</p>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <img
          src={product?.image_url || "/placeholder.svg?height=220&width=220&query=product"}
          alt=""
          className="h-52 w-52 rounded-lg object-cover"
        />
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            {gradeBadge(product?.nutriscore_grade || product?.nutrition_grade_fr)}
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium">Health Score</p>
            <div className="mt-1 h-2 w-full rounded-full bg-muted">
              <div className="h-2 rounded-full bg-primary" style={{ width: `${score}%` }} />
            </div>
            <p className="mt-2 text-3xl font-semibold">{score}/100</p>
            <p className="text-xs text-muted-foreground">Calculated from nutrition, processing, and additives</p>
          </div>
        </div>
      </div>

      <section className="mt-8 rounded-xl border p-6">
        <h2 className="mb-4 text-lg font-semibold">Personalized Recommendations</h2>
        {prefs ? (
          <ul className="space-y-2 text-sm">
            {warnings.length === 0 ? (
              <li className="rounded-md border-l-4 border-emerald-400 bg-emerald-50 p-3">
                No concerns found based on your preferences.
              </li>
            ) : (
              warnings.map((w, i) => {
                const styles =
                  w.severity === "danger"
                    ? "border-red-400 bg-red-50"
                    : w.severity === "warn"
                      ? "border-yellow-400 bg-yellow-50"
                      : "border-blue-400 bg-blue-50"
                return (
                  <li key={i} className={`rounded-md border-l-4 p-3 ${styles}`}>
                    {w.message}
                  </li>
                )
              })
            )}
          </ul>
        ) : (
          <ul className="space-y-2 text-sm">
            <li className="rounded-md border-l-4 border-yellow-400 bg-yellow-50 p-3">
              Consider alternatives if you prefer lower sugar.
            </li>
            <li className="rounded-md border-l-4 border-orange-400 bg-orange-50 p-3">
              Ultra-processed? Limit frequency for better health.
            </li>
            <li className="rounded-md border-l-4 border-blue-400 bg-blue-50 p-3">
              Check allergens in ingredients if you have sensitivities.
            </li>
          </ul>
        )}
      </section>

      <section className="mt-8 rounded-xl border p-6">
        <h3 className="mb-4 text-base font-semibold">Detailed Nutrition Facts (per 100g)</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm">
              Energy:{" "}
              <strong>
                {product?.nutriments?.["energy-kcal_100g"] ?? product?.nutriments?.energy_kcal_100g ?? "—"}
              </strong>{" "}
              kcal
            </p>
            <p className="text-sm">
              Total Fat: <strong>{product?.nutriments?.fat_100g ?? "—"}</strong> g
            </p>
            <p className="text-sm">
              Saturated Fat: <strong>{product?.nutriments?.saturated_fat_100g ?? "—"}</strong> g
            </p>
            <p className="text-sm">
              Carbohydrates: <strong>{product?.nutriments?.carbohydrates_100g ?? "—"}</strong> g
            </p>
            <p className="text-sm">
              Sugars: <strong>{product?.nutriments?.sugars_100g ?? "—"}</strong> g
            </p>
          </div>
          <div>
            <p className="text-sm">
              Fiber: <strong>{product?.nutriments?.fiber_100g ?? "—"}</strong> g
            </p>
            <p className="text-sm">
              Proteins: <strong>{product?.nutriments?.proteins_100g ?? "—"}</strong> g
            </p>
            <p className="text-sm">
              Salt: <strong>{product?.nutriments?.salt_100g ?? "—"}</strong> g
            </p>
            <p className="text-sm">
              Sodium: <strong>{product?.nutriments?.sodium_100g ?? "—"}</strong> g
            </p>
            <p className="text-sm">
              Additives: <strong>{product?.additives_n ?? 0}</strong>
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
