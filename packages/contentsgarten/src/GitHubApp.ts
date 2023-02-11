export class GitHubApp {
  constructor(public config: GitHubAppConfig) {}
}

export interface GitHubAppConfig {
  appId: number
  privateKey: string
}
