import { initTRPC } from '@trpc/server'
import type { ContentsgartenContext } from './ContentsgartenContext'

export const t = initTRPC.context<ContentsgartenContext>().create()
