import { Document, Db } from 'mongodb'
import { z } from 'zod'
import { PageRefRegex } from './PageRefRegex'
import { escapeRegExp } from 'lodash-es'

const PageCollection = defineCollectionSchema<PageDoc>('pages')
const currentCacheVersion = 'v3'

export const PageDatabaseQuery = z.object({
  match: z
    .record(z.union([z.string(), z.array(z.string())]))
    .optional()
    .describe(
      'Only return pages that have front-matter matching these properties.',
    ),
  prefix: z
    .string()
    .regex(PageRefRegex)
    .regex(/\/$/, 'Prefix must end with a slash')
    .optional()
    .describe(
      'Only return pages with this prefix. The prefix must end with a slash.',
    ),
})
export type PageDatabaseQuery = z.infer<typeof PageDatabaseQuery>
export interface PageDatabaseQueryResult {
  count: number
  results: PageDatabaseQueryResultItem[]
  explain?: any
}
export interface PageDatabaseQueryResultItem {
  lastModified: Date | null
  pageRef: string
  frontMatter: Record<string, any>
}

export interface ContentsgartenPageDatabase {
  getCached(pageRef: string): Promise<PageData | null>
  save(pageRef: string, input: PageDataInput): Promise<PageData>
  getRecentlyChangedPages(): Promise<PageListingItem[]>
  queryPages(query: PageDatabaseQuery): Promise<PageDatabaseQueryResult>
  checkTypo(normalized: string): Promise<string[]>
}

export interface PageListingItem {
  pageRef: string
  lastModified: Date
}
const explainResult = z.object({
  executionStats: z.object({
    executionTimeMillis: z.any(),
    totalKeysExamined: z.any(),
    totalDocsExamined: z.any(),
  }),
})

export class MongoDBPageDatabase implements ContentsgartenPageDatabase {
  constructor(private db: Db) {
    this.createIndex().catch((err) => {
      console.error('Failed to create index', err)
    })
  }
  async createIndex() {
    const collection = PageCollection.of(this.db)
    return Promise.all([
      collection.createIndex({
        cacheVersion: 1,
        lastModified: -1,
      }),
      collection.createIndex({
        cacheVersion: 1,
        'aux.keyValues': 1,
        lastModified: -1,
      }),
      collection.createIndex({
        cacheVersion: 1,
        'aux.normalized': 1,
      }),
    ])
  }
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
      lastModifiedBy: input.lastModifiedBy,
      aux: input.aux,
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
        data: { $ne: null },
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
  async queryPages(input: PageDatabaseQuery): Promise<PageDatabaseQueryResult> {
    const collection = PageCollection.of(this.db)
    const filter = compileQuery(input)
    const cursor = collection
      .find(filter)
      .project({
        _id: 1,
        lastModified: 1,
        'aux.frontmatter': 1,
      })
      .limit(1000)
    const results = (await cursor.toArray()) as PageDoc[]
    return {
      count: results.length,
      results: results.map((doc) => ({
        pageRef: doc._id,
        lastModified: doc.lastModified,
        frontMatter: doc.aux.frontmatter,
      })),
      explain: {
        filter: filter,
        executionStats: explainResult.parse(
          await cursor.explain('executionStats'),
        ),
      },
    }
  }
  async checkTypo(normalized: string): Promise<string[]> {
    const collection = PageCollection.of(this.db)
    const cursor = collection
      .find({
        cacheVersion: currentCacheVersion,
        'aux.normalized': normalized,
        data: { $ne: null },
      })
      .project({ _id: 1 })
      .limit(10)
    const results = await cursor.toArray()
    return results.map((doc) => doc._id)
  }
}

function compileQuery(input: PageDatabaseQuery): any {
  let ands: any[] = [
    {
      cacheVersion: currentCacheVersion,
      data: { $ne: null },
    },
  ]
  if (input.match) {
    ands.push(
      ...Object.entries(input.match).map(([key, value]) => {
        const f = (v: string) => `${key}=${v}`
        if (Array.isArray(value)) {
          return { 'aux.keyValues': { $in: value.map(f) } }
        }
        return { 'aux.keyValues': f(value) }
      }),
    )
  }
  if (input.prefix) {
    ands.push({
      _id: { $regex: `^${escapeRegExp(input.prefix)}` },
    })
  }
  return { $and: ands }
}

export interface PageDoc {
  _id: string
  cacheVersion: string

  data: PageDocFile | null
  lastModified: Date | null
  lastModifiedBy: string[]

  cached: Date
  aux: PageAuxiliaryData
}
export interface PageDocFile {
  contents: string
  revision: string
}
export interface PageAuxiliaryData {
  frontmatter: Record<string, any>
  normalized?: string
  keyValues?: string[]
}

export type PageData = Pick<
  PageDoc,
  'data' | 'lastModified' | 'lastModifiedBy' | 'aux'
>
export type PageDataInput = PageData

export function defineCollectionSchema<TDoc extends Document>(name: string) {
  return {
    name,
    of: (db: Db) => db.collection<TDoc>(name),
  }
}
