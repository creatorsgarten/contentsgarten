import { createTRPCReact } from '@trpc/react-query'
import type { ContentsgartenRouter } from '../../src/packlets/contentsgarden'

export const trpc = createTRPCReact<typeof ContentsgartenRouter>()
