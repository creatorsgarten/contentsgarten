/**
 * A wiki page represents a rendered wiki page.
 * It can be backed by a file, or generated dynamically.
 * If it is backed by a file, it can be edited.
 */
export interface WikiPage {
  pageRef: string
  content: string
  file?: WikiFileRef
}

/**
 * A wiki file represents a file that is part of a wiki.
 */
export interface WikiFileRef {
  path: string
  sha?: string
}

export interface WikiContext {
  writeDiagnosticLog(message: string): void
}

export interface WikiFileSystem {
  getFile: (context: WikiContext, path: string) => Promise<GetFileResult>
  putFile: (
    context: WikiContext,
    path: string,
    options: PutFileOptions,
  ) => Promise<PutFileResult>
}

export type GetFileResult = GetFileResultFound | GetFileResultNotFound

export interface GetFileResultFound {
  found: true
  content: string
  sha: string
}

export interface GetFileResultNotFound {
  found: false
}

export interface PutFileOptions {
  content: string
  message: string
  userId?: number
  sha?: string
}

export interface PutFileResult {
  sha: string
}
