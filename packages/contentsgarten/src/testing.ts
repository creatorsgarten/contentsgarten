import fs from 'fs'
import path from 'path'
import { createHash } from 'crypto'
import { ContentsgartenStorage } from './ContentsgartenStorage'
import { ContentsgartenAuth } from './ContentsgartenAuth'
import { ContentsgartenTeamResolver } from './ContentsgartenTeamResolver'
import { Contentsgarten } from './Contentsgarten'
import { ContentsgartenDefaultCache } from './ContentsgartenCache'

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
        return { revision: hashBuffer(buffer) }
      },
    }

    function getFsPath(filePath: string) {
      return `.data/contents/${filePath}`
    }

    function hashBuffer(buffer: Buffer) {
      return createHash('sha1').update(buffer).digest('hex')
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
      cache: new ContentsgartenDefaultCache(),
      teamResolver: createFakeTeamResolver(),
    })
    return contentsgarten
  }
}
