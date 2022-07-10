export interface WikiCredential {
  idToken: string
}

export type WikiAuthState =
  | WikiAuthStateAuthenticated
  | WikiAuthStateUnauthenticated

export interface WikiAuthStateAuthenticated {
  authenticated: true
  user: {
    id: number
    name: string
  }
}

export interface WikiAuthStateUnauthenticated {
  authenticated: false
  reason: string
}
