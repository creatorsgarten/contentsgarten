import Keyv from 'keyv'

export interface ContentsgartenCache {}

export class ContentsgartenDefaultCache implements ContentsgartenCache {
  private keyv: Keyv

  /**
   * @param url The Redis URL
   */
  constructor(url?: string) {
    this.keyv = new Keyv(url)
  }
}
