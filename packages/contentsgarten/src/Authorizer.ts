import { User } from './ContentsgartenAuth'

export interface Authorizer {
  (ctx: AuthorizerContext): AuthorizerResult | Promise<AuthorizerResult>
}

export interface AuthorizerContext {
  user: User
  action: Action
  gitHub: GitHubHelpers
}

export type AuthorizerResult = AuthorizationGranted | AuthorizationDenied

export interface AuthorizationGranted {
  granted: true
}

export interface AuthorizationDenied {
  granted: false
  reason: string
}

export type Action = EditAction

export interface EditAction {
  type: 'edit'
  pageRef: string
}

export interface GitHubHelpers {
  isUserInTeam: (
    user: Pick<User, 'id'>,
    owner: string,
    teamSlug: string,
  ) => Promise<boolean>
}
