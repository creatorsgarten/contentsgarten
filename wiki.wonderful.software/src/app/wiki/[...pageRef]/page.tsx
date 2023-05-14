import { localLink } from '@contentsgarten/server-utils'
import { config, getInstance } from '@/app/api/contentsgarten/[action]/route'
import { WikiClientSidePage } from './WikiClientSidePage'
import { csChatThaiUi, sourceSansPro } from '@/typography'
import clsx from 'clsx'
import { createTRPCProxyClient, httpLink } from '@trpc/client'
import { ContentsgartenRouter } from 'contentsgarten'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

function getClient() {
  if (config.testing.BACKEND === 'production') {
    return createTRPCProxyClient<ContentsgartenRouter>({
      links: [httpLink({ url: 'https://wiki.creatorsgarten.org' })],
    })
  }
  return createTRPCProxyClient<ContentsgartenRouter>({
    links: [localLink(ContentsgartenRouter, getInstance().createContext({}))],
  })
}

interface WikiPage {
  params: {
    pageRef: string
  }
}
export default async function WikiPage(props: WikiPage) {
  const { pageRef } = props.params
  const client = getClient()
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
