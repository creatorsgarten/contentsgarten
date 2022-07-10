import cookie from 'cookie'
import type { WikiCredential } from './types'

export async function getCredentialFromRequest(
  request: Request,
): Promise<WikiCredential | undefined> {
  return getCredentialFromAuthorizationHeader() || getCredentialFromCookie()

  function getCredentialFromAuthorizationHeader(): WikiCredential | undefined {
    const auth = request.headers.get('Authorization')
    if (!auth) {
      return
    }
    const idToken = auth.split(' ')[1]
    if (!idToken) return
    return { idToken }
  }

  function getCredentialFromCookie(): WikiCredential | undefined {
    const cookies = cookie.parse(request.headers.get('Cookie') || '')
    const idToken = cookies['contentsgarten_id_token']
    if (!idToken) return
    return { idToken }
  }
}
