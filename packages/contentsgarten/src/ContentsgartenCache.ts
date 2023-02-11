import Keyv from 'keyv'
import { RequestContext } from './RequestContext'
import { createHmac } from 'crypto'

export interface ContentsgartenCache {
  get(ctx: RequestContext, key: string): Promise<any>
  set(ctx: RequestContext, key: string, value: any): Promise<void>
  invalidate(ctx: RequestContext, key: string): Promise<void>
  getCacheEntry(
    ctx: RequestContext,
    key: string,
  ): Promise<CacheEntry | undefined>
}

export interface CacheEntry {
  value: any
  cachedAt: string
}

export interface ContentsgartenDefaultCacheOptions {
  /**
   * Redis URL
   */
  url?: string

  /**
   * Optional signing key, when the cache is hosted by a third party,
   * without encryption, and you want to make sure that the cache
   * is not tampered with
   */
  signingKey?: string
}

const createSigningWrapper = (secret: string) => {
  const hmac = () => createHmac('sha256', secret)
  type Serialize = Keyv['opts']['serialize']
  type Deserialize = Keyv['opts']['deserialize']
  return {
    wrapSerialize: (original: Serialize): Serialize => {
      return (value: any) => {
        const serialized = original(value)
        const signature = hmac().update(serialized).digest('hex')
        return `${signature}:${serialized}`
      }
    },
    wrapDeserialize: (original: Deserialize): Deserialize => {
      return (value: any) => {
        const signature = value.slice(0, 64)
        const serialized = value.slice(65)
        const expectedSignature = hmac().update(serialized).digest('hex')
        if (signature !== expectedSignature) {
          return undefined
        }
        return original(serialized)
      }
    },
  }
}

export class ContentsgartenDefaultCache implements ContentsgartenCache {
  private keyv: Keyv

  constructor({ url, signingKey }: ContentsgartenDefaultCacheOptions = {}) {
    const keyv = new Keyv(url)
    this.keyv = keyv
    if (signingKey) {
      const wrapper = createSigningWrapper(signingKey)
      keyv.opts.serialize = wrapper.wrapSerialize(keyv.opts.serialize)
      keyv.opts.deserialize = wrapper.wrapDeserialize(keyv.opts.deserialize)
    }
  }

  async get(ctx: RequestContext, key: string) {
    return (await this.getCacheEntry(ctx, key))?.value
  }

  async set(ctx: RequestContext, key: string, value: any) {
    const entry: CacheEntry = { value, cachedAt: new Date().toISOString() }
    await this.keyv.set(key, entry)
  }

  async invalidate(ctx: RequestContext, key: string) {
    await this.keyv.delete(key)
  }

  async getCacheEntry(ctx: RequestContext, key: string) {
    const value = await this.keyv.get(key)
    return value
  }
}
