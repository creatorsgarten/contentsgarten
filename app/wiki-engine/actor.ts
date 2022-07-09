import type { WikiCredential } from '~/auth'
import { getFile } from './files'
import { WikiPage } from './types'

export class WikiActor {
  constructor(private credential?: WikiCredential) {}

  getFile(path: string) {
    return getFile(path)
  }

  async getPage(path: string): Promise<WikiPage> {
    const filePath = 'wiki/' + path + '.md.liquid'
    const file = await this.getFile(filePath)
    return {
      path,
      file: {
        path: filePath,
        sha: file.found ? file.sha : undefined,
      },
      content: file.found ? Buffer.from(file.content, 'base64').toString() : '',
    }
  }
}
