import { Document, Db } from 'mongodb'
import { ContentsgartenRequestContext } from './ContentsgartenContext'

const PageCollection = defineCollectionSchema<PageDoc>('pages')
const currentCacheVersion = 'v2'

export interface ContentsgartenPageDatabase {
  getCached(pageRef: string): Promise<PageData | null>
  save(pageRef: string, input: PageDataInput): Promise<PageData>
  getRecentlyChangedPages(): Promise<PageListingItem[]>
}

export interface PageListingItem {
  pageRef: string
  lastModified: Date
}

export class MongoDBPageDatabase implements ContentsgartenPageDatabase {
  constructor(private db: Db) {}
  async getCached(pageRef: string): Promise<PageData | null> {
    const collection = PageCollection.of(this.db)
    const doc = await collection.findOne({
      _id: pageRef,
      cacheVersion: currentCacheVersion,
    })
    if (!doc) {
      return null
    }
    return doc
  }
  async save(pageRef: string, input: PageDataInput): Promise<PageData> {
    const collection = PageCollection.of(this.db)
    const newDoc: PageDoc = {
      _id: pageRef,
      cacheVersion: currentCacheVersion,
      data: input.data,
      lastModified: input.lastModified,
      cached: new Date(),
    }
    await collection.replaceOne({ _id: pageRef }, newDoc, { upsert: true })
    return newDoc
  }
  async getRecentlyChangedPages(): Promise<PageListingItem[]> {
    const collection = PageCollection.of(this.db)
    const docs = await collection
      .find({
        cacheVersion: currentCacheVersion,
        lastModified: { $ne: null },
      })
      .sort({ lastModified: -1 })
      .limit(50)
      .toArray()
    return docs.map((doc) => ({
      pageRef: doc._id,
      lastModified: doc.lastModified!,
    }))
  }
}

export interface PageDoc {
  _id: string
  cacheVersion: string

  data: PageDocFile | null
  lastModified: Date | null

  cached: Date
}
export interface PageDocFile {
  contents: string
  revision: string
}

export type PageData = Pick<PageDoc, 'data' | 'lastModified'>
export type PageDataInput = PageData

export function defineCollectionSchema<TDoc extends Document>(name: string) {
  return {
    name,
    of: (db: Db) => db.collection<TDoc>(name),
  }
}
