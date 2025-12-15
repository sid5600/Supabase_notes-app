"use client"

import type React from "react"

import useSWR from "swr"
import { getAuth, onIdTokenChanged } from "firebase/auth"
import { useEffect, useState } from "react"
import "../lib/firebase-client"

type Note = {
  id: string
  content: string
  created_at: string
}

async function fetchWithToken<T>(url: string, token: string) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const raw = await res.text().catch(() => "")
    let message = "Request failed"
    if (raw) {
      try {
        const data = JSON.parse(raw)
        message = data?.error || data?.message || raw || message
      } catch {
        message = raw || message
      }
    }
    throw new Error(message)
  }
  return res.json() as Promise<T>
}

export default function Notes() {
  const [token, setToken] = useState<string | null>(null)
  const [content, setContent] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [postError, setPostError] = useState<string | null>(null)

  useEffect(() => {
    const auth = getAuth()
    let active = true
    async function setFromUser(u: any) {
      if (!u) {
        if (active) setToken(null)
        return
      }
      // force refresh when token changes events fire
      const t = await u.getIdToken(/* forceRefresh */ false)
      if (active) setToken(t || null)
    }
    // initial snapshot
    setFromUser(auth.currentUser)

    // react to token refresh/sign-in/sign-out
    const unsub = onIdTokenChanged(auth, (u) => setFromUser(u))

    // optional periodic refresh safety-net
    const id = setInterval(
      async () => {
        const u = auth.currentUser
        if (u) {
          const t = await u.getIdToken(true)
          if (active) setToken(t || null)
        }
      },
      1000 * 60 * 10,
    )

    return () => {
      active = false
      unsub()
      clearInterval(id)
    }
  }, [])

  const { data, error, isLoading, mutate } = useSWR<Note[]>(token ? ["/api/notes", token] : null, ([url, t]) =>
    fetchWithToken<Note[]>(url, t),
  )

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() || !token) return
    setSubmitting(true)
    setPostError(null)
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      })
      if (!res.ok) {
        const raw = await res.text().catch(() => "")
        let message = "Request failed"
        if (raw) {
          try {
            const data = JSON.parse(raw)
            message = data?.error || data?.message || raw || message
          } catch {
            message = raw || message
          }
        }
        throw new Error(message)
      }
      setContent("")
      mutate()
    } catch (err: any) {
      console.error("[v0] Note submit error", err?.message || err)
      setPostError(err?.message || "Failed to save note")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <form onSubmit={onSubmit} className="space-y-2 mb-4">
        <label htmlFor="note" className="text-sm">
          Add a note
        </label>
        <textarea
          id="note"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your note here…"
          className="w-full min-h-24 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground px-3 py-2"
        />
        <button
          className="rounded-md px-3 py-2 bg-primary text-primary-foreground text-sm disabled:opacity-60"
          disabled={submitting || !content.trim()}
        >
          {submitting ? "Saving…" : "Save note"}
        </button>
        {postError && <div className="text-sm text-destructive mt-2">{postError}</div>}
      </form>

      <div className="space-y-2">
        <h2 className="text-sm font-medium">Your notes</h2>
        {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
        {error && <div className="text-sm text-destructive">Failed to load notes</div>}
        {!isLoading && !error && (!data || data.length === 0) && (
          <div className="text-sm text-muted-foreground">No notes yet.</div>
        )}
        <ul className="space-y-2">
          {data?.map((n) => (
            <li key={n.id} className="rounded-md border border-border bg-background px-3 py-2">
              <div className="text-sm whitespace-pre-wrap">{n.content}</div>
              <div className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
