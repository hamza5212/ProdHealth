"use client"
import { useEffect, useState } from "react"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { BackButton } from "@/components/back-button"
import { Input } from "@/components/ui/input"
import { X, Heart, Apple, AlertCircle, Target, Sparkles, CheckCircle2 } from "lucide-react"

const HEALTH_GOALS = [
  "Weight Loss",
  "Weight Gain",
  "Heart Health",
  "Diabetes Management",
  "Lower Cholesterol",
  "Energy Boost",
] as const
const DIETARY = ["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free", "Keto", "Paleo"] as const
const ALLERGENS = ["Peanuts", "Tree nuts", "Milk", "Eggs", "Wheat", "Soy", "Fish", "Sesame"] as const

type Prefs = {
  goals: string[]
  dietary: string[]
  allergens: string[]
}

export default function PreferencesPage() {
  const supabase = getSupabaseBrowser()
  const [prefs, setPrefs] = useState<Prefs>({ goals: [], dietary: [], allergens: [] })
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ ok?: boolean; msg?: string }>({})

  const [goalInput, setGoalInput] = useState("")
  const [dietaryInput, setDietaryInput] = useState("")
  const [allergenInput, setAllergenInput] = useState("")

  useEffect(() => {
    ;(async () => {
      try {
        const { data: auth } = await supabase.auth.getUser()
        if (!auth.user) return
        const { data, error } = await supabase
          .from("profiles")
          .select("preferences")
          .eq("id", auth.user.id)
          .maybeSingle()
        if (error) {
          if ((error as any)?.code === "PGRST205") {
            setStatus({
              ok: false,
              msg: "Database not initialized yet. Please run the migrations to enable Preferences.",
            })
            return
          }
          setStatus({ ok: false, msg: `Load error: ${error.message}` })
        }
        if (data?.preferences) setPrefs(data.preferences as Prefs)
      } catch (e: any) {
        setStatus({ ok: false, msg: `Load error: ${e.message}` })
      }
    })()
  }, [])

  async function save() {
    setLoading(true)
    setStatus({})
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) {
      setLoading(false)
      setStatus({ ok: false, msg: "You must be signed in to save preferences." })
      return
    }
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: auth.user.id, preferences: prefs }, { onConflict: "id" })
      if (error) {
        const code = (error as any)?.code
        if (code === "PGRST205") {
          setStatus({ ok: false, msg: "Database not initialized. Please run the DB migrations and try again." })
        } else {
          setStatus({ ok: false, msg: `Save error: ${error.message}` })
        }
      } else {
        setStatus({ ok: true, msg: "Preferences saved successfully!" })
      }
    } catch (e: any) {
      setStatus({ ok: false, msg: `Save error: ${e.message}` })
    } finally {
      setLoading(false)
    }
  }

  function toggle(list: keyof Prefs, value: string) {
    setPrefs((p) => {
      const has = p[list].includes(value)
      const next = has ? p[list].filter((x) => x !== value) : [...p[list], value]
      return { ...p, [list]: next }
    })
  }

  function addCustom(list: keyof Prefs, raw: string) {
    const value = raw.trim()
    if (!value) return
    setPrefs((p) => {
      if (p[list].includes(value)) return p
      return { ...p, [list]: [...p[list], value] }
    })
  }

  function removeItem(list: keyof Prefs, value: string) {
    setPrefs((p) => ({ ...p, [list]: p[list].filter((x) => x !== value) }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl" />
      </div>

      <main className="relative mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6">
          <BackButton />
        </div>

        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Your Preferences</h1>
          </div>
          <p className="text-gray-600">
            Customize your experience by telling us about your dietary needs, health goals, and allergens.
          </p>
        </div>

        {/* Health Goals Section */}
        <section className="mb-6 bg-white/80 backdrop-blur-lg rounded-3xl border border-white/20 shadow-lg p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-rose-500 to-pink-600 w-10 h-10 rounded-xl flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Health Goals</h2>
              <p className="text-sm text-gray-600">Select goals that matter to you</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {HEALTH_GOALS.map((g) => (
              <label
                key={g}
                className={`flex items-center gap-3 rounded-xl border-2 p-4 cursor-pointer transition-all ${
                  prefs.goals.includes(g)
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50"
                }`}
              >
                <Checkbox checked={prefs.goals.includes(g)} onCheckedChange={() => toggle("goals", g)} />
                <span className="font-medium text-gray-800">{g}</span>
              </label>
            ))}
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Add custom goal and press Enter"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  addCustom("goals", goalInput)
                  setGoalInput("")
                }
              }}
              className="flex-1 rounded-xl border-2"
            />
            <Button
              variant="secondary"
              onClick={() => {
                addCustom("goals", goalInput)
                setGoalInput("")
              }}
              className="rounded-xl bg-gray-100 hover:bg-gray-200"
            >
              Add
            </Button>
          </div>

          {prefs.goals.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {prefs.goals.map((g) => (
                <span
                  key={g}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-100 border border-emerald-300 px-4 py-2 text-sm font-medium text-emerald-800"
                >
                  {g}
                  <button
                    aria-label={`Remove ${g}`}
                    onClick={() => removeItem("goals", g)}
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full hover:bg-emerald-200 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </section>

        {/* Dietary Preferences Section */}
        <section className="mb-6 bg-white/80 backdrop-blur-lg rounded-3xl border border-white/20 shadow-lg p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 w-10 h-10 rounded-xl flex items-center justify-center">
              <Apple className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Dietary Preferences</h2>
              <p className="text-sm text-gray-600">Choose your dietary lifestyle</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {DIETARY.map((d) => (
              <label
                key={d}
                className={`flex items-center gap-3 rounded-xl border-2 p-4 cursor-pointer transition-all ${
                  prefs.dietary.includes(d)
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 bg-white hover:border-green-300 hover:bg-green-50/50"
                }`}
              >
                <Checkbox checked={prefs.dietary.includes(d)} onCheckedChange={() => toggle("dietary", d)} />
                <span className="font-medium text-gray-800">{d}</span>
              </label>
            ))}
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Add custom dietary preference and press Enter"
              value={dietaryInput}
              onChange={(e) => setDietaryInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  addCustom("dietary", dietaryInput)
                  setDietaryInput("")
                }
              }}
              className="flex-1 rounded-xl border-2"
            />
            <Button
              variant="secondary"
              onClick={() => {
                addCustom("dietary", dietaryInput)
                setDietaryInput("")
              }}
              className="rounded-xl bg-gray-100 hover:bg-gray-200"
            >
              Add
            </Button>
          </div>

          {prefs.dietary.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {prefs.dietary.map((d) => (
                <span
                  key={d}
                  className="inline-flex items-center gap-2 rounded-full bg-green-100 border border-green-300 px-4 py-2 text-sm font-medium text-green-800"
                >
                  {d}
                  <button
                    aria-label={`Remove ${d}`}
                    onClick={() => removeItem("dietary", d)}
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full hover:bg-green-200 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </section>

        {/* Allergens Section */}
        <section className="mb-6 bg-white/80 backdrop-blur-lg rounded-3xl border border-white/20 shadow-lg p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 w-10 h-10 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Allergens</h2>
              <p className="text-sm text-gray-600">Let us know what to avoid</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ALLERGENS.map((a) => (
              <label
                key={a}
                className={`flex items-center gap-3 rounded-xl border-2 p-4 cursor-pointer transition-all ${
                  prefs.allergens.includes(a)
                    ? "border-red-500 bg-red-50"
                    : "border-gray-200 bg-white hover:border-red-300 hover:bg-red-50/50"
                }`}
              >
                <Checkbox checked={prefs.allergens.includes(a)} onCheckedChange={() => toggle("allergens", a)} />
                <span className="font-medium text-gray-800">{a}</span>
              </label>
            ))}
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Add custom allergen and press Enter"
              value={allergenInput}
              onChange={(e) => setAllergenInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  addCustom("allergens", allergenInput)
                  setAllergenInput("")
                }
              }}
              className="flex-1 rounded-xl border-2"
            />
            <Button
              variant="secondary"
              onClick={() => {
                addCustom("allergens", allergenInput)
                setAllergenInput("")
              }}
              className="rounded-xl bg-gray-100 hover:bg-gray-200"
            >
              Add
            </Button>
          </div>

          {prefs.allergens.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {prefs.allergens.map((a) => (
                <span
                  key={a}
                  className="inline-flex items-center gap-2 rounded-full bg-red-100 border border-red-300 px-4 py-2 text-sm font-medium text-red-800"
                >
                  {a}
                  <button
                    aria-label={`Remove ${a}`}
                    onClick={() => removeItem("allergens", a)}
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full hover:bg-red-200 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </section>

        {/* Save Button & Status */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl border border-white/20 shadow-lg p-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <Button
              onClick={save}
              disabled={loading}
              className="flex-1 sm:flex-none bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl py-6 px-8 font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              {loading ? (
                "Saving..."
              ) : (
                <span className="flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  Save Preferences
                </span>
              )}
            </Button>
            {status.msg && (
              <div
                className={`flex items-center gap-2 px-4 py-3 rounded-xl ${
                  status.ok
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {status.ok ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                <span className="text-sm font-medium">{status.msg}</span>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}