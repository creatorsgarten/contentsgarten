import { FirebaseApp } from 'firebase/app'
import {
  getAuth,
  onAuthStateChanged,
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as signOutFirebase,
} from 'firebase/auth'

export interface ContentsgartenUser {
  uid: string
  getIdToken: () => Promise<string>
}

export interface ContentsgartenAuthProvider {
  loadedPromise: Promise<void>
  getCurrentUser: () => ContentsgartenUser | null
  signIn: () => void
  signOut: () => void
  listen: (listener: () => void) => () => void
}

export class FirebaseAuthProvider implements ContentsgartenAuthProvider {
  loadedPromise: Promise<void>
  private auth: Auth
  private listeners = new Set<() => void>()

  constructor(app: FirebaseApp) {
    this.auth = getAuth(app)
    this.loadedPromise = new Promise((resolve) => {
      onAuthStateChanged(this.auth, () => {
        resolve()
        this.notify()
      })
    })
  }

  private notify() {
    this.listeners.forEach((listener) => listener())
  }

  getCurrentUser() {
    return this.auth.currentUser
  }

  listen(listener: () => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  signIn() {
    const provider = new GoogleAuthProvider()
    signInWithPopup(this.auth, provider)
  }

  signOut() {
    signOutFirebase(this.auth)
  }
}
