import { ZodType, z } from 'zod'

/** https://contentsgarten.netlify.app/wiki/ACL */
export const permissions = ['edit', 'editContent'] as const

export const Permission = z.enum(permissions)
export type Permission = z.infer<typeof Permission>

function multi<T extends ZodType>(input: T) {
  const array = z.array(input)
  return z
    .union([input, array])
    .transform((x) => (Array.isArray(x) ? x : [x])) as unknown as typeof array
}

export const Policy = z.object({
  permission: multi(Permission),
  name: z.string().optional(),
  userId: multi(z.coerce.number()).optional(),
  userIdNot: multi(z.coerce.number()).optional(),
  team: multi(z.string()).optional(),
  page: multi(z.string()).optional(),
  pageNot: multi(z.string()).optional(),
  frontmatterKey: multi(z.string()).optional(),
  frontmatterKeyNot: multi(z.string()).optional(),
})
export type Policy = z.infer<typeof Policy>
export type PolicyFilterKey = Exclude<keyof Policy, 'permission' | 'name'>
