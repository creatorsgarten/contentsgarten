import type { ContentsgartenDefaultCacheOptions } from './ContentsgartenCache'

export interface ContentsgartenUserConfig {
  github: GitHubUserConfig
  firebase: FirebaseUserConfig
  mongodb: MongoDBUserConfig
  pageFilePrefix?: string
  pageFileExtension?: string
  legacyCache?: ContentsgartenDefaultCacheOptions
}

export interface GitHubUserConfig {
  auth: GitHubAppAuthUserConfig
  repo: string
  branch: string
}

export interface GitHubAppAuthUserConfig {
  appId: number
  privateKey: string
}

export interface FirebaseUserConfig {
  apiKey: string
  authDomain: string
  projectId: string
}

export interface MongoDBUserConfig {
  uri: string
  database?: string
}

export function defineConfig(
  config: ContentsgartenUserConfig,
): ContentsgartenUserConfig {
  return config
}
