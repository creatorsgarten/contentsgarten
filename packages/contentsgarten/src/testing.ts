import fs from 'fs'
import path from 'path'
import { createHash } from 'crypto'
import { ContentsgartenStorage } from './ContentsgartenStorage'
import { ContentsgartenAuth } from './ContentsgartenAuth'
import { ContentsgartenTeamResolver } from './ContentsgartenTeamResolver'
import { Contentsgarten } from './Contentsgarten'
import { ContentsgartenPageDatabase } from './ContentsgartenPageDatabase'

export namespace testing {
  export function createFakeStorage(): ContentsgartenStorage {
    return {
      async getFile(ctx, filePath) {
        const fsPath = getFsPath(filePath)
        if (fs.existsSync(fsPath)) {
          const buffer = fs.readFileSync(fsPath)
          return { content: buffer, revision: hashBuffer(buffer) }
        }
        const fixturePath = `fixtures/contents/${filePath}`
        if (fs.existsSync(fixturePath)) {
          const buffer = fs.readFileSync(fixturePath)
          return { content: buffer, revision: hashBuffer(buffer) }
        }
        return undefined
      },
      async listFiles(ctx) {
        return []
      },
      async putFile(ctx, filePath, options) {
        const fsPath = getFsPath(filePath)
        fs.mkdirSync(path.dirname(fsPath), { recursive: true })
        const buffer = options.content
        fs.writeFileSync(fsPath, buffer)
        return {
          revision: hashBuffer(buffer),
          lastModified: new Date().toISOString(),
        }
      },
    }

    function getFsPath(filePath: string) {
      return `.data/contents/${filePath}`
    }

    function hashBuffer(buffer: Buffer) {
      return createHash('sha1').update(buffer).digest('hex')
    }
  }

  export function createFakePageDatabase(): ContentsgartenPageDatabase {
    const docs = new Map<string, any>()
    return {
      async getCached(pageRef) {
        return docs.get(pageRef) || null
      },
      async save(pageRef, input) {
        const newDoc = {
          _id: pageRef,
          data: input.data,
          lastModified: input.lastModified,
          cached: new Date(),
        }
        docs.set(pageRef, newDoc)
        return newDoc
      },
      async getRecentlyChangedPages() {
        return Array.from(docs.values())
          .filter((a) => a.lastModified)
          .sort((a, b) => b.lastModified - a.lastModified)
          .map((a) => ({
            pageRef: a._id,
            lastModified: a.lastModified,
          }))
      },
    }
  }

  export function createFakeAuth(): ContentsgartenAuth {
    return {
      async getAuthState(authToken) {
        if (authToken?.startsWith('fake:')) {
          const userId = authToken.slice('fake:'.length)
          return {
            authenticated: true,
            user: {
              id: parseInt(userId, 10) || 1,
              name: 'Fake user ' + userId,
              uid: userId,
            },
          }
        }
        return {
          authenticated: false,
          reason: 'Not authenticated',
        }
      },
    }
  }

  export function createFakeTeamResolver(): ContentsgartenTeamResolver {
    return {
      async checkMembership(ctx, userId, ownerAndTeamSlug) {
        return false
      },
    }
  }

  export function createFakeInstance() {
    const contentsgarten = new Contentsgarten({
      storage: createFakeStorage(),
      auth: createFakeAuth(),
      teamResolver: createFakeTeamResolver(),
      pageDatabase: createFakePageDatabase(),
    })
    return contentsgarten
  }
}
