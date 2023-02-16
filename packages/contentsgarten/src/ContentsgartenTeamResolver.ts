import { GitHubApp } from './GitHubApp'
import { RequestContext } from './RequestContext'
import { resolveOctokit } from './resolveOctokit'

export interface ContentsgartenTeamResolver {
  checkMembership(
    ctx: RequestContext,
    userId: number,
    ownerAndTeamSlug: string,
  ): Promise<boolean>
}

export class GitHubTeamResolver implements ContentsgartenTeamResolver {
  constructor(private app: GitHubApp) {}
  async checkMembership(
    ctx: RequestContext,
    userId: number,
    ownerAndTeamSlug: string,
  ) {
    const [owner, teamSlug] = ownerAndTeamSlug.split('/')
    const octokit = await resolveOctokit(ctx, this.app, owner)

    // https://stackoverflow.com/a/30579888/559913
    const username = await ctx.app.queryClient.fetchQuery({
      queryKey: ['userIdToUsername', userId],
      queryFn: async () => {
        const response = await octokit.request('GET /user/{user_id}', {
          user_id: userId,
        })
        return response.data.login as string
      },
      staleTime: 300e3,
    })

    return octokit.rest.teams
      .getMembershipForUserInOrg({
        org: owner,
        team_slug: teamSlug,
        username,
      })
      .then(
        ({ data }) => data.state === 'active',
        () => false,
      )
  }
}
