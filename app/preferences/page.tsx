"use client"
import { useEffect, useState } from "react"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { BackButton } from "@/components/back-button"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"

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

  // Add local inputs for custom items
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        setStatus({ ok: true, msg: "Preferences saved." })
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
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-2">
        <BackButton />
      </div>
      <h1 className="text-2xl font-semibold">Preferences</h1>
      <p className="text-muted-foreground">Tell us your dietary preferences, health goals, and allergens.</p>

      <section className="mt-6 rounded-xl border p-6">
        <h2 className="mb-4 text-lg font-semibold">Health Goals</h2>
        <p className="mb-2 text-sm text-muted-foreground">Popular options below. Add your own goals if not listed.</p>
        <div className="grid gap-3 md:grid-cols-2">
          {HEALTH_GOALS.map((g) => (
            <label key={g} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-secondary">
              <Checkbox checked={prefs.goals.includes(g)} onCheckedChange={() => toggle("goals", g)} />
              <span>{g}</span>
            </label>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2">
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
          />
          <Button
            variant="secondary"
            onClick={() => {
              addCustom("goals", goalInput)
              setGoalInput("")
            }}
          >
            Add
          </Button>
        </div>
        {prefs.goals.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {prefs.goals.map((g) => (
              <span key={g} className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm">
                {g}
                <button
                  aria-label={`Remove ${g}`}
                  onClick={() => removeItem("goals", g)}
                  className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full hover:bg-secondary"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="mt-6 rounded-xl border p-6">
        <h2 className="mb-4 text-lg font-semibold">Dietary Preferences</h2>
        <p className="mb-2 text-sm text-muted-foreground">Choose from popular preferences or add your own.</p>
        <div className="grid gap-3 md:grid-cols-2">
          {DIETARY.map((d) => (
            <label key={d} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-secondary">
              <Checkbox checked={prefs.dietary.includes(d)} onCheckedChange={() => toggle("dietary", d)} />
              <span>{d}</span>
            </label>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2">
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
          />
          <Button
            variant="secondary"
            onClick={() => {
              addCustom("dietary", dietaryInput)
              setDietaryInput("")
            }}
          >
            Add
          </Button>
        </div>
        {prefs.dietary.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {prefs.dietary.map((d) => (
              <span key={d} className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm">
                {d}
                <button
                  aria-label={`Remove ${d}`}
                  onClick={() => removeItem("dietary", d)}
                  className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full hover:bg-secondary"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="mt-6 rounded-xl border p-6">
        <h2 className="mb-4 text-lg font-semibold">Allergens</h2>
        <p className="mb-2 text-sm text-muted-foreground">Common allergens below. Add any others you have.</p>
        <div className="grid gap-3 md:grid-cols-2">
          {ALLERGENS.map((a) => (
            <label key={a} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-secondary">
              <Checkbox checked={prefs.allergens.includes(a)} onCheckedChange={() => toggle("allergens", a)} />
              <span>{a}</span>
            </label>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2">
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
          />
          <Button
            variant="secondary"
            onClick={() => {
              addCustom("allergens", allergenInput)
              setAllergenInput("")
            }}
          >
            Add
          </Button>
        </div>
        {prefs.allergens.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {prefs.allergens.map((a) => (
              <span key={a} className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm">
                {a}
                <button
                  aria-label={`Remove ${a}`}
                  onClick={() => removeItem("allergens", a)}
                  className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full hover:bg-secondary"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </section>

      <div className="mt-6 flex items-center gap-3">
        <Button onClick={save} disabled={loading} className="bg-primary text-primary-foreground hover:bg-accent">
          {loading ? "Saving..." : "Save Preferences"}
        </Button>
        {status.msg && <span className={`text-sm ${status.ok ? "text-green-600" : "text-red-600"}`}>{status.msg}</span>}
      </div>
    </main>
  )
}
