import { ContentsgartenRequestContext } from './ContentsgartenContext'

/**
 * Cache-aware, request-aware version of `getFile`
 */
export async function getFile(ctx: ContentsgartenRequestContext, path: string) {
  return ctx.queryClient.fetchQuery({
    queryKey: ['file', path],
    queryFn: async () => {
      const cacheKey = 'file:' + path
      const cacheEntry = await ctx.app.cache.getCacheEntry(ctx, cacheKey)
      if (cacheEntry) {
        return cacheEntry.value
      }
      const result = await ctx.app.storage.getFile(ctx, path)
      await ctx.app.cache.set(ctx, cacheKey, result)
      return result
    },
  })
}
