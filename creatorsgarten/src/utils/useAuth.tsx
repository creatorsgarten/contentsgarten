import { useQuery } from '@tanstack/react-query'
import { auth } from './auth'
import { trpc } from './trpc'

export function useAuth() {
  const authStateQuery = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: async () => {
      await auth.loadedPromise
      return auth.getCurrentUser()
    },
  })
  const userInfoQuery = trpc.userInfo.useQuery(undefined, {
    enabled: !!authStateQuery.data,
  })
  return {
    state: (() => {
      if (authStateQuery.isLoading) return 'loading'
      if (!authStateQuery.data) return 'unauthenticated'
      if (userInfoQuery.isLoading) return 'loading'
      return userInfoQuery.data?.authenticated
        ? 'authenticated'
        : 'unauthenticated'
    })(),
    name: userInfoQuery.data?.authenticated
      ? userInfoQuery.data.user.name
      : undefined,
  } as const
}
