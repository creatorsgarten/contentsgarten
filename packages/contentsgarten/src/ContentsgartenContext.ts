import type { ContentsgartenConfig } from './ContentsgartenConfig'
import type { GlobalContext, RequestContext } from './RequestContext'

export interface ContentsgartenContext extends RequestContext {
  global: ContentsgartenGlobalContext
  config: ContentsgartenConfig
  authToken?: string
}

export interface ContentsgartenGlobalContext extends GlobalContext {}
