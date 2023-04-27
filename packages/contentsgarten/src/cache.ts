import { ContentsgartenRequestContext } from './ContentsgartenContext'

export async function cache<T>(
  ctx: ContentsgartenRequestContext,
  cacheKey: string,
  f: () => Promise<T>,
  ttl: number,
): Promise<T> {
  return ctx.perf.measure(`cache(${cacheKey}, ttl=${ttl})`, (e) =>
    ctx.app.queryClient.fetchQuery({
      queryKey: ['cache', cacheKey],
      queryFn: async () => {
        e.addInfo('MISS')
        const result = await f()
        return result
      },
      staleTime: ttl,
    }),
  )
}

export async function staleOrRevalidate<T>(
  ctx: ContentsgartenRequestContext,
  cacheKey: string,
  f: () => Promise<T>,
  mode: 'stale' | 'revalidate',
): Promise<T> {
  return cache(ctx, cacheKey, f, mode === 'stale' ? Infinity : 0)
}
