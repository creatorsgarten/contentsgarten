import { GitHubApp } from './GitHubApp'
import { RequestContext } from './RequestContext'
import { resolveGitHubUsernameFromId } from './resolveGitHubUsernameFromId'
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
    const username = await resolveGitHubUsernameFromId(ctx, octokit, userId)

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
