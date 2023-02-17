import { useQuery } from '@tanstack/react-query'
import Cookies from 'js-cookie'
import { once } from 'lodash-es'
import type { FC } from 'react'
import { useEffect } from 'react'
import { trpc, trpcClient } from '~/utils/trpc'

export interface AuthProvider {
  children: React.ReactNode
}

export const AuthProvider: FC<AuthProvider> = (props) => {
  return (
    <>
      {props.children}
      <AuthWorker />
    </>
  )
}

const getAuthController = once(async () => {
  const firebase = await import('./firebase-sdk.client')
  const app = firebase.initializeApp({
    apiKey: 'AIzaSyCKZng55l411pps2HgMcuenMQou-NTQ0QE',
    authDomain: 'creatorsgarten-wiki.firebaseapp.com',
    projectId: 'creatorsgarten-wiki',
  })
  const auth = firebase.getAuth(app)
  let onInvalidate = () => {}
  firebase.onIdTokenChanged(auth, async (user) => {
    if (user) {
      const token = await user.getIdToken()
      const existingToken = Cookies.get('contentsgarten_id_token')
      if (token !== existingToken) {
        Cookies.set('contentsgarten_id_token', token, { expires: 1 })
        onInvalidate()
      }
    } else {
      Cookies.remove('contentsgarten_id_token')
      onInvalidate()
    }
  })
  return {
    signOut: () => firebase.signOut(auth),
    signIn: () =>
      firebase.signInWithPopup(auth, new firebase.GithubAuthProvider()),
    setInvalidateCallback: (fn: () => void) => {
      onInvalidate = fn
    },
  }
})

export const AuthWorker: FC = () => {
  const trpcContext = trpc.useContext()
  useEffect(() => {
    getAuthController().then((c) => {
      c.setInvalidateCallback(() => {
        trpcContext.invalidate()
      })
    })
  }, [trpcContext])
  return null
}

export function AuthBar() {
  const controller = useAuthController()
  const authState = useAuthState()
  if (!authState) return null
  return (
    <div className="absolute top-4 right-4 opacity-40 text-sm">
      {!!authState.authenticated && (
        <>
          <strong>{authState.user.name}</strong>{' '}
        </>
      )}
      {!authState.authenticated && !!controller && (
        <button onClick={controller.signIn}>[Sign In]</button>
      )}
      {!!authState.authenticated && !!controller && (
        <button onClick={controller.signOut}>[Sign Out]</button>
      )}
    </div>
  )
}

function useAuthController() {
  return useQuery({
    queryKey: ['authController'],
    queryFn: () => getAuthController(),
  }).data
}

function useAuthState() {
  return trpc.userInfo.useQuery(undefined, {
    refetchOnWindowFocus: false,
  }).data
}
