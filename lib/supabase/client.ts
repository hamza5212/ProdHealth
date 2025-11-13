import { createBrowserClient } from "@supabase/ssr"

let supabaseBrowser: ReturnType<typeof createBrowserClient> | undefined

export function getSupabaseBrowser() {
  if (!supabaseBrowser) {
    supabaseBrowser = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
  }
  return supabaseBrowser
}
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('Supabase ANON KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
