export class GitHubApp {
  constructor(private config: GitHubAppConfig) {}
}

export interface GitHubAppConfig {
  appId?: number
  privateKey?: string
}
