import { ContentsgartenStorage } from './ContentsgartenStorage'
import { ContentsgartenAuth } from './ContentsgartenAuth'
import { ContentsgartenTeamResolver } from './ContentsgartenTeamResolver'
import { ContentsgartenPageDatabase } from './ContentsgartenPageDatabase'
import { Authorizer } from './Authorizer'

export interface ContentsgartenConfig {
  storage: ContentsgartenStorage
  pageDatabase: ContentsgartenPageDatabase
  auth: ContentsgartenAuth
  teamResolver: ContentsgartenTeamResolver
  pageFilePrefix?: string
  pageFileExtension?: string
  authorizer: Authorizer
}
