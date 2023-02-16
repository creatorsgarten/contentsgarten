import { ContentsgartenStorage } from './ContentsgartenStorage'
import { ContentsgartenAuth } from './ContentsgartenAuth'
import { ContentsgartenCache } from './ContentsgartenCache'
import { ContentsgartenTeamResolver } from './ContentsgartenTeamResolver'

export interface ContentsgartenConfig {
  storage: ContentsgartenStorage
  auth: ContentsgartenAuth
  cache: ContentsgartenCache
  teamResolver: ContentsgartenTeamResolver
  pageFilePrefix?: string
  pageFileExtension?: string
}
