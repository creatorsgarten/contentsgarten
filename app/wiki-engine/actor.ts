import type { WikiCredential } from '~/auth'
import type { WikiPage } from './types'
import type { GetFileResult } from './files'
import { getFile } from './files'
import pMemoize from 'p-memoize'

export class WikiActor {
  private memoizedGetFile: (path: string) => Promise<GetFileResult>

  constructor(private credential?: WikiCredential) {
    this.memoizedGetFile = pMemoize((path) => getFile(path))
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
