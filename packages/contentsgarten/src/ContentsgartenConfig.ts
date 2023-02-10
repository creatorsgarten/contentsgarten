import { ContentsgartenStorage } from './ContentsgartenStorage'
import { ContentsgartenAuth } from './ContentsgartenAuth'
import { ContentsGartenCache } from './ContentsgartenCache'

export interface ContentsgartenConfig {
  storage: ContentsgartenStorage
  auth: ContentsgartenAuth
  cache: ContentsGartenCache
}
