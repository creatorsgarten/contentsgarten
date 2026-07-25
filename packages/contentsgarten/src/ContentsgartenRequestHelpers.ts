import { AuthorizerResult, GitHubHelpers } from './Authorizer'
import { AuthState } from './ContentsgartenAuth'
import type { ContentsgartenRequestContext } from './ContentsgartenContext'
import { cache } from './cache'

export async function resolveAuthState(ctx: ContentsgartenRequestContext) {
  return ctx.queryClient.fetchQuery({
    queryKey: ['authState'],
    queryFn: async () => {
      return ctx.app.auth.getAuthState(ctx.authToken)
    },
  })
}

export async function authorize(
  ctx: ContentsgartenRequestContext,
  authState: AuthState,
  pageRef: string,
): Promise<AuthorizerResult> {
  if (!authState.authenticated) {
    return {
      granted: false,
      reason: 'Not authenticated',
    }
  }
  return ctx.app.authorizer({
    action: {
      type: 'edit',
      pageRef,
    },
    user: authState.user,
    gitHub: createGitHubHelpers(ctx),
    claims: authState.claims,
  })
}

export function createGitHubHelpers(
  ctx: ContentsgartenRequestContext,
): GitHubHelpers {
  return {
    isUserInTeam: (user, owner, teamSlug) => {
      return cache(
        ctx,
        `team:${owner}/${teamSlug}:member:${user.id}`,
        async () => {
          return ctx.app.teamResolver.checkMembership(
            ctx,
            user.id,
            `${owner}/${teamSlug}`,
          )
        },
        300e3,
      )
    },
  }
}
