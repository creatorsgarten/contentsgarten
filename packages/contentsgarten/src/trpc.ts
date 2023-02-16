import { initTRPC } from '@trpc/server'
import type { ContentsgartenRequestContext } from './ContentsgartenContext'
import { OperationMeta } from 'openapi-trpc'

export const t = initTRPC
  .context<ContentsgartenRequestContext>()
  .meta<OperationMeta>()
  .create()
