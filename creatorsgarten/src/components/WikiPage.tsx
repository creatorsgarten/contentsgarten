import { Markdown } from '@contentsgarten/markdown'
import type { GetPageResult } from 'contentsgarten'
import { FC, Suspense, lazy } from 'react'
import { TrpcProvider, trpc } from '../utils/trpc'
import { clsx } from 'clsx'

const Editor = lazy(() => import('./Editor'))

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
    <>
      <h1>
        {page.title}
        {!!page.file && (
          <Suspense fallback={<></>}>
            <Editor />
          </Suspense>
        )}
      </h1>
      <Markdown
        className={clsx(
          'prose-h1:text-4xl prose-h1:mt-12 prose-h1:font-medium',
          freshPageQuery.data && freshPageQuery.isRefetching && 'opacity-50',
        )}
        text={page.content}
      />
    </>
  )
}
