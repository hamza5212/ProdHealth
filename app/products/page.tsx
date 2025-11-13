"use client"

import useSWR from "swr"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import Link from "next/link"
import { BackButton } from "@/components/back-button"
import { Search } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function ProductsPage() {
  const [q, setQ] = useState("")
  const { data, isLoading, mutate } = useSWR(q ? `/api/openfoodfacts?q=${encodeURIComponent(q)}` : null, fetcher)

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-2">
        <BackButton href="/" label="Go home" />
      </div>
      <h1 className="mb-4 text-2xl font-semibold">Search Products</h1>
      <div className="rounded-xl border p-6 shadow-sm">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="mb-2 block text-sm font-medium">Search</label>
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g., Parle G" />
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-accent gap-2" onClick={() => mutate()}>
            <Search className="h-4 w-4" /> Search
          </Button>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {isLoading && <p>Loading…</p>}
          {data?.products?.map((p: any) => (
            <Link
              href={`/products/${p.id || p.code}`}
              key={p.id || p.code}
              className="rounded-lg border p-3 transition hover:shadow-md"
            >
              <img
                src={p.image_small_url || "/placeholder.svg?height=120&width=120&query=product"}
                alt=""
                className="h-24 w-full rounded-md object-cover"
              />
              <p className="mt-2 line-clamp-2 text-sm font-medium">{p.product_name || p.generic_name}</p>
              <p className="text-xs text-muted-foreground">{p.brands}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
