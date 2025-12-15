import { createClient, type SupabaseClient } from "@supabase/supabase-js"

type Database = any

let supabaseServerSingleton: SupabaseClient<Database> | null = null

export function getSupabaseServerClient() {
  // Pull and sanitize envs
  const rawUrl = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim()
  const rawServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim()

  if (!rawUrl) {
    throw new Error("[supabase] Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)")
  }
  if (!rawServiceKey) {
    throw new Error("[supabase] Missing SUPABASE_SERVICE_ROLE_KEY")
  }
  // Basic guard to catch inadvertently truncated placeholder values
  if (rawUrl.includes("...")) {
    throw new Error("[supabase] SUPABASE_URL appears truncated. Please paste the full URL.")
  }
  if (rawServiceKey.includes("...")) {
    throw new Error("[supabase] SUPABASE_SERVICE_ROLE_KEY appears truncated. Please paste the full key.")
  }
  // Additional URL validation to prevent subtle misconfig leading to 500s
  try {
    const u = new URL(rawUrl)
    if (!/^https:$/.test(u.protocol)) {
      throw new Error("URL must start with https://")
    }
    if (!u.hostname.endsWith(".supabase.co")) {
      throw new Error("URL host must end with .supabase.co")
    }
  } catch (e: any) {
    throw new Error(`[supabase] Invalid SUPABASE_URL: ${e?.message || "invalid URL"}`)
  }

  if (supabaseServerSingleton) return supabaseServerSingleton

  supabaseServerSingleton = createClient<Database>(rawUrl, rawServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: { fetch },
  })

  return supabaseServerSingleton
}
