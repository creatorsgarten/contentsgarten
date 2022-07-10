import { FC, useContext } from 'react'
import { createContext } from 'react'
import type { WikiAuthState } from './types'

export interface AuthContext {
  authState: WikiAuthState
}

const AuthContext = createContext<AuthContext>({
  authState: {
    authenticated: false,
    reason: 'No AuthProvider found',
  },
})

export interface AuthProvider {
  initialState: WikiAuthState
}

export const AuthProvider: FC<AuthProvider> = (props) => {
  return (
    <AuthContext.Provider value={{ authState: props.initialState }}>
      {props.children}
    </AuthContext.Provider>
  )
}

export function AuthBar() {
  const { authState } = useContext(AuthContext)
  return (
    <div className="absolute top-4 right-4 opacity-40">
      {authState.authenticated ? 'Authenticated' : 'Not Authenticated'}
    </div>
  )
}
