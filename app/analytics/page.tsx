"use client"

import useSWR from "swr"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"

type ApiResp = { ok: true; series: { day: string; count: number }[] } | { ok: false; error: string }
const fetcher = (url: string) => fetch(url).then((r) => r.json() as Promise<ApiResp>)

export default function AnalyticsPage() {
  const { data, error, isLoading } = useSWR<ApiResp>("/api/analytics", fetcher, {
    revalidateOnFocus: false,
  })

  const ok = data && "ok" in data && data.ok
  const series = ok ? (data as any).series : []

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-balance">Analytics</h1>
        <p className="text-muted-foreground">Daily scan counts for your account.</p>
      </div>

      {isLoading && (
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {!isLoading && error && <p className="text-sm text-red-600">Failed to load analytics. Please try again.</p>}

      {!isLoading && !error && !ok && (
        <p className="text-sm text-muted-foreground">{data && "error" in data ? data.error : "No data available."}</p>
      )}

      {!isLoading && ok && (
        <Card>
          <CardHeader>
            <CardTitle>Daily Scans</CardTitle>
            <CardDescription>Total product scans per day</CardDescription>
          </CardHeader>
          <CardContent>
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
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="count" stroke="var(--color-count)" name="Scans" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </main>
  )
}
