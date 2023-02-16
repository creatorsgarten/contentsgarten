import { ContentsgartenRequestContext } from './ContentsgartenContext'
import { staleOrRevalidate } from './cache'

/**
 * Cache-aware, request-aware version of `getFile`
 */
export async function getFile(
  ctx: ContentsgartenRequestContext,
  path: string,
  extraOptions: CachedGetFileOptions = {},
) {
  return staleOrRevalidate(
    ctx,
    'file:' + path,
    async () => (await ctx.app.storage.getFile(ctx, path)) || null,
    extraOptions.revalidating ? 'revalidate' : 'stale',
  )
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
