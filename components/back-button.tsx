"use client"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export function BackButton({
  label = "Back",
  href,
}: {
  label?: string
  href?: string
}) {
  const router = useRouter()
  return (
    <Button
      variant="ghost"
      className="group -ml-2 inline-flex items-center gap-2"
      onClick={() => {
        if (href) router.push(href)
        else router.back()
      }}
      aria-label={label}
    >
      <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
      <span className="sr-only">{label}</span>
    </Button>
  )
}
