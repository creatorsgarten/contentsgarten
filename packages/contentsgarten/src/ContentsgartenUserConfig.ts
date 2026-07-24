import { JSONWebKeySet } from 'jose'
import { Authorizer } from './Authorizer'

export interface ContentsgartenUserConfig {
  github: GitHubUserConfig
  firebase: FirebaseUserConfig
  mongodb: MongoDBUserConfig
  pageFilePrefix?: string
  customJwtAuth?: CustomJwtAuthUserConfig
  pageFileExtension?: string
  authorizer: Authorizer
}

interface GitHubUserConfig {
  auth: GitHubAppAuthUserConfig
  repo: string
  branch: string
}

interface GitHubAppAuthUserConfig {
  appId: number
  privateKey: string
}

interface FirebaseUserConfig {
  apiKey: string
  authDomain: string
  projectId: string
}

interface CustomJwtAuthUserConfig {
  /** JWT public keys */
  jwks: JSONWebKeySet
}

interface MongoDBUserConfig {
  uri: string
  database?: string
}
