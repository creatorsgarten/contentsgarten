export class WikiThrowable extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'WikiThrowable'
  }
}

export class WikiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message)
    this.name = 'WikiError'
  }
}

export class RedirectToPageRef extends WikiThrowable {
  constructor(public pageRef: string) {
    super(`Redirect to ${pageRef}`)
    this.name = 'RedirectToPageRef'
  }
}
