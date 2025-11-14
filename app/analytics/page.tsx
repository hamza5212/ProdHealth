"use client"
import useSWR from "swr"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  Tooltip,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { BackButton } from "@/components/back-button"
import { Activity, TrendingUp, BarChart3, AlertCircle } from "lucide-react"

// Fetcher function
type ApiResp =
  | { ok: true; series: { day: string; count: number }[]; categories?: { name: string; count: number }[] }
  | { ok: false; error: string }

const fetcher = (url: string) => fetch(url).then((r) => r.json() as Promise<ApiResp>)

export default function AnalyticsPage() {
  const { data, error, isLoading } = useSWR<ApiResp>("/api/analytics", fetcher, {
    revalidateOnFocus: false,
  })

  const ok = data && "ok" in data && data.ok
  const series = ok ? (data as any).series : []
  const categories = ok ? (data as any).categories || [] : []
  
  const totalScans = series.reduce((sum: number, item: any) => sum + item.count, 0)
  const avgScans = series.length > 0 ? Math.round(totalScans / series.length) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <BackButton />
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-rose-500/20 flex items-center justify-center">
              <Activity className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              Health Analytics
            </h1>
          </div>
          <p className="text-muted-foreground ml-13">
            Track your scanning habits and discover insights about your food choices
          </p>
        </div>

        {/* Loading skeletons */}
        {isLoading && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-32 w-full rounded-2xl" />
            </div>
            <Skeleton className="h-96 w-full rounded-2xl" />
            <Skeleton className="h-96 w-full rounded-2xl" />
          </div>
        )}

        {/* Error message */}
        {!isLoading && error && (
          <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-12 text-center shadow-lg">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 mb-4">
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-red-600 dark:text-red-400 font-medium">Failed to load analytics</p>
            <p className="text-sm text-muted-foreground mt-2">Please try again later</p>
          </div>
        )}

        {/* No data */}
        {!isLoading && !error && !ok && (
          <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-12 text-center shadow-lg">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-medium mb-2">No data available yet</p>
            <p className="text-sm text-muted-foreground">
              {data && "error" in data ? data.error : "Start scanning products to see your analytics"}
            </p>
          </div>
        )}

        {/* Stats Cards */}
        {!isLoading && ok && (
          <div className="grid gap-4 sm:grid-cols-3 mb-6">
            <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-emerald-500/30">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="relative">
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Scans</p>
                <p className="text-3xl font-bold">{totalScans}</p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-blue-500/30">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="relative">
                <p className="text-sm font-medium text-muted-foreground mb-1">Daily Average</p>
                <p className="text-3xl font-bold">{avgScans}</p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-violet-500/10 to-purple-500/10 p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-violet-500/30">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="relative">
                <p className="text-sm font-medium text-muted-foreground mb-1">Categories</p>
                <p className="text-3xl font-bold">{categories.length}</p>
              </div>
            </div>
          </div>
        )}

        {/* ✅ Daily Scans Chart */}
        {!isLoading && ok && (
          <Card className="mb-6 overflow-hidden rounded-2xl border-border/50 bg-card/50 backdrop-blur-sm shadow-lg">
            <CardHeader className="border-b border-border/50 bg-gradient-to-r from-card to-card/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-rose-500/20 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <CardTitle className="text-xl">Daily Scans</CardTitle>
                  <CardDescription>Track your scanning activity over time</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <ChartContainer
                config={{
                  count: {
                    label: "Scans",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-[360px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={series} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="day" />
                    <YAxis allowDecimals={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="var(--color-count)" 
                      name="Scans" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* ✅ Category-wise Scans (Bar Chart) */}
        {!isLoading && ok && categories.length > 0 && (
          <Card className="overflow-hidden rounded-2xl border-border/50 bg-card/50 backdrop-blur-sm shadow-lg">
            <CardHeader className="border-b border-border/50 bg-gradient-to-r from-card to-card/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-xl">Category Distribution</CardTitle>
                  <CardDescription>Your most scanned product categories</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={360}>
                <BarChart data={categories} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}