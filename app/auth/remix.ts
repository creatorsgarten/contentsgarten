import type { WikiCredential } from './types'

export function getCredentialFromRequest(
  request: Request,
): WikiCredential | undefined {
  const auth = request.headers.get('Authorization')
  if (!auth) {
    return
  }
  const token = auth.split(' ')[1]
  if (!token) {
    return
  }
  return {
    idToken: token,
  }
}
