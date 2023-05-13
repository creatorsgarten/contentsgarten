import { get } from 'lodash-es'
import type { GitHubApp } from './GitHubApp'
import { verifyFirebaseIdToken } from './verifyFirebaseIdToken'
import { z } from 'zod'
import {
  JSONWebKeySet,
  createLocalJWKSet,
  decodeProtectedHeader,
  jwtVerify,
} from 'jose'

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

export class CustomAuth implements ContentsgartenAuth {
  private jwks: ReturnType<typeof createLocalJWKSet>
  private kids: Set<string>

  constructor(private config: { jwks: JSONWebKeySet }) {
    this.jwks = createLocalJWKSet(config.jwks)
    this.kids = new Set(
      config.jwks.keys.map((key) => key.kid!).filter((x) => x),
    )
  }

  async getAuthState(authToken?: string): Promise<AuthState> {
    if (!authToken) {
      return {
        authenticated: false,
        reason: 'No credential provided',
      }
    }

    const decoded = decodeProtectedHeader(authToken)
    if (
      decoded.alg !== 'RS256' ||
      !decoded.kid ||
      !this.kids.has(decoded.kid)
    ) {
      return {
        authenticated: false,
        reason: 'Unrecognized key ID',
      }
    }

    const result = await jwtVerify(authToken, this.jwks)
    const id = +get(result.payload, ['connections', 'github', 'id'])
    if (!id) {
      return {
        authenticated: false,
        reason: 'The current user did not log in with GitHub',
      }
    }

    const name = get(result.payload, ['name']) as string
    const uid = String(get(result.payload, ['uid']) as string)
    return {
      authenticated: true,
      user: { id, name, uid },
    }
  }
}

export class CompositeAuth implements ContentsgartenAuth {
  constructor(private auths: ContentsgartenAuth[]) {}
  async getAuthState(authToken?: string): Promise<AuthState> {
    for (const auth of this.auths) {
      const authState = await auth.getAuthState(authToken)
      if (authState.authenticated) {
        return authState
      }
    }
    return {
      authenticated: false,
      reason: 'None of the auth providers recognized the credential',
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
