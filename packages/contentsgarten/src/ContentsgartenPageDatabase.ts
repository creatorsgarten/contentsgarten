import { Document, Db } from 'mongodb'

const PageCollection = defineCollectionSchema<PageDoc>('pages')

export interface ContentsgartenPageDatabase {
  getCached(pageRef: string): Promise<PageData | null>
  save(pageRef: string, input: PageDataInput): Promise<PageData>
}

export class MongoDBPageDatabase implements ContentsgartenPageDatabase {
  constructor(private db: Db) {}
  async getCached(pageRef: string): Promise<PageData | null> {
    const collection = PageCollection.of(this.db)
    const doc = await collection.findOne({ _id: pageRef })
    if (!doc) {
      return null
    }
    return doc
  }
  async save(pageRef: string, input: PageDataInput): Promise<PageData> {
    const collection = PageCollection.of(this.db)
    const newDoc = {
      _id: pageRef,
      contents: input.contents,
      revision: input.revision,
      lastModified: input.lastModified,
      cached: new Date(),
    }
    await collection.replaceOne({ _id: pageRef }, newDoc, { upsert: true })
    return newDoc
  }
}

export interface PageDoc {
  _id: string

  contents: string | null
  revision: string | null
  lastModified: Date | null

  cached: Date
}

export type PageData = Pick<PageDoc, 'contents' | 'revision' | 'lastModified'>
export type PageDataInput = PageData

export function defineCollectionSchema<TDoc extends Document>(name: string) {
  return {
    name,
    of: (db: Db) => db.collection<TDoc>(name),
  }
}
