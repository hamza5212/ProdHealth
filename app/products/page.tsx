"use client"
import useSWR from "swr"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import Link from "next/link"
import { BackButton } from "@/components/back-button"
import { Search, Package } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function ProductsPage() {
  const [q, setQ] = useState("")
  const { data, isLoading, mutate } = useSWR(q ? `/api/openfoodfacts?q=${encodeURIComponent(q)}` : null, fetcher)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <BackButton href="/" label="Go home" />
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
              <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              Search Products
            </h1>
          </div>
          <p className="text-muted-foreground ml-13">
            Discover detailed nutrition information for thousands of products
          </p>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-8 shadow-lg">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium">Search for products</label>
              <Input 
                value={q} 
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && mutate()}
                placeholder="e.g., Parle G, Maggi, Coca Cola"
                className="h-12 text-base"
              />
            </div>
            <Button 
              size="lg"
              className="h-12 gap-2 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105" 
              onClick={() => mutate()}
            >
              <Search className="h-4 w-4" /> Search
            </Button>
          </div>

          {!data && !isLoading && (
            <div className="mt-12 text-center py-12">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <p className="text-muted-foreground">Start typing to search for products</p>
            </div>
          )}

          {isLoading && (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="rounded-xl border border-border/50 p-4 animate-pulse">
                  <div className="h-32 w-full rounded-lg bg-muted mb-3" />
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          )}

          {data?.products && data.products.length > 0 && (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 md:grid-cols-3">
              {data.products.map((p: any) => (
                <Link
                  href={`/products/${p.id || p.code}`}
                  key={p.id || p.code}
                  className="group relative overflow-hidden rounded-xl border border-border/50 bg-card p-4 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-primary/30"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  
                  <div className="relative">
                    <div className="mb-3 overflow-hidden rounded-lg bg-muted">
                      <img
                        src={p.image_small_url || "/placeholder.svg?height=120&width=120&query=product"}
                        alt=""
                        className="h-32 w-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    </div>
                    <p className="line-clamp-2 text-base font-semibold mb-1 transition-colors group-hover:text-primary">
                      {p.product_name || p.generic_name || "Unknown Product"}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {p.brands || "No brand"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {data?.products && data.products.length === 0 && (
            <div className="mt-12 text-center py-12">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No products found. Try a different search term.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}