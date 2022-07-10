import type { WikiAuthState, WikiCredential } from '~/auth'
import { verifyIdToken } from '~/auth'
import { getCredentialFromRequest } from '~/auth'
import type { WikiPage } from './types'
import type { GetFileResult } from './files'
import { getFile } from './files'
import pMemoize from 'p-memoize'
import { get } from 'lodash-es'

export class WikiActor {
  private memoizedGetFile: (path: string) => Promise<GetFileResult>

  constructor(private credential?: WikiCredential) {
    this.memoizedGetFile = pMemoize((path) => getFile(path))
  }

  static async fromRequest(request: Request) {
    const credential = await getCredentialFromRequest(request)
    return new WikiActor(credential)
  }

  async getAuthState(): Promise<WikiAuthState> {
    try {
      if (!this.credential) {
        return {
          authenticated: false,
          reason: 'No credential provided',
        }
      }
      const projectId = 'creatorsgarten-wiki'
      const result = await verifyIdToken(projectId, this.credential.idToken)
      const id = +get(result.payload, [
        'firebase',
        'identities',
        'github.com',
        0,
      ])
      if (!id) {
        return {
          authenticated: false,
          reason: 'The current user did not log in with GitHub',
        }
      }
      const name =
        (get(result.payload, ['name']) as string) ||
        (get(result.payload, ['email']) as string) ||
        'UID: ' + get(result.payload, ['sub'])
      const uid = get(result.payload, ['sub']) as string
      return {
        authenticated: true,
        user: { id, name, uid },
      }
    } catch (error) {
      return {
        authenticated: false,
        reason: `Error while verifying credential: ${error}`,
      }
    }
  }

  getFile(path: string) {
    return this.memoizedGetFile(path)
  }

  async getPage(path: string): Promise<WikiPage> {
    const filePath = this.getFilePath(path)
    const file = await this.getFile(filePath)
    return {
      path,
      file: {
        path: filePath,
        sha: file.found ? file.sha : undefined,
      },
      content: file.found
        ? Buffer.from(file.content, 'base64').toString()
        : '(This page currently does not exist)',
    }
  }

  async updatePage(
    path: string,
    options: UpdatePageOptions,
  ): Promise<UpdatePageResult> {
    const filePath = this.getFilePath(path)
    return { sha: 'dymmy' }
  }

  private getFilePath(path: string) {
    return 'wiki/' + path + '.md.liquid'
  }
}

export interface UpdatePageOptions {
  content: string
  sha?: string
}

export interface UpdatePageResult {
  sha: string
}
