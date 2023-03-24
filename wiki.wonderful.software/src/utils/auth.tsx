import { initializeApp } from 'firebase/app'
import { FirebaseAuthProvider } from '@contentsgarten/client-utils'
import type { ContentsgartenAuthProvider } from '@contentsgarten/client-utils'
import { queryClient } from './react-query'

const app = initializeApp({
  apiKey: 'AIzaSyARMFoJ_pvFwev2738Dn19BJogq1NqPcRQ',
  authDomain: 'wonderful-software.firebaseapp.com',
  projectId: 'wonderful-software',
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
