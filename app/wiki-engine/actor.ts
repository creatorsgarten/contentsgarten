import type { WikiCredential } from '~/auth'
import { getFile } from './files'

export class WikiActor {
  constructor(private credential?: WikiCredential) {}

  getFile(path: string) {
    return getFile(path)
  }
}
