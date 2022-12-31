import type { GitHubApp } from './GitHubApp'

export interface ContentsgartenStorage {}

export class GitHubStorage implements ContentsgartenStorage {
  constructor(private config: GitHubStorageConfig) {}
}

export interface GitHubStorageConfig {
  repo: string
  app: GitHubApp
}
