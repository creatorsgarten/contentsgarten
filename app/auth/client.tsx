import Cookies from 'js-cookie'
import type { FC } from 'react'
import { useContext, useEffect, useState } from 'react'
import { createContext } from 'react'
import type { WikiAuthState } from './types'

interface ClientSideAuthContext {
  signIn?: () => void
  signOut?: () => void
}

export interface AuthContext {
  authState: WikiAuthState
  clientSide?: ClientSideAuthContext
  setClientSideState: (s: ClientSideAuthContext) => void
}

const AuthContext = createContext<AuthContext>({
  authState: {
    authenticated: false,
    reason: 'No AuthProvider found',
  },
  setClientSideState: () => {},
})

export interface AuthProvider {
  initialState: WikiAuthState
  children: React.ReactNode
}

export const AuthProvider: FC<AuthProvider> = (props) => {
  const [state, setState] = useState<ClientSideAuthContext | undefined>(
    undefined,
  )
  return (
    <AuthContext.Provider
      value={{
        authState: props.initialState,
        clientSide: state,
        setClientSideState: setState,
      }}
    >
      {props.children}
      <AuthWorker />
    </AuthContext.Provider>
  )
}

export const AuthWorker: FC = () => {
  const { authState, setClientSideState } = useContext(AuthContext)
  const uidFromCookie = authState.authenticated ? authState.user.uid : ''
  useEffect(() => {
    import('./firebase-sdk.client').then((firebase) => {
      const app = firebase.initializeApp({
        apiKey: 'AIzaSyCKZng55l411pps2HgMcuenMQou-NTQ0QE',
        authDomain: 'creatorsgarten-wiki.firebaseapp.com',
        projectId: 'creatorsgarten-wiki',
      })
      const auth = firebase.getAuth(app)
      firebase.onAuthStateChanged(auth, (user) => {
        if (user) {
          setClientSideState({
            signOut: () => firebase.signOut(auth),
          })
        } else {
          setClientSideState({
            signIn: () =>
              firebase.signInWithPopup(auth, new firebase.GithubAuthProvider()),
          })
        }
      })
      firebase.onIdTokenChanged(auth, async (user) => {
        if (user) {
          const token = await user.getIdToken()
          const existingToken = Cookies.get('contentsgarten_id_token')
          if (token !== existingToken) {
            Cookies.set('contentsgarten_id_token', token, { expires: 1 })
          }
          checkAndReload(uidFromCookie, user.uid)
        } else {
          Cookies.remove('contentsgarten_id_token')
          checkAndReload(uidFromCookie, '')
        }
      })
    })
  }, [setClientSideState, uidFromCookie])
  return null
}

function checkAndReload(current: string, expected: string) {
  if (current !== expected) {
    if (sessionStorage.contentsgartenRefreshUserId === expected) {
      console.warn('Reload loop prevented')
      return
    }
    sessionStorage.contentsgartenRefreshUserId = expected
    location.reload()
  }
}

export function AuthBar() {
  const { authState, clientSide } = useContext(AuthContext)
  return (
    <div className="absolute top-4 right-4 opacity-40 text-sm">
      {!!authState.authenticated && (
        <>
          <strong>{authState.user.name}</strong>{' '}
        </>
      )}
      {!!clientSide?.signIn && (
        <button onClick={clientSide.signIn}>[Sign In]</button>
      )}
      {!!clientSide?.signOut && (
        <button onClick={clientSide.signOut}>[Sign Out]</button>
      )}
    </div>
  )
}
