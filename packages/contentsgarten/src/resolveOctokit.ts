import { App, Octokit } from 'octokit'
import { GitHubApp } from './GitHubApp'
import { RequestContext } from './RequestContext'

export async function resolveOctokit(
  ctx: RequestContext,
  app: GitHubApp,
  orgOrOwnerRepo: string,
) {
  return ctx.app.queryClient.fetchQuery({
    queryKey: ['octokit', orgOrOwnerRepo],
    queryFn: async () => {
      const octokit = await getOctokit(ctx, app, orgOrOwnerRepo)
      return octokit as ContentsgartenOctokit
    },
  })
}

interface ContentsgartenOctokit {
  rest: Octokit['rest']
  request: Octokit['request']
}

async function getOctokit(
  ctx: RequestContext,
  app: GitHubApp,
  orgOrOwnerRepo: string,
) {
  const octokitApp = new App({
    appId: app.config.appId,
    privateKey: app.config.privateKey,
  })
  const [owner, repo] = orgOrOwnerRepo.split('/')
  const installationResponse = repo
    ? await octokitApp.octokit.rest.apps.getRepoInstallation({
        owner,
        repo,
      })
    : await octokitApp.octokit.rest.apps.getOrgInstallation({
        org: owner,
      })
  return octokitApp.getInstallationOctokit(installationResponse.data.id)
}
