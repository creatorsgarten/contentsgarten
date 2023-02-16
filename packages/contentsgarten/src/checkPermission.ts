import { ContentsgartenRequestContext } from './ContentsgartenContext'
import { Permission, Policy, PolicyFilterKey } from './Policy'
import { cache } from './cache'

export interface PermissionContext {
  permission: Permission
  userId?: number
  page?: string
  frontmatterKey?: string
}

type PermissionResolvers = {
  [K in PolicyFilterKey]: (
    requestContext: ContentsgartenRequestContext,
    permissionContext: PermissionContext,
    policyValue: Exclude<Policy[K], undefined>,
    policy: Policy,
  ) => PermissionResolution
}
export type DefinitePermissionResolution =
  | { included: true }
  | { included: false; reason: string }
type PermissionResolution =
  | DefinitePermissionResolution
  | {
      included?: undefined
      resolve: () => Promise<DefinitePermissionResolution>
    }

const includes = <T>(
  subject: string,
  value: T,
  accepted: string,
  array: T[],
): DefinitePermissionResolution => {
  return array.includes(value)
    ? { included: true }
    : {
        included: false,
        reason: `${subject}, “${value}”, is not in the list of ${accepted} defined by the policy ${JSON.stringify(
          array,
        )}`,
      }
}
const notIncludes = <T>(
  subject: string,
  value: T,
  excluded: string,
  array: T[],
): DefinitePermissionResolution => {
  return array.includes(value)
    ? { included: true }
    : {
        included: false,
        reason: `${subject}, “${value}”, is in the list of ${excluded} defined by the policy ${JSON.stringify(
          array,
        )}`,
      }
}
const permissionResolvers: PermissionResolvers = {
  userId: (requestContext, permissionContext, ids) => {
    if (!permissionContext.userId) {
      return { included: false, reason: 'You are not authenticated.' }
    }
    return includes('Your user ID', permissionContext.userId, 'user IDs', ids)
  },
  userIdNot: (requestContext, permissionContext, ids) => {
    if (!permissionContext.userId) {
      return { included: false, reason: 'You are not authenticated.' }
    }
    return notIncludes(
      'Your user ID',
      permissionContext.userId,
      'user IDs',
      ids,
    )
  },
  page: (requestContext, permissionContext, pages) => {
    return includes('The current page', permissionContext.page!, 'pages', pages)
  },
  pageNot: (requestContext, permissionContext, pages) => {
    return notIncludes(
      'The current page',
      permissionContext.page!,
      'pages',
      pages,
    )
  },
  frontmatterKey: (requestContext, permissionContext, keys) => {
    return includes(
      'The current frontmatter key',
      permissionContext.frontmatterKey!,
      'frontmatter keys',
      keys,
    )
  },
  frontmatterKeyNot: (requestContext, permissionContext, keys) => {
    return notIncludes(
      'The current frontmatter key',
      permissionContext.frontmatterKey!,
      'frontmatter keys',
      keys,
    )
  },
  team: (requestContext, permissionContext, teams) => {
    if (!permissionContext.userId) {
      return { included: false, reason: 'You are not authenticated.' }
    }
    const userId = permissionContext.userId
    return {
      resolve: async () => {
        const results = await Promise.all(
          teams.map(async (team) => {
            return cache(
              requestContext,
              `team:${team}:member:${userId}`,
              async () => {
                return requestContext.app.teamResolver.checkMembership(
                  requestContext,
                  userId,
                  team,
                )
              },
              300e3,
            )
          }),
        )
        if (results.some(Boolean)) {
          return { included: true }
        } else {
          return {
            included: false,
            reason: `You are not a member of any of the teams ${JSON.stringify(
              teams,
            )}`,
          }
        }
      },
    }
  },
}

type PendingResolutionEntry = {
  permissionContext: PermissionContext
  policy: Policy
  resolutions: PermissionResolution[]
}
export type DeniedEntry = {
  permissionContext: PermissionContext
  policy: Policy
  resolutions: DefinitePermissionResolution[]
}
export type CheckPermissionResult = GrantedResult | DeniedResult
export type GrantedResult = {
  granted: true
  permissionContext: PermissionContext
  policy: Policy
}
export type DeniedResult = {
  granted: false
  denied: DeniedEntry[]
}
export async function checkPermission(
  requestContext: ContentsgartenRequestContext,
  permissionContexts: PermissionContext[],
  policies: Policy[],
): Promise<CheckPermissionResult> {
  const pending: PendingResolutionEntry[] = []
  const denied: DeniedEntry[] = []
  for (const permissionContext of permissionContexts) {
    const requestedPermission = permissionContext.permission

    if (
      requestedPermission === 'edit' ||
      requestedPermission === 'editContent'
    ) {
      if (permissionContext.page?.toLowerCase().startsWith('special/')) {
        denied.push({
          permissionContext,
          policy: {
            name: 'Do not allow editing special pages',
            permission: [],
          },
          resolutions: [
            {
              included: false,
              reason:
                'Special pages are dynamically generated and are not editable',
            },
          ],
        })
        continue
      }
    }

    for (const policy of policies) {
      const grantedPermissions = policy.permission
      const granted = grantedPermissions.includes(requestedPermission)
      if (!granted) continue

      const resolutions: PermissionResolution[] = []
      for (const [key, resolver] of Object.entries(permissionResolvers)) {
        const policyValue = policy[key as PolicyFilterKey]
        if (policyValue == null) continue
        const resolution = resolver(
          requestContext,
          permissionContext,
          policyValue as any,
          policy,
        )
        resolutions.push(resolution)
        if (resolution.included === false) break
      }

      if (resolutions.every((r) => r.included)) {
        return { granted: true, permissionContext, policy }
      } else if (resolutions.some((r) => r.included !== false)) {
        pending.push({ permissionContext, policy, resolutions })
      } else {
        denied.push({
          permissionContext,
          policy,
          resolutions: resolutions as any,
        })
      }
    }
  }

  const resolved = await Promise.all(
    pending.map(async ({ permissionContext, policy, resolutions }) => {
      const definiteResolutions = await Promise.all(
        resolutions.map((r) => (r.included !== undefined ? r : r.resolve())),
      )
      return {
        permissionContext,
        policy,
        resolutions: definiteResolutions,
      }
    }),
  )
  for (const { permissionContext, policy, resolutions } of resolved) {
    if (resolutions.every((r) => r.included)) {
      return { granted: true, permissionContext, policy }
    } else {
      denied.push({ permissionContext, policy, resolutions })
    }
  }

  return { granted: false, denied }
}
