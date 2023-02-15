import { Markdown } from '@contentsgarten/markdown'
import type { GetPageResult } from 'contentsgarten'
import type { FC } from 'react'
import { TrpcProvider, trpc } from 'src/utils/trpc'
import { clsx } from 'clsx'

export interface WikiPage {
  page: GetPageResult
}

export const WikiPage: FC<WikiPage> = (props) => {
  return (
    <TrpcProvider>
      <WikiPageInner {...props} />
    </TrpcProvider>
  )
}
export const WikiPageInner: FC<WikiPage> = (props) => {
  const stalePage = props.page
  const freshPageQuery = trpc.view.useQuery({
    pageRef: stalePage.pageRef,
    revalidate: true,
  })
  const page = freshPageQuery.data ?? stalePage
  return (
    <Markdown
      className={clsx(
        'prose-h1:text-4xl prose-h1:mt-12 prose-h1:font-medium',
        freshPageQuery.data && freshPageQuery.isRefetching && 'opacity-50',
      )}
      text={page.content}
    />
  )
}
