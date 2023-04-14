import { ContentsgartenStorage } from './ContentsgartenStorage'
import { ContentsgartenAuth } from './ContentsgartenAuth'
import { ContentsgartenCache } from './ContentsgartenCache'
import { ContentsgartenTeamResolver } from './ContentsgartenTeamResolver'
import { ContentsgartenPageDatabase } from './ContentsgartenPageDatabase'

export interface ContentsgartenConfig {
  storage: ContentsgartenStorage
  pageDatabase: ContentsgartenPageDatabase
  auth: ContentsgartenAuth
  cache: ContentsgartenCache
  teamResolver: ContentsgartenTeamResolver
  pageFilePrefix?: string
  pageFileExtension?: string
}
