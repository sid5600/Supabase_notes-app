import { cert, getApps, initializeApp } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"

function getPrivateKey() {
  const key = process.env.FIREBASE_PRIVATE_KEY || ""
  // Handle escaped newlines in env var
  return key.replace(/\\n/g, "\n")
}

export function getAdminApp() {
  const apps = getApps()
  if (apps.length) return apps[0]
  const projectId = process.env.FIREBASE_PROJECT_ID!
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL!
  const privateKey = getPrivateKey()

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  })
}

export async function verifyFirebaseIdToken(idToken: string) {
  const app = getAdminApp()
  return getAuth(app).verifyIdToken(idToken)
}
