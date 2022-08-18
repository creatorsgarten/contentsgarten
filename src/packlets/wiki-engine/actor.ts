import type { WikiAuthState, WikiCredential } from '../wiki-auth'
import { verifyIdToken } from '../wiki-auth'
import type {
  GetFileResult,
  WikiContext,
  WikiFileSystem,
  WikiPage,
} from './types'
import { defaultFileSystem } from './files'
import pMemoize from 'p-memoize'
import { get } from 'lodash-es'
import { createLiquidEngine } from './liquid'

export class WikiActor implements WikiContext {
  private memoizedGetFile: (path: string) => Promise<GetFileResult>
  private memoizedGetAuthState: () => Promise<WikiAuthState>
  private fileSystem: WikiFileSystem
  public diagnosticLog: string[] = []
  private startTime = Date.now()

  constructor(private credential?: WikiCredential) {
    this.fileSystem = defaultFileSystem
    this.memoizedGetFile = pMemoize((path) =>
      this.fileSystem.getFile(this, path),
    )
    this.memoizedGetAuthState = pMemoize(() => this.doGetAuthState())
  }

  writeDiagnosticLog(message: string): void {
    this.diagnosticLog.push(`[${Date.now() - this.startTime}ms] ${message}`)
  }

  async doGetAuthState(): Promise<WikiAuthState> {
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

  getAuthState() {
    return this.memoizedGetAuthState()
  }

  async getPage(path: string): Promise<WikiPage> {
    const filePath = this.getFilePath(path)
    const engine = createLiquidEngine(this, this.fileSystem)
    const file = await this.getFile(filePath)
    return {
      path,
      file: {
        path: filePath,
        sha: file.found ? file.sha : undefined,
      },
      content: file.found
        ? await engine.renderFile(path)
        : //Buffer.from(file.content, 'base64').toString()
          '(This page currently does not exist)',
    }
  }

  async updatePage(
    path: string,
    options: UpdatePageOptions,
  ): Promise<UpdatePageResult> {
    const filePath = this.getFilePath(path)
    const authState = await this.getAuthState()
    if (!authState.authenticated) {
      return {
        ok: false,
        reason: {
          code: 400,
          message: 'Not authenticated',
        },
      }
    }
    if (authState.user.id !== 193136) {
      return {
        ok: false,
        reason: {
          code: 403,
          message: 'Not authorized',
        },
      }
    }
    const result = await this.fileSystem.putFile(this, filePath, {
      content: Buffer.from(options.content).toString('base64'),
      sha: options.sha,
      message: `Update page ${path}`,
      userId: authState.user.id,
    })
    return {
      ok: true,
      sha: result.sha,
    }
  }

  private getFilePath(path: string) {
    return 'wiki/' + path + '.md.liquid'
  }
}

export interface UpdatePageOptions {
  content: string
  sha?: string
}

export type UpdatePageResult = UpdatePageSuccessResult | UpdatePageFailureResult

interface UpdatePageSuccessResult {
  ok: true
  sha: string
}

interface UpdatePageFailureResult {
  ok: false
  reason: Reason
}

interface Reason {
  code: number
  message: string
}
