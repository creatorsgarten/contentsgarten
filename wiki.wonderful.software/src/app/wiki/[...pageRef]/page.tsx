import { createServerSideClient } from '@contentsgarten/server-utils'
import { config, getInstance } from '@/app/api/contentsgarten/[action]/route'
import { WikiClientSidePage } from './WikiClientSidePage'
import { csChatThaiUi, sourceSansPro } from '@/typography'
import clsx from 'clsx'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

interface WikiPage {
  params: {
    pageRef: string
  }
}
export default async function WikiPage(props: WikiPage) {
  const { pageRef } = props.params
  const client = createServerSideClient(
    config.testing.BACKEND === 'production'
      ? 'https://wiki.creatorsgarten.org'
      : getInstance(),
    '/api/contentsgarten',
  )
  const page = await client.view.query({
    pageRef: String(pageRef),
    withFile: false,
  })
  return (
    <main
      className={clsx(
        'font-prose',
        sourceSansPro.variable,
        csChatThaiUi.variable,
      )}
    >
      <WikiClientSidePage page={page} />
    </main>
  )
}
