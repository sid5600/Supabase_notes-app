import { initializeApp, getApps } from "firebase/app"

// Expose getAuth via firebase/auth where used to avoid importing here
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
}

if (!getApps().length) {
  initializeApp(firebaseConfig)
}
