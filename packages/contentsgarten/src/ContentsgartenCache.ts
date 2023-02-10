import Keyv from 'keyv'

export interface ContentsGartenCache {}

export class ContentsgartenDefaultCache implements ContentsGartenCache {
  private keyv: Keyv

  /**
   * @param url The Redis URL
   */
  constructor(url?: string) {
    this.keyv = new Keyv(url)
  }
}
