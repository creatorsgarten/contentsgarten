import type { GitHubApp } from './GitHubApp'

export interface ContentsgartenAuth {}

export class GitHubFirebaseAuth implements ContentsgartenAuth {
  constructor(private config: GitHubFirebaseAuthConfig) {}
}

export interface GitHubFirebaseAuthConfig {
  gitHub: {
    app: GitHubApp
  }
  firebase: {
    apiKey: string
    authDomain: string
    projectId: string
  }
}
