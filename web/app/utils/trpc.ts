import { createTRPCReact } from '@trpc/react-query'
import type { ContentsgartenRouter } from 'contentsgarten'

export const trpc = createTRPCReact<typeof ContentsgartenRouter>()
