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
import { RedirectToPageRef, WikiError } from './throwables'

export class WikiInstance {
  constructor(public fileSystem: WikiFileSystem) {}
}

const defaultInstance = new WikiInstance(defaultFileSystem)

export class WikiActor implements WikiContext {
  private memoizedGetFile: (path: string) => Promise<GetFileResult>
  private memoizedGetAuthState: () => Promise<WikiAuthState>
  public diagnosticLog: string[] = []
  private startTime = Date.now()
  private wiki = defaultInstance

  constructor(private credential?: WikiCredential) {
    this.memoizedGetFile = pMemoize((path) =>
      this.wiki.fileSystem.getFile(this, path),
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

  async view(pageRef: string) {
    if (!pageRef) {
      throw new RedirectToPageRef('MainPage')
    }
    const page = await this.getPage(pageRef)
    return {
      pageTitle: pageRef,
      view: {
        page,
        editPath: `/wiki/${page.pageRef}?action=edit`,
      },
    }
  }

  async edit(pageRef: string) {
    if (!pageRef) {
      throw new WikiError(400, 'MISSING_SLUG', 'No slug provided')
    }
    const page = await this.getPage(pageRef)
    if (!page.file) {
      throw new WikiError(
        400,
        'NO_ASSOCIATED_FILE',
        'This page does does not have an associated file',
      )
    }
    const file = await this.getFile(page.file.path)
    return {
      pageTitle: `${file.found ? 'Editing' : 'Creating'} ${pageRef}`,
      edit: {
        formTarget: `/wiki/${page.pageRef}?action=edit`,
        apiTarget: `/api/wiki/${page.pageRef}`,
        gitHubEditPath: `https://github.dev/creatorsgarten/contentsgarten-wiki/blob/main/${page.file.path}`,
        content: file.found
          ? Buffer.from(file.content, 'base64').toString()
          : '',
        sha: file.found ? file.sha : undefined,
      },
    }
  }

  async update(pageRef: string, options: UpdateOptions) {
    const result = await this.updatePage(pageRef, options)
    if (options.redirect === 'view') {
      throw new RedirectToPageRef(pageRef)
    }
    return result
  }

  private async getPage(pageRef: string): Promise<WikiPage> {
    const filePath = this.getFilePath(pageRef)
    const engine = createLiquidEngine(this, this.wiki.fileSystem)
    const file = await this.getFile(filePath)
    return {
      pageRef,
      file: {
        path: filePath,
        sha: file.found ? file.sha : undefined,
      },
      content: file.found
        ? await engine.renderFile(pageRef)
        : //Buffer.from(file.content, 'base64').toString()
          '(This page currently does not exist)',
    }
  }

  private async updatePage(
    pageRef: string,
    options: UpdatePageOptions,
  ): Promise<UpdatePageResult> {
    const filePath = this.getFilePath(pageRef)
    const authState = await this.getAuthState()
    if (!authState.authenticated) {
      throw new WikiError(401, 'UNAUTHENTICATED', 'Not authenticated')
    }
    if (authState.user.id !== 193136) {
      throw new WikiError(403, 'FORBIDDEN', 'Not allowed to edit page')
    }
    const result = await this.wiki.fileSystem.putFile(this, filePath, {
      content: Buffer.from(options.content).toString('base64'),
      sha: options.sha,
      message: `Update page ${pageRef}`,
      userId: authState.user.id,
    })
    return { sha: result.sha }
  }

  private getFilePath(pageRef: string) {
    return 'wiki/' + pageRef + '.md.liquid'
  }
}

export interface UpdatePageOptions {
  content: string
  sha?: string
}

export interface UpdateOptions extends UpdatePageOptions {
  redirect?: 'view'
}

export interface UpdatePageResult {
  sha: string
}
