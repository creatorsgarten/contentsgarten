import { useQuery, useQueryClient } from '@tanstack/react-query'
import Cookies from 'js-cookie'
import { once } from 'lodash-es'
import type { FC } from 'react'
import { useEffect } from 'react'
import { restClient } from '~/utils/restClient'

/**
 * Query key used for the authenticated-user REST call (`GET /user`), shared
 * between the query and the invalidation triggered on sign-in/sign-out.
 */
const authStateQueryKey = ['contentsgarten', 'user'] as const

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

const getAuthController = once(async (): Promise<AuthController> => {
  if (document.documentElement.dataset.testMode === 'true') {
    let onInvalidate = () => {}
    return {
      signOut: () => {
        Cookies.remove('contentsgarten_id_token')
        onInvalidate()
      },
      signIn: () => {
        Cookies.set('contentsgarten_id_token', 'fake:1', { expires: 1 })
        onInvalidate()
      },
      setInvalidateCallback: (fn: () => void) => {
        onInvalidate = fn
      },
    }
  }

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

interface AuthController {
  signOut: () => void
  signIn: () => void
  setInvalidateCallback: (fn: () => void) => void
}

export const AuthWorker: FC = () => {
  const queryClient = useQueryClient()
  useEffect(() => {
    getAuthController().then((c) => {
      c.setInvalidateCallback(() => {
        queryClient.invalidateQueries({ queryKey: authStateQueryKey })
      })
    })
  }, [queryClient])
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
  return useQuery({
    queryKey: authStateQueryKey,
    queryFn: async () => {
      const { data, error } = await restClient.GET('/user')
      if (error) throw error
      return data
    },
    refetchOnWindowFocus: false,
  }).data
}
