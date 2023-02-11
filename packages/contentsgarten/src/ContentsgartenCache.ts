import Keyv from 'keyv'
import { RequestContext } from './RequestContext'

export interface ContentsgartenCache {
  get(ctx: RequestContext, key: string): Promise<any>
  set(ctx: RequestContext, key: string, value: any): Promise<void>
  getCacheEntry(
    ctx: RequestContext,
    key: string,
  ): Promise<CacheEntry | undefined>
}

export interface CacheEntry {
  value: any
  cachedAt: string
}

export class ContentsgartenDefaultCache implements ContentsgartenCache {
  private keyv: Keyv

  /**
   * @param url The Redis URL
   */
  constructor(url?: string) {
    this.keyv = new Keyv(url)
  }

  async get(ctx: RequestContext, key: string) {
    return (await this.getCacheEntry(ctx, key))?.value
  }

  async set(ctx: RequestContext, key: string, value: any) {
    const entry: CacheEntry = { value, cachedAt: new Date().toISOString() }
    await this.keyv.set(key, entry)
  }

  async getCacheEntry(ctx: RequestContext, key: string) {
    const value = await this.keyv.get(key)
    return value
  }
}
