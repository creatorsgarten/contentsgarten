import { ContentsgartenStorage } from './ContentsgartenStorage'
import { ContentsgartenAuth } from './ContentsgartenAuth'
import { ContentsgartenCache } from './ContentsgartenCache'

export interface ContentsgartenConfig {
  storage: ContentsgartenStorage
  auth: ContentsgartenAuth
  cache: ContentsgartenCache
}
