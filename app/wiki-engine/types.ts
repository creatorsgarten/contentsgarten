/**
 * A wiki page represents a rendered wiki page.
 * It can be backed by a file, or generated dynamically.
 * If it is backed by a file, it can be edited.
 */
export interface WikiPage {
  path: string
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
