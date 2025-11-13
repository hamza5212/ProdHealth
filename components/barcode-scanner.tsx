"use client"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Camera, Square } from "lucide-react"

export function BarcodeScanner({ onDetected }: { onDetected: (code: string) => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [reader, setReader] = useState<any>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    return () => {
      stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function start() {
    try {
      const { BrowserMultiFormatReader } = await import("@zxing/browser")
      const media = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
      setStream(media)
      if (videoRef.current) {
        videoRef.current.srcObject = media
        await videoRef.current.play()
      }
      const r = new BrowserMultiFormatReader()
      setReader(r)
      setActive(true)
      r.decodeFromVideoDevice(undefined, videoRef.current!, (result: any, err: any) => {
        if (result?.getText) {
          const code = result.getText()
          onDetected(code)
          stop()
        }
      })
    } catch (e) {
      console.error("[v0] Scanner error:", e)
    }
  }

  function stop() {
    setActive(false)
    try {
      reader?.reset?.()
    } catch {}
    if (stream) {
      stream.getTracks().forEach((t) => t.stop())
    }
    setStream(null)
  }

  return (
    <div className="rounded-xl border p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium">Camera Scanner</p>
        {!active ? (
          <Button size="sm" variant="secondary" className="gap-2" onClick={start}>
            <Camera className="h-4 w-4" /> Start Camera
          </Button>
        ) : (
          <Button size="sm" variant="destructive" className="gap-2" onClick={stop}>
            <Square className="h-4 w-4" /> Stop
          </Button>
        )}
      </div>
      <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted">
        <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
      </div>
    </div>
  )
}
