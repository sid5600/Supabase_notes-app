"use client"

import { useEffect, useState } from "react"
import AuthForm from "../components/auth-form"
import Notes from "../components/notes"
import { getAuth, onAuthStateChanged, signOut, type User } from "firebase/auth"
import "../lib/firebase-client"

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    const auth = getAuth()
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setInitializing(false)
    })
    return () => unsub()
  }, [])

  if (initializing) {
    return (
      <main className="min-h-dvh flex items-center justify-center">
        <div className="text-muted-foreground">Loading…</div>
      </main>
    )
  }

  return (
    <main className="min-h-dvh flex items-center justify-center">
      <div className="w-full max-w-md p-6 border border-border rounded-lg bg-card shadow-sm">
        {!user ? (
          <>
            <h1 className="text-2xl font-semibold mb-2 text-pretty">NextNotesApp</h1>
            <p className="text-sm text-muted-foreground mb-6">Sign up or log in to start saving notes.</p>
            <AuthForm />
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-semibold text-pretty">Hi, {user.displayName || user.email}</h1>
              <button
                onClick={() => signOut(getAuth())}
                className="inline-flex items-center gap-2 rounded-md px-3 py-2 border border-border bg-background hover:bg-accent text-foreground text-sm"
              >
                Sign out
              </button>
            </div>
            <Notes />
          </>
        )}
      </div>
    </main>
  )
}
