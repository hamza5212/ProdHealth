export type NutritionData = {
  nutrition_grade?: string | null
  nutriments?: {
    energy_kcal_100g?: number
    sugars_100g?: number
    saturated_fat_100g?: number
    salt_100g?: number
    fiber_100g?: number
    proteins_100g?: number
  }
  nova_group?: number | null
  additives_n?: number | null
  ingredients_text?: string
  ingredients_text_en?: string
}

export type Preferences = {
  goals?: string[]
  dietary?: string[]
  allergens?: string[]
}

export type Warning = {
  type: "allergen" | "dietary" | "sugar" | "salt" | "saturatedFat"
  severity: "info" | "warn" | "danger"
  message: string
}

export function computeHealthScore(p: NutritionData): number {
  let score = 100

  // Penalize by NOVA (ultra-processing)
  const nova = p.nova_group ?? 0
  if (nova >= 4) score -= 25
  else if (nova === 3) score -= 12

  // Nutrition grade (A-E) → adjust
  const grade = (p.nutrition_grade || "").toUpperCase()
  if (grade === "E") score -= 25
  else if (grade === "D") score -= 15
  else if (grade === "C") score -= 7
  else if (grade === "B") score -= 2

  // Nutrients (per 100g) – thresholds loosely aligned with FSSAI advisories
  const n = p.nutriments || {}
  const sugars = n.sugars_100g ?? 0
  const sat = n.saturated_fat_100g ?? 0
  const salt = n.salt_100g ?? 0
  const fiber = n.fiber_100g ?? 0
  const protein = n.proteins_100g ?? 0

  score -= Math.min(30, Math.max(0, sugars - 5) * 1.2) // >5g/100g sugar
  score -= Math.min(20, Math.max(0, sat - 2) * 1.5) // >2g/100g sat fat
  score -= Math.min(15, Math.max(0, salt - 0.3) * 25) // >0.3g/100g salt (0.3*1000 = 300mg)
  score += Math.min(10, fiber * 1.2)
  score += Math.min(8, protein * 0.4)

  // Additives count
  const additives = p.additives_n ?? 0
  score -= Math.min(15, additives * 3)

  return Math.max(0, Math.min(100, Math.round(score)))
}

export function computePersonalizedScore(base: number, product: any, prefs?: Preferences | null): number {
  if (!prefs) return base
  let score = base

  const ingredientsText: string = (product?.ingredients_text || product?.ingredients_text_en || "").toLowerCase()

  // Allergens penalty
  const allergenList = (prefs.allergens || []).map((a) => a.toLowerCase())
  const allergensHit = allergenList.filter((a) => ingredientsText.includes(a))
  if (allergensHit.length > 0) score -= Math.min(40, 20 + allergensHit.length * 5)

  // Dietary preferences simple checks
  const isVegetarian = !/chicken|meat|pork|fish|beef|gelatin/.test(ingredientsText)
  if ((prefs.dietary || []).includes("Vegetarian") && !isVegetarian) score -= 15
  if ((prefs.dietary || []).includes("Vegan") && /milk|egg|honey|butter|ghee|cheese|curd/.test(ingredientsText))
    score -= 20

  // Goals-based nudges: penalize sugar for Weight Loss/Diabetes; salt for Heart Health; sat fat for Lower Cholesterol
  const n = product?.nutriments || {}
  const sugar = n.sugars_100g ?? 0
  const salt = n.salt_100g ?? 0
  const sat = n.saturated_fat_100g ?? 0

  const goals = prefs.goals || []
  if (goals.includes("Weight Loss") || goals.includes("Diabetes Management"))
    score -= Math.min(15, Math.max(0, sugar - 5) * 1.5)
  if (goals.includes("Heart Health")) score -= Math.min(15, Math.max(0, salt - 0.3) * 30)
  if (goals.includes("Lower Cholesterol")) score -= Math.min(15, Math.max(0, sat - 2) * 1.8)

  return Math.max(0, Math.min(100, Math.round(score)))
}

export function computeWarnings(product: any, prefs?: Preferences | null): Warning[] {
  if (!prefs) return []

  const warnings: Warning[] = []
  const ingredientsText: string = (product?.ingredients_text || product?.ingredients_text_en || "").toLowerCase()
  const n = product?.nutriments || {}
  const sugar = n.sugars_100g ?? 0
  const salt = n.salt_100g ?? 0
  const sat = n.saturated_fat_100g ?? 0

  // Allergens
  const allergenList = (prefs.allergens || []).map((a) => a.toLowerCase())
  const allergensHit = allergenList.filter((a) => ingredientsText.includes(a))
  if (allergensHit.length > 0) {
    warnings.push({
      type: "allergen",
      severity: "danger",
      message: `Contains your allergen${allergensHit.length > 1 ? "s" : ""}: ${allergensHit.join(", ")}`,
    })
  }

  // Dietary preferences
  const containsMeat = /chicken|meat|pork|fish|beef|gelatin/.test(ingredientsText)
  const containsAnimalProducts = /milk|egg|honey|butter|ghee|cheese|curd/.test(ingredientsText)
  if ((prefs.dietary || []).includes("Vegetarian") && containsMeat) {
    warnings.push({
      type: "dietary",
      severity: "warn",
      message: "Not vegetarian based on ingredients listed.",
    })
  }
  if ((prefs.dietary || []).includes("Vegan") && (containsAnimalProducts || containsMeat)) {
    warnings.push({
      type: "dietary",
      severity: "warn",
      message: "Not vegan based on ingredients listed.",
    })
  }

  // Goals-based nutrient warnings (same thresholds used in scoring)
  const goals = prefs.goals || []
  if ((goals.includes("Weight Loss") || goals.includes("Diabetes Management")) && sugar > 5) {
    warnings.push({
      type: "sugar",
      severity: "warn",
      message: `High sugar for your goals (${sugar}g/100g). Consider lower-sugar options.`,
    })
  }
  if (goals.includes("Heart Health") && salt > 0.3) {
    warnings.push({
      type: "salt",
      severity: "warn",
      message: `High salt for heart health (${Math.round(salt * 1000)}mg/100g).`,
    })
  }
  if (goals.includes("Lower Cholesterol") && sat > 2) {
    warnings.push({
      type: "saturatedFat",
      severity: "warn",
      message: `High saturated fat (${sat}g/100g). Consider lower saturated fat choices.`,
    })
  }

  return warnings
}
