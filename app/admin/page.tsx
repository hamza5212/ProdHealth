import { getSupabaseServer } from "@/lib/supabase/server"
import { TopNav } from "@/components/top-nav"
import { Button } from "@/components/ui/button"

export default async function AdminPage() {
  const supabase = getSupabaseServer()
  const { data: auth } = await supabase.auth.getUser()
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(50)

  return (
    <div>
      <TopNav />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-semibold">Admin Products</h1>
        <p className="text-muted-foreground">Add and modify products in the database.</p>

        <form action={addProduct} className="mt-6 grid gap-2 rounded-xl border p-4 md:grid-cols-5">
          <input type="text" name="barcode" placeholder="Barcode" className="col-span-1 rounded-md border p-2" />
          <input type="text" name="name" placeholder="Name" className="col-span-2 rounded-md border p-2" />
          <input type="text" name="brand" placeholder="Brand" className="col-span-1 rounded-md border p-2" />
          <Button type="submit" className="col-span-1 bg-primary text-primary-foreground hover:bg-accent">
            Add/Update
          </Button>
        </form>

        <ul className="mt-6 divide-y rounded-xl border">
          {(products || []).map((p: any) => (
            <li key={p.id} className="flex items-center gap-3 p-3">
              <div className="flex-1">
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">
                  {p.brand} • {p.barcode}
                </p>
              </div>
              <form action={deleteProduct}>
                <input type="hidden" name="id" value={p.id} />
                <Button variant="secondary">Delete</Button>
              </form>
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}

async function addProduct(formData: FormData) {
  "use server"
  const supabase = getSupabaseServer()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user || auth.user.user_metadata?.role !== "admin") return
  const barcode = (formData.get("barcode") as string) || ""
  const name = (formData.get("name") as string) || ""
  const brand = (formData.get("brand") as string) || ""
  await supabase.from("products").upsert({ barcode, name, brand, modified_by: auth.user.id })
}

async function deleteProduct(formData: FormData) {
  "use server"
  const supabase = getSupabaseServer()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user || auth.user.user_metadata?.role !== "admin") return
  const id = formData.get("id") as string
  await supabase.from("products").delete().eq("id", id)
}
