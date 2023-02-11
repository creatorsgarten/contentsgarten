import { ContentsgartenRequestContext } from './ContentsgartenContext'

/**
 * Cache-aware, request-aware version of `getFile`
 */
export async function getFile(
  ctx: ContentsgartenRequestContext,
  path: string,
  extraOptions: CachedGetFileOptions = {},
) {
  return ctx.queryClient.fetchQuery({
    queryKey: ['file', path],
    queryFn: async () => {
      const cacheKey = 'file:' + path
      if (!extraOptions.revalidating) {
        const cacheEntry = await ctx.app.cache.getCacheEntry(ctx, cacheKey)
        if (cacheEntry) {
          return cacheEntry.value
        }
      }
      const result = (await ctx.app.storage.getFile(ctx, path)) || null
      await ctx.app.cache.set(ctx, cacheKey, result)
      return result
    },
    staleTime: extraOptions.revalidating ? 0 : Infinity,
  })
}

export interface CachedGetFileOptions {
  /**
   * True if the file is being revalidated.
   * It will skip the cache and only use the storage.
   */
  revalidating?: boolean
}

export async function invalidateFile(
  ctx: ContentsgartenRequestContext,
  path: string,
) {
  const cacheKey = 'file:' + path
  await ctx.app.cache.invalidate(ctx, cacheKey)
}
