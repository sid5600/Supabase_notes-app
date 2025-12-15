import { type NextRequest, NextResponse } from "next/server"
import { verifyFirebaseIdToken } from "../../../lib/firebase-admin"
import { getSupabaseServerClient } from "../../../lib/supabase-server"

function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 })
}

async function getUserFromAuthHeader(req: NextRequest) {
  const auth = req.headers.get("authorization") || req.headers.get("Authorization") || ""
  const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : auth.split(" ")[1]
  if (!token) return null
  try {
    const decoded = await verifyFirebaseIdToken(token)
    return { uid: decoded.uid, name: decoded.name || null, email: decoded.email || null }
  } catch (e: any) {
    console.log("[v0] verifyFirebaseIdToken error:", e?.message || e)
    return null
  }
}

export async function GET(req: NextRequest) {
  const user = await getUserFromAuthHeader(req)
  if (!user) return unauthorized()
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log("[v0] Missing SUPABASE_SERVICE_ROLE_KEY")
      return NextResponse.json({ error: "Missing SUPABASE_SERVICE_ROLE_KEY" }, { status: 500 })
    }
    const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim()
    if (!url) {
      console.log("[v0] Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL")
      return NextResponse.json({ error: "Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL" }, { status: 500 })
    }
    if (url.includes("...")) {
      console.log("[v0] Truncated SUPABASE_URL detected")
      return NextResponse.json({ error: "SUPABASE_URL appears truncated" }, { status: 500 })
    }

    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
      .from("notes")
      .select("id, content, created_at")
      .eq("user_id", user.uid)
      .order("created_at", { ascending: false })

    if (error) {
      console.log("[v0] Supabase GET error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (e: any) {
    console.log("[v0] GET /api/notes unexpected error:", e?.message || e, e?.stack || "")
    return NextResponse.json({ error: e?.message || "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const user = await getUserFromAuthHeader(req)
  if (!user) return unauthorized()
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log("[v0] Missing SUPABASE_SERVICE_ROLE_KEY")
      return NextResponse.json({ error: "Missing SUPABASE_SERVICE_ROLE_KEY" }, { status: 500 })
    }
    const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim()
    if (!url) {
      console.log("[v0] Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL")
      return NextResponse.json({ error: "Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL" }, { status: 500 })
    }
    if (url.includes("...")) {
      console.log("[v0] Truncated SUPABASE_URL detected")
      return NextResponse.json({ error: "SUPABASE_URL appears truncated" }, { status: 500 })
    }

    const body = (await req.json().catch(() => null)) as { content?: string } | null
    const content = (body?.content || "").trim()
    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }
    if (content.length > 5000) {
      return NextResponse.json({ error: "Content too long" }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
      .from("notes")
      .insert({ user_id: user.uid, content })
      .select("id, content, created_at")
      .single()

    if (error) {
      console.log("[v0] Supabase POST error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data, { status: 201 })
  } catch (e: any) {
    console.log("[v0] POST /api/notes unexpected error:", e?.message || e, e?.stack || "")
    return NextResponse.json({ error: e?.message || "Internal server error" }, { status: 500 })
  }
}
