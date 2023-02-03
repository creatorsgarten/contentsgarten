import { jwtVerify } from 'jose'
import pMemoize from 'p-memoize'
import axios from 'axios'
import { has } from 'lodash-es'
import ExpiryMap from 'expiry-map'

const getPublicKeys = pMemoize(
  async () => {
    const response = await axios.get(
      'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com',
    )
    return response.data
  },
  { cache: new ExpiryMap(300000) },
)

const getPublicKey = pMemoize(async (kid) => {
  const { createPublicKey } = await import('crypto')
  const publicKeys = await getPublicKeys()
  if (!kid || !has(publicKeys, kid)) {
    throw new Error('Invalid kid')
  }
  return createPublicKey(publicKeys[kid])
})

export function verifyFirebaseIdToken(projectId: string, idToken: string) {
  return jwtVerify(idToken, async (header) => getPublicKey(header.kid), {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
  })
}
