"use client"

import type React from "react"

import { useState } from "react"
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth"
import "../lib/firebase-client"

type Mode = "login" | "signup"

export default function AuthForm() {
  const [mode, setMode] = useState<Mode>("login")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const auth = getAuth()

    try {
      if (mode === "signup") {
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        if (name.trim()) {
          await updateProfile(cred.user, { displayName: name.trim() })
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
    } catch (err: any) {
      setError(err?.message || "Authentication failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button
          className={`px-3 py-2 rounded-md text-sm border ${
            mode === "login"
              ? "bg-primary text-primary-foreground border-transparent"
              : "bg-background text-foreground border-border"
          }`}
          onClick={() => setMode("login")}
          type="button"
        >
          Log in
        </button>
        <button
          className={`px-3 py-2 rounded-md text-sm border ${
            mode === "signup"
              ? "bg-primary text-primary-foreground border-transparent"
              : "bg-background text-foreground border-border"
          }`}
          onClick={() => setMode("signup")}
          type="button"
        >
          Sign up
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {mode === "signup" && (
          <div className="space-y-1">
            <label className="text-sm" htmlFor="name">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-border bg-background text-foreground px-3 py-2"
              placeholder="Ada Lovelace"
            />
          </div>
        )}

        <div className="space-y-1">
          <label className="text-sm" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-border bg-background text-foreground px-3 py-2"
            placeholder="you@example.com"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-border bg-background text-foreground px-3 py-2"
            placeholder="••••••••"
            required
          />
        </div>

        {error && <div className="text-sm text-destructive">{error}</div>}

        <button
          disabled={loading}
          className="w-full rounded-md px-3 py-2 bg-primary text-primary-foreground text-sm disabled:opacity-60"
        >
          {loading ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
        </button>
      </form>
    </div>
  )
}
