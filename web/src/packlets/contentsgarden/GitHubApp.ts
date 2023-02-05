import { QueryClient } from '@tanstack/query-core'
import { App } from 'octokit'

export class GitHubApp {
  private cache = new QueryClient()
  constructor(private config: GitHubAppConfig) {}
  getOctokit(repo: string) {
    return this.cache.fetchQuery({
      queryKey: [repo],
      queryFn: async () => {
        const app = new App({
          appId: this.config.appId,
          privateKey: this.config.privateKey,
        })
        const [owner, name] = repo.split('/')
        const installationResponse =
          await app.octokit.rest.apps.getRepoInstallation({
            owner,
            repo: name,
          })
        return app.getInstallationOctokit(installationResponse.data.id)
      },
    })
  }
}

export interface GitHubAppConfig {
  appId: number
  privateKey: string
}
