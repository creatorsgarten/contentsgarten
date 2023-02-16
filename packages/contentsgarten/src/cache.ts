import { ContentsgartenRequestContext } from './ContentsgartenContext'

export async function cache<T>(
  ctx: ContentsgartenRequestContext,
  cacheKey: string,
  f: () => Promise<T>,
  ttl: number,
): Promise<T> {
  return ctx.app.queryClient.fetchQuery({
    queryKey: ['cache', cacheKey],
    queryFn: async () => {
      const cacheEntry = await ctx.app.cache.getCacheEntry(ctx, cacheKey)
      if (cacheEntry && Date.now() - Date.parse(cacheEntry.cachedAt) < ttl) {
        return cacheEntry.value
      }
      const result = await f()
      await ctx.app.cache.set(ctx, cacheKey, result)
      return result
    },
    staleTime: 0,
  })
}

export async function staleOrRevalidate<T>(
  ctx: ContentsgartenRequestContext,
  cacheKey: string,
  f: () => Promise<T>,
  mode: 'stale' | 'revalidate',
  ttl = 0,
): Promise<T> {
  return ctx.app.queryClient.fetchQuery({
    queryKey: ['cache', cacheKey],
    queryFn: async () => {
      if (mode === 'stale' || ttl > 0) {
        const cacheEntry = await ctx.app.cache.getCacheEntry(ctx, cacheKey)
        if (
          cacheEntry &&
          (mode === 'stale' ||
            Date.now() - Date.parse(cacheEntry.cachedAt) < ttl)
        ) {
          return cacheEntry.value
        }
      }
      const result = await f()
      await ctx.app.cache.set(ctx, cacheKey, result)
      return result
    },
    staleTime: mode === 'revalidate' ? 0 : Infinity,
  })
}
