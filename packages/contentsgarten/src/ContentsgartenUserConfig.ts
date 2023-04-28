import { JSONWebKeySet } from 'jose'

export interface ContentsgartenUserConfig {
  github: GitHubUserConfig
  firebase: FirebaseUserConfig
  mongodb: MongoDBUserConfig
  pageFilePrefix?: string
  customJwtAuth?: CustomJwtAuthUserConfig
  pageFileExtension?: string
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

export interface CustomJwtAuthUserConfig {
  /** JWT public keys */
  jwks: JSONWebKeySet
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
