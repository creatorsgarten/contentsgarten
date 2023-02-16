import { get } from 'lodash-es'
import type { GitHubApp } from './GitHubApp'
import { verifyFirebaseIdToken } from './verifyFirebaseIdToken'
import { z } from 'zod'

export interface ContentsgartenAuth {
  getAuthState(authToken?: string): Promise<AuthState>
}

export class GitHubFirebaseAuth implements ContentsgartenAuth {
  constructor(private config: GitHubFirebaseAuthConfig) {}
  async getAuthState(authToken?: string | undefined): Promise<AuthState> {
    try {
      if (!authToken) {
        return {
          authenticated: false,
          reason: 'No credential provided',
        }
      }
      const projectId = this.config.firebase.projectId
      const result = await verifyFirebaseIdToken(projectId, authToken)
      const id = +get(result.payload, [
        'firebase',
        'identities',
        'github.com',
        0,
      ])
      if (!id) {
        return {
          authenticated: false,
          reason: 'The current user did not log in with GitHub',
        }
      }
      const name =
        (get(result.payload, ['name']) as string) ||
        (get(result.payload, ['email']) as string) ||
        'UID: ' + get(result.payload, ['sub'])
      const uid = get(result.payload, ['sub']) as string
      return {
        authenticated: true,
        user: { id, name, uid },
      }
    } catch (error) {
      return {
        authenticated: false,
        reason: `Error while verifying credential: ${error}`,
      }
    }
  }
}

export const User = z
  .object({
    id: z.number().describe('Numeric ID, represents the user from GitHub API'),
    name: z.string().describe('Display name of the user'),
    uid: z.string().describe('Firebase UID'),
  })
  .describe('A user object')
export type User = z.infer<typeof User>

export type AuthState = AuthStateAuthenticated | AuthStateUnauthenticated

export interface AuthStateAuthenticated {
  authenticated: true
  user: User
}

export interface AuthStateUnauthenticated {
  authenticated: false
  reason: string
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
