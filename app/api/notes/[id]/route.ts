import { type NextRequest, NextResponse } from "next/server"
import { verifyFirebaseIdToken } from "../../../../lib/firebase-admin"
import { getSupabaseServerClient } from "../../../../lib/supabase-server"

function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 })
}

async function getUserFromAuthHeader(req: NextRequest) {
  const auth = req.headers.get("authorization") || req.headers.get("Authorization") || ""
  const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : auth.split(" ")[1]
  if (!token) return null
  try {
    const decoded = await verifyFirebaseIdToken(token)
    return { uid: decoded.uid }
  } catch (e: any) {
    console.log("[v0] [id] verifyFirebaseIdToken error:", e?.message || e)
    return null
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUserFromAuthHeader(req)
  if (!user) return unauthorized()
  const id = params.id
  if (!id) return NextResponse.json({ error: "Missing note id" }, { status: 400 })

  try {
    const body = (await req.json().catch(() => null)) as { content?: string } | null
    const content = (body?.content || "").trim()
    if (!content) return NextResponse.json({ error: "Content is required" }, { status: 400 })
    if (content.length > 5000) return NextResponse.json({ error: "Content too long" }, { status: 400 })

    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
      .from("notes")
      .update({ content })
      .eq("id", id)
      .eq("user_id", user.uid)
      .select("id, content, created_at")
      .single()

    if (error) {
      console.log("[v0] Supabase PATCH error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(data)
  } catch (e: any) {
    console.log("[v0] PATCH /api/notes/[id] unexpected error:", e?.message || e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUserFromAuthHeader(req)
  if (!user) return unauthorized()
  const id = params.id
  if (!id) return NextResponse.json({ error: "Missing note id" }, { status: 400 })

  try {
    const supabase = getSupabaseServerClient()
    const { error } = await supabase.from("notes").delete().eq("id", id).eq("user_id", user.uid)
    if (error) {
      console.log("[v0] Supabase DELETE error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.log("[v0] DELETE /api/notes/[id] unexpected error:", e?.message || e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
