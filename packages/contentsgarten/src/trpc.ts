import { initTRPC } from '@trpc/server'
import type { ContentsgartenRequestContext } from './ContentsgartenContext'

export const t = initTRPC.context<ContentsgartenRequestContext>().create()
