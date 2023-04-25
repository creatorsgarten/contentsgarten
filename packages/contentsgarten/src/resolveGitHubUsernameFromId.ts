import { RequestContext } from './RequestContext'
import { ContentsgartenOctokit } from './resolveOctokit'

export function resolveGitHubUsernameFromId(
  ctx: RequestContext,
  octokit: ContentsgartenOctokit,
  userId: number,
) {
  return ctx.app.queryClient.fetchQuery({
    queryKey: ['userIdToUsername', userId],
    queryFn: async () => {
      // https://stackoverflow.com/a/30579888/559913
      const response = await octokit.request('GET /user/{user_id}', {
        user_id: userId,
      })
      return response.data.login as string
    },
  })
}
