import type { ContentsgartenConfig } from './ContentsgartenConfig'
import type { AppContext, RequestContext } from './RequestContext'

export interface ContentsgartenRequestContext extends RequestContext {
  app: ContentsgartenAppContext
  authToken?: string
}

export interface ContentsgartenAppContext
  extends AppContext,
    ContentsgartenConfig {}
