import { initializeApp } from 'firebase/app'
import { FirebaseAuthProvider } from '@contentsgarten/client-utils'
import type { ContentsgartenAuthProvider } from '@contentsgarten/client-utils'
import { queryClient } from './react-query'

const app = initializeApp({
  apiKey: 'AIzaSyCKZng55l411pps2HgMcuenMQou-NTQ0QE',
  authDomain: 'creatorsgarten-wiki.firebaseapp.com',
  projectId: 'creatorsgarten-wiki',
})

export const auth: ContentsgartenAuthProvider = new FirebaseAuthProvider(app)

let lastUid = ''
auth.listen(() => {
  const uid = auth.getCurrentUser()?.uid || ''
  if (uid !== lastUid) {
    lastUid = uid
    queryClient.invalidateQueries()
  }
})
